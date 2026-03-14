import { Body, Controller, Get, Logger, Param, Post } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import {
  PaymentFailedEvent,
  PaymentSuccessEvent,
  ROUTING_KEYS,
} from '@app/shared';

@Controller('orders')
export class OrdersController {
  private readonly logger = new Logger(OrdersController.name);

  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async create(@Body() createOrderDto: CreateOrderDto) {
    return await this.ordersService.createOrder(createOrderDto);
  }

  @Get()
  async findAll() {
    return this.ordersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @EventPattern(ROUTING_KEYS.PAYMENT_SUCCESS)
  async handlePaymentSuccess(
    @Payload() event: PaymentSuccessEvent,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMessage = context.getMessage();
    try {
      this.logger.log(`Received payment success for order: ${event.orderId}`);
      await this.ordersService.updateOrderStatus(event.orderId, 'CONFIRMED');
      channel.ack(originalMessage);
    } catch (error) {
      this.logger.error(`Failed to update order status`, error);
      channel.nack(originalMessage, false, false);
    }
  }

  @EventPattern(ROUTING_KEYS.PAYMENT_FAILED)
  async handlePaymentFailed(
    @Payload() event: PaymentFailedEvent,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMessage = context.getMessage();

    try {
      this.logger.log(`Received payment falied for order: ${event.orderId}`);
      await this.ordersService.updateOrderStatus(event.orderId, 'FAILED');
      channel.ack(originalMessage);
    } catch (error) {
      this.logger.error(`Failed to update order status`, error);
      channel.nack(originalMessage, false, false);
    }
  }
}
