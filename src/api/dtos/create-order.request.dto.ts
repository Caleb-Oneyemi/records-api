import { IsNotEmpty, IsNumber, Min, Max, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderRequestDTO {
  @ApiProperty({
    description: 'id of the record',
    type: String,
  })
  @IsMongoId()
  @IsNotEmpty()
  recordId: string;

  @ApiProperty({
    description: 'order quantity',
    type: Number,
  })
  @IsNumber()
  @Min(1)
  @Max(10000)
  qty: number;
}
