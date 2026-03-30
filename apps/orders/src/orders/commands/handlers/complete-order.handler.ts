import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CompleteOrderCommand } from '../complete-order.command';
import { Logger } from '@nestjs/common';
import { OrderEventStoreService } from '../../services/order-event-store.service';
import { OrderProjectionService } from '../../services/order-projection.service';
import { ORDER_DOMAIN_EVENT_TYPES } from '../../domain/order-doman-events';

@CommandHandler(CompleteOrderCommand)
export class CompleteOrderHandler implements ICommandHandler<CompleteOrderCommand> {
  private readonly logger = new Logger(CompleteOrderHandler.name);

  constructor(
    private readonly orderEventStoreService: OrderEventStoreService,

    private readonly orderProjectionService: OrderProjectionService,
  ) {}

  async execute(command: CompleteOrderCommand) {
    this.logger.log(`Completing order: ${command.orderId}`);

    await this.orderEventStoreService.append(
      command.orderId,
      ORDER_DOMAIN_EVENT_TYPES.ORDER_COMPLETED,
      { orderId: command.orderId },
    );

    await this.orderProjectionService.applyEvent({
      type: ORDER_DOMAIN_EVENT_TYPES.ORDER_COMPLETED,

      payload: { orderId: command.orderId },

      aggregateId: command.orderId,
    });
  }
}
