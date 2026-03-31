import { Body, Controller, Get, Logger, Param, Post } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import {
  InventoryReservedEvent,
  PaymentFailedEvent,
  PaymentRefundedEvent,
  ROUTING_KEYS,
} from '@app/shared';

import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateOrderCommand } from './commands/create-order.command';
import { CompleteOrderCommand } from './commands/complete-order.command';
import { FailOrderCommand } from './commands/fail-order.command';
import { CancelOrderCommand } from './commands/cancel-order.command';
import { GetAllOrdersQuery } from './queries/get-all-orders.query';
import { GetOrderByIdQuery } from './queries/get-order-by-id.query';

@Controller('orders')
export class OrdersController {
  private readonly logger = new Logger(OrdersController.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  async create(@Body() createOrderDto: CreateOrderDto) {
    return await this.commandBus.execute(
      new CreateOrderCommand(
        createOrderDto.product,
        createOrderDto.quantity,
        createOrderDto.price,
        createOrderDto.userId,
      ),
    );
  }

  @Get()
  async findAll() {
    return this.commandBus.execute(
      this.queryBus.execute(new GetAllOrdersQuery()),
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.queryBus.execute(new GetOrderByIdQuery(id));
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

      await this.commandBus.execute(new CompleteOrderCommand(event.orderId));

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
      await this.commandBus.execute(
        new FailOrderCommand(event.orderId, event.reason),
      );
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
      await this.commandBus.execute(
        new CancelOrderCommand(event.orderId, event.reason),
      );
      channel.ack(context.getMessage());
    } catch (error) {
      this.logger.error(`Failed to update order status`, error);

      channel.nack(context.getMessage(), false, false);
    }
  }
}
