import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Put,
  UseInterceptors,
} from '@nestjs/common';
import { Record } from '../schemas/record.schema';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateRecordRequestDTO } from '../dtos/create-record.request.dto';
import { UpdateRecordRequestDTO } from '../dtos/update-record.request.dto';
import { RecordService } from '../services/record.service';
import { SearchRecordsRequestDTO } from '../dtos';
import { CacheInterceptor, CacheKey } from '@nestjs/cache-manager';

@Controller('records')
@CacheKey('RECORDS')
@UseInterceptors(CacheInterceptor)
export class RecordController {
  constructor(private readonly recordService: RecordService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new record' })
  @ApiResponse({ status: 201, description: 'Record successfully created' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async create(@Body() request: CreateRecordRequestDTO): Promise<Record> {
    return this.recordService.create(request);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing record' })
  @ApiResponse({ status: 200, description: 'Record updated successfully' })
  @ApiResponse({ status: 500, description: 'Cannot find record to update' })
  async update(
    @Param('id') id: string,
    @Body() updateRecordDto: UpdateRecordRequestDTO,
  ): Promise<Record> {
    return this.recordService.update(id, updateRecordDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all records with optional filters' })
  @ApiResponse({
    status: 200,
    description: 'List of records',
    type: [Record],
  })
  async findAll(@Query() query: SearchRecordsRequestDTO) {
    return this.recordService.search(query);
  }
}
