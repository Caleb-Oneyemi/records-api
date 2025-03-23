import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsPositive, IsString } from 'class-validator';
import { RecordCategory, RecordFormat } from '../schemas/record.enum';

export class SearchRecordsRequestDTO {
  @ApiPropertyOptional({ description: 'the page number. default is 1' })
  @Type(() => Number)
  @IsPositive()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({
    description: 'the number of records to return. default is 10',
  })
  @Type(() => Number)
  @IsPositive()
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({
    description:
      'Search query (search across multiple fields like artist, album, category, etc.)',
    type: String,
  })
  @IsString()
  @IsOptional()
  q?: string;

  @ApiPropertyOptional({
    description: 'Filter by artist name',
    type: String,
  })
  @IsString()
  @IsOptional()
  artist?: string;

  @ApiPropertyOptional({
    description: 'Filter by album name',
    type: String,
  })
  @IsString()
  @IsOptional()
  album?: string;

  @ApiPropertyOptional({
    description: 'Filter by record format (Vinyl, CD, etc.)',
    type: String,
  })
  @IsEnum(RecordFormat)
  @IsOptional()
  format?: string;

  @ApiPropertyOptional({
    description: 'Filter by record category (e.g., Rock, Jazz)',
    type: String,
  })
  @IsEnum(RecordCategory)
  @IsOptional()
  category?: string;
}
