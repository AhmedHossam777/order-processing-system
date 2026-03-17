import { Body, Controller, Get, Logger, Param, Post } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import {
  InventoryReservedEvent,
  PaymentFailedEvent,
  PaymentRefundedEvent,
  ROUTING_KEYS,
} from '@app/shared';
import { OrderProjectionService } from './services/order-projection.service';
import { OrderEventStoreService } from './services/order-event-store.service';
import { ORDER_DOMAIN_EVENT_TYPES } from './domain/order-doman-events';

@Controller('orders')
export class OrdersController {
  private readonly logger = new Logger(OrdersController.name);

  constructor(private readonly ordersService: OrdersService, private readonly orderProjectionService: OrderProjectionService, private readonly orderEventStoreService: OrderEventStoreService) {}

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

  @EventPattern(ROUTING_KEYS.INVENTORY_RESERVED)
  async handleInventoryReserved(
    @Payload() event: InventoryReservedEvent,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMessage = context.getMessage();
    try {
      this.logger.log(`Received payment success for order: ${event.orderId}`);
      await this.orderEventStoreService.append(
        event.orderId,
        ORDER_DOMAIN_EVENT_TYPES.ORDER_COMPLETED,
        event,
      );
      await this.orderProjectionService.applyEvent({
        type: ORDER_DOMAIN_EVENT_TYPES.ORDER_COMPLETED,
        payload: event,
        aggregateId: event.orderId,
      });
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
      this.logger.warn(
        `Order ${event.orderId} FAILED (reason: ${event.reason})`,
      );
      await this.orderEventStoreService.append(
        event.orderId,
        ORDER_DOMAIN_EVENT_TYPES.ORDER_FAILED,
        event,  
      )
      await this.orderProjectionService.applyEvent({
        type: ORDER_DOMAIN_EVENT_TYPES.ORDER_FAILED,
        payload: event,
        aggregateId: event.orderId,
      });
      channel.ack(originalMessage);
    } catch (error) {
      this.logger.error(`Failed to update order status`, error);
      channel.nack(originalMessage, false, false);
    }
  }

  @EventPattern(ROUTING_KEYS.PAYMENT_REFUNDED)
  async handlePaymentRefunded(
    @Payload() event: PaymentRefundedEvent,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    try {
      this.logger.warn(
        `Order ${event.orderId} CANCELLED (Refunded: ${event.amount})`,
      );
      await this.orderEventStoreService.append(
        event.orderId,
        ORDER_DOMAIN_EVENT_TYPES.ORDER_CANCELLED,
        event,
      );
      await this.orderProjectionService.applyEvent({
        type: ORDER_DOMAIN_EVENT_TYPES.ORDER_CANCELLED,
        payload: event,
        aggregateId: event.orderId,
      });
      channel.ack(context.getMessage());
    } catch (error) {
      this.logger.error(`Failed to update order status`, error);

      channel.nack(context.getMessage(), false, false);
    }
  }
}
