import { Test, TestingModule } from '@nestjs/testing';
import { RecordService } from './record.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import { of } from 'rxjs';
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { RecordCategory, RecordFormat } from '../schemas/record.enum';

const mockRecord = {
  _id: '60c72b2f5f1b2c001c8e4d53',
  artist: 'test artist',
  album: 'test album',
  price: 100,
  qty: 10,
  format: 'vinyl',
  category: 'rock',
  mbid: 'test-mbid',
  tracklist: ['Track 1', 'Track 2'],
};

const mockRecordModel = {
  findOne: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  updateOne: jest.fn(),
  countDocuments: jest.fn(),
  find: jest
    .fn()
    .mockReturnValue({ skip: jest.fn().mockReturnValue({ limit: jest.fn() }) }),
};

const mockHttpService = {
  get: jest.fn(() =>
    of({
      data: {
        media: [{ tracks: [{ title: 'Track 1' }, { title: 'Track 2' }] }],
      },
    }),
  ),
};

const mockConfigService = {
  get: jest.fn().mockImplementation((key) => {
    if (key === 'apiUrl') return 'http://mock-api.com';
    return null;
  }),
};

describe('RecordService', () => {
  let service: RecordService;
  let recordModel: typeof mockRecordModel;
  let httpService: typeof mockHttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecordService,
        { provide: HttpService, useValue: mockHttpService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: getModelToken('Record'), useValue: mockRecordModel },
      ],
    }).compile();

    service = module.get<RecordService>(RecordService);
    recordModel = module.get(getModelToken('Record'));
    httpService = module.get(HttpService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a record if it does not exist', async () => {
      recordModel.findOne.mockResolvedValue(null);
      recordModel.create.mockResolvedValue(mockRecord);

      const result = await service.create({
        artist: 'test artist',
        album: 'test album',
        price: 100,
        qty: 10,
        format: RecordFormat.VINYL,
        category: RecordCategory.ROCK,
        mbid: 'test-mbid',
      });

      expect(result).toEqual(mockRecord);
      expect(recordModel.findOne).toHaveBeenCalled();
      expect(recordModel.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if record already exists', async () => {
      recordModel.findOne.mockResolvedValue(mockRecord);

      await expect(
        service.create({
          artist: 'test artist',
          album: 'test album',
          price: 100,
          qty: 10,
          format: RecordFormat.VINYL,
          category: RecordCategory.ROCK,
          mbid: 'test-mbid',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should update a record successfully', async () => {
      recordModel.findById.mockResolvedValue(mockRecord);
      recordModel.updateOne.mockResolvedValue({ modifiedCount: 1 });

      const result = await service.update('60c72b2f5f1b2c001c8e4d53', {
        price: 150,
      });

      expect(result).toEqual({ ...mockRecord, price: 150 });
      expect(recordModel.findById).toHaveBeenCalled();
      expect(recordModel.updateOne).toHaveBeenCalled();
    });

    it('should throw NotFoundException if record does not exist', async () => {
      recordModel.findById.mockResolvedValue(null);

      await expect(
        service.update('60c72b2f5f1b2c001c8e4d53', { price: 150 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for invalid id', async () => {
      await expect(
        service.update('invalid-id', { price: 150 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw InternalServerErrorException if update fails', async () => {
      recordModel.findById.mockResolvedValue(mockRecord);
      recordModel.updateOne.mockResolvedValue({ modifiedCount: 0 });

      await expect(
        service.update('60c72b2f5f1b2c001c8e4d53', { price: 150 }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('search', () => {
    it('should return paginated search results', async () => {
      recordModel.countDocuments.mockResolvedValue(1);
      recordModel.find.mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([mockRecord]),
            }),
          }),
        }),
      });

      const result = await service.search({ q: 'test' });

      expect(result).toEqual({
        currentPage: 1,
        previousPage: 1,
        nextPage: 1,
        pageCount: 1,
        limit: 10,
        records: [mockRecord],
      });

      expect(recordModel.countDocuments).toHaveBeenCalled();
      expect(recordModel.find).toHaveBeenCalled();
    });

    it('should search records using full-text search when `q` is provided', async () => {
      recordModel.countDocuments.mockResolvedValue(1);
      recordModel.find.mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([mockRecord]),
            }),
          }),
        }),
      });

      await service.search({ q: 'test' });

      expect(recordModel.countDocuments).toHaveBeenCalledWith({
        $or: [
          { $text: { $search: 'test' } },
          { artist: { $regex: `^test` } },
          { album: { $regex: `^test` } },
          { category: { $regex: `^test` } },
        ],
      });

      expect(recordModel.find).toHaveBeenCalledWith({
        $or: [
          { $text: { $search: 'test' } },
          { artist: { $regex: `^test` } },
          { album: { $regex: `^test` } },
          { category: { $regex: `^test` } },
        ],
      });
    });

    it('should filter by artist when `artist` parameter is provided', async () => {
      recordModel.countDocuments.mockResolvedValue(1);
      recordModel.find.mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([mockRecord]),
            }),
          }),
        }),
      });

      await service.search({ artist: 'john' });

      expect(recordModel.countDocuments).toHaveBeenCalledWith({
        artist: { $regex: `^john` },
      });

      expect(recordModel.find).toHaveBeenCalledWith({
        artist: { $regex: `^john` },
      });
    });

    it('should filter by album when `album` parameter is provided', async () => {
      recordModel.countDocuments.mockResolvedValue(1);
      recordModel.find.mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([mockRecord]),
            }),
          }),
        }),
      });

      await service.search({ album: 'test album' });

      expect(recordModel.countDocuments).toHaveBeenCalledWith({
        album: { $regex: `^test album` },
      });

      expect(recordModel.find).toHaveBeenCalledWith({
        album: { $regex: `^test album` },
      });
    });

    it('should filter by format when `format` parameter is provided', async () => {
      recordModel.countDocuments.mockResolvedValue(1);
      recordModel.find.mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([mockRecord]),
            }),
          }),
        }),
      });

      await service.search({ format: 'vinyl', limit: 10, page: 1 });

      expect(recordModel.countDocuments).toHaveBeenCalledWith({
        format: 'vinyl',
      });

      expect(recordModel.find).toHaveBeenCalledWith({
        format: 'vinyl',
      });
    });

    it('should filter by category when `category` parameter is provided', async () => {
      recordModel.countDocuments.mockResolvedValue(1);
      recordModel.find.mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([mockRecord]),
            }),
          }),
        }),
      });

      await service.search({ category: 'rock' });

      expect(recordModel.countDocuments).toHaveBeenCalledWith({
        category: 'rock',
      });

      expect(recordModel.find).toHaveBeenCalledWith({
        category: 'rock',
      });
    });

    it('should correctly build query when multiple filters are provided', async () => {
      recordModel.countDocuments.mockResolvedValue(1);
      recordModel.find.mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([mockRecord]),
            }),
          }),
        }),
      });

      await service.search({
        artist: 'john',
        album: 'test',
        format: 'vinyl',
        category: 'rock',
      });

      expect(recordModel.countDocuments).toHaveBeenCalledWith({
        artist: { $regex: `^john` },
        album: { $regex: `^test` },
        format: 'vinyl',
        category: 'rock',
      });

      expect(recordModel.find).toHaveBeenCalledWith({
        artist: { $regex: `^john` },
        album: { $regex: `^test` },
        format: 'vinyl',
        category: 'rock',
      });
    });

    it('should return pageCount as 1 when there are no results', async () => {
      recordModel.countDocuments.mockResolvedValue(0);
      recordModel.find.mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });

      const result = await service.search({ limit: 10, page: 1 });

      expect(result.pageCount).toBe(1);
      expect(result.records).toEqual([]);
    });
  });

  describe('fetchTracklist', () => {
    it('should return a list of tracks', async () => {
      const result = await service['fetchTracklist']('test-mbid');

      expect(result).toEqual(['Track 1', 'Track 2']);
      expect(httpService.get).toHaveBeenCalledWith(
        'http://mock-api.com/test-mbid?fmt=json&inc=recordings',
      );
    });

    it('should return an empty array if mbid is not provided', async () => {
      const result = await service['fetchTracklist']();
      expect(result).toEqual([]);
    });

    it('should handle errors gracefully', async () => {
      httpService.get.mockImplementation(() => {
        throw new Error('API error');
      });

      const result = await service['fetchTracklist']('test-mbid');

      expect(result).toEqual([]);
      expect(httpService.get).toHaveBeenCalled();
    });
  });
});
