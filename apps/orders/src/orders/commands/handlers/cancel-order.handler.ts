import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { OrderEventStoreService } from '../../services/order-event-store.service';
import { OrderProjectionService } from '../../services/order-projection.service';
import { ORDER_DOMAIN_EVENT_TYPES } from '../../domain/order-doman-events';
import { CancelOrderCommand } from '../cancel-order.command';

@CommandHandler(CancelOrderCommand)
export class CancelOrderHandler implements ICommandHandler<CancelOrderCommand> {
  private readonly logger = new Logger(CancelOrderHandler.name);

  constructor(
    private readonly orderEventStoreService: OrderEventStoreService,

    private readonly orderProjectionService: OrderProjectionService,
  ) {}

  async execute(command: CancelOrderCommand) {
    this.logger.warn(
      `Order ${command.orderId} CANCELLED (reason: ${command.reason})`,
    );

    await this.orderEventStoreService.append(
      command.orderId,

      ORDER_DOMAIN_EVENT_TYPES.ORDER_CANCELLED,

      { orderId: command.orderId, reason: command.reason },
    );

    await this.orderProjectionService.applyEvent({
      type: ORDER_DOMAIN_EVENT_TYPES.ORDER_CANCELLED,

      payload: { orderId: command.orderId, reason: command.reason },

      aggregateId: command.orderId,
    });
  }
}
