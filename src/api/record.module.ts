import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RecordController } from './controllers/record.controller';
import { RecordService } from './services/record.service';
import { Record, RecordSchema } from './schemas/record.schema';
import { HttpModule } from '@nestjs/axios';
import { Order, OrderSchema } from './schemas/order.schema';
import { OrderController } from './controllers/order.controller';
import { OrderService } from './services/order.service';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([
      { name: Record.name, schema: RecordSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
  ],
  controllers: [RecordController, OrderController],
  providers: [RecordService, OrderService],
})
export class RecordModule {}
