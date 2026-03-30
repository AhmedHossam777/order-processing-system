import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateOrderCommand } from '../create-order.command';
import { Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  NOTIFICATION_CLIENT,
  OrderCreatedEvent,
  PAYMENT_CLIENT,
  ROUTING_KEYS,
} from '@app/shared';
import { OrderProjectionService } from '../../services/order-projection.service';
import { OrderEventStoreService } from '../../services/order-event-store.service';
import { v4 as uuidv4 } from 'uuid';
import { ORDER_DOMAIN_EVENT_TYPES } from '../../domain/order-doman-events';

@CommandHandler(CreateOrderCommand)
export class CreateOrderHandler implements ICommandHandler<CreateOrderCommand> {
  private readonly logger = new Logger(CreateOrderHandler.name);
  constructor(
    private readonly orderEventStoreService: OrderEventStoreService,

    private readonly orderProjectionService: OrderProjectionService,

    @Inject(PAYMENT_CLIENT)
    private readonly paymentClient: ClientProxy,

    @Inject(NOTIFICATION_CLIENT)
    private readonly notificationClient: ClientProxy,
  ) {}

  async execute(command: CreateOrderCommand) {
    const orderId = uuidv4();

    const createOrderEvent = new OrderCreatedEvent(
      orderId,
      command.product,

      command.quantity,

      command.price,

      command.userId,
    );

    await this.orderEventStoreService.append(
      orderId,
      ORDER_DOMAIN_EVENT_TYPES.ORDER_CREATED,
      createOrderEvent,
    );

    await this.orderProjectionService.applyEvent({
      type: ORDER_DOMAIN_EVENT_TYPES.ORDER_CREATED,

      payload: createOrderEvent,

      aggregateId: orderId,
    });

    this.paymentClient.emit(ROUTING_KEYS.ORDER_CREATED, createOrderEvent);

    this.notificationClient.emit(
      ROUTING_KEYS.ORDER_NOTIFICATION,

      createOrderEvent,
    );
    this.logger.log(`Events published for order: ${orderId}`);
    return { id: orderId, ...command, status: 'PENDING' };
  }
}
