import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { OrderEventStoreService } from '../../services/order-event-store.service';
import { OrderProjectionService } from '../../services/order-projection.service';
import { ORDER_DOMAIN_EVENT_TYPES } from '../../domain/order-doman-events';
import { FailOrderCommand } from '../fail-order.command';

@CommandHandler(FailOrderCommand)
export class FailOrderHandler implements ICommandHandler<FailOrderCommand> {
  private readonly logger = new Logger(FailOrderHandler.name);

  constructor(
    private readonly orderEventStoreService: OrderEventStoreService,

    private readonly orderProjectionService: OrderProjectionService,
  ) {}

  async execute(command: FailOrderCommand) {
    this.logger.warn(
      `Order ${command.orderId} FAILED (reason: ${command.reason})`,
    );

    await this.orderEventStoreService.append(
      command.orderId,

      ORDER_DOMAIN_EVENT_TYPES.ORDER_FAILED,

      { orderId: command.orderId, reason: command.reason },
    );

    await this.orderProjectionService.applyEvent({
      type: ORDER_DOMAIN_EVENT_TYPES.ORDER_FAILED,

      payload: { orderId: command.orderId, reason: command.reason },

      aggregateId: command.orderId,
    });
  }
}
