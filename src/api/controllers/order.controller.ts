import { Controller, Post, Body } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateOrderRequestDTO } from '../dtos';
import { OrderService } from '../services/order.service';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, description: 'order successfully created' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async create(@Body() request: CreateOrderRequestDTO) {
    return this.orderService.create(request);
  }
}
