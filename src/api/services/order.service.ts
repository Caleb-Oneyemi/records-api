import {
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { CreateOrderRequestDTO } from '../dtos';
import { Order } from '../schemas/order.schema';
import { Record } from '../schemas/record.schema';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    @InjectModel('Order') private readonly orderModel: Model<Order>,
    @InjectModel('Record') private readonly recordModel: Model<Record>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async create({ recordId, qty }: CreateOrderRequestDTO) {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const record = await this.recordModel.findById(recordId).session(session);

      if (!record) {
        throw new NotFoundException('record not found');
      }

      if (record.qty < qty) {
        throw new UnprocessableEntityException('not enough records in stock');
      }

      const updatedRecord = await this.recordModel.findOneAndUpdate(
        { _id: recordId, qty: { $gte: qty } },
        { $inc: { qty: -qty } },
        { new: true, session },
      );

      if (!updatedRecord) {
        throw new UnprocessableEntityException('could not place order');
      }

      const result = await this.orderModel.create(
        [
          {
            recordId,
            qty,
          },
        ],
        { session },
      );

      await session.commitTransaction();
      session.endSession();

      return result;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();

      this.logger.warn(`order creation failed: ${err.message}`);
      throw new UnprocessableEntityException('could not place order');
    }
  }
}
