import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { Record } from '../schemas/record.schema';
import {
  CreateRecordRequestDTO,
  SearchRecordsRequestDTO,
  UpdateRecordRequestDTO,
} from '../dtos';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class RecordService {
  private readonly logger = new Logger(RecordService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @InjectModel('Record') private readonly recordModel: Model<Record>,
  ) {}

  async create(data: CreateRecordRequestDTO) {
    const record = await this.recordModel.findOne({
      artist: data.artist,
      album: data.album,
      category: data.category,
    });

    if (record) {
      throw new ConflictException('record already exists');
    }

    const tracklist = await this.fetchTracklist(data.mbid);

    return this.recordModel.create({
      artist: data.artist,
      album: data.album,
      price: data.price,
      qty: data.qty,
      format: data.format,
      category: data.category,
      mbid: data.mbid,
      tracklist,
    });
  }

  private async fetchTracklist(mbid?: string) {
    if (!mbid) {
      return [];
    }

    const result = [];

    try {
      const apiUrl = this.configService.get('apiUrl');
      const res = await lastValueFrom(
        this.httpService.get<{ media: { tracks: { title: string }[] }[] }>(
          `${apiUrl}/${mbid}?fmt=json&inc=recordings`,
        ),
      );

      res.data?.media?.forEach((mediaItem) => {
        mediaItem?.tracks?.forEach((item) => {
          if (item?.title) {
            result.push(item.title);
          }
        });
      });
    } catch (err) {
      this.logger.warn(`could not fetch mbid details`, err);
    }

    return result;
  }

  async update(
    id: string,
    data: UpdateRecordRequestDTO & { tracklist?: string[] },
  ) {
    const isValid = isValidObjectId(id);
    if (!isValid) {
      throw new BadRequestException('invalid id');
    }

    const record = await this.recordModel.findById(id);
    if (!record) {
      throw new NotFoundException('record not found');
    }

    if (data?.mbid && data?.mbid !== record.mbid) {
      data.tracklist = await this.fetchTracklist(data.mbid);
    }

    Object.assign(record, data);

    const updated = await this.recordModel.updateOne(record);
    if (!updated?.modifiedCount) {
      throw new InternalServerErrorException('failed to update record');
    }

    return record;
  }

  async search(input: SearchRecordsRequestDTO) {
    const { q, album, artist, format, category, limit = 10, page = 1 } = input;
    const searchQuery: any = {};
    let searchSort: any = {};

    if (q) {
      searchQuery.$or = [
        { $text: { $search: q } },
        { artist: { $regex: `^${q}` } },
        { album: { $regex: `^${q}` } },
        { category: { $regex: `^${q}` } },
      ];
      searchSort = { score: { $meta: 'textScore' } };
    }

    if (artist) {
      searchQuery.artist = { $regex: `^${artist}` };
    }

    if (album) {
      searchQuery.album = { $regex: `^${album}` };
    }

    if (format) {
      searchQuery.format = format;
    }

    if (category) {
      searchQuery.category = category;
    }

    const skip = (page - 1) * limit;

    const [count, records] = await Promise.all([
      this.recordModel.countDocuments(searchQuery),
      this.recordModel
        .find(searchQuery)
        .skip(skip)
        .limit(limit)
        .sort(q ? searchSort : {})
        .exec(),
    ]);

    const pageCount = Math.ceil(count / limit) || 1;
    const previousPage = page === 1 ? page : page - 1;
    const nextPage = page + 1 >= pageCount ? pageCount : page + 1;

    const result = {
      currentPage: page,
      previousPage,
      nextPage,
      pageCount,
      limit,
      records,
    };

    this.logger.debug(`returning from db...`);

    return result;
  }
}
