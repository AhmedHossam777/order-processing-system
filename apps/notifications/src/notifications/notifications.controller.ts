import { Controller, Logger } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import {
  InventoryFailedEvent,
  InventoryReservedEvent,
  OrderCreatedEvent,
  PaymentFailedEvent,
  PaymentRefundedEvent,
  PaymentSuccessEvent,
  ROUTING_KEYS,
} from '@app/shared';

@Controller()
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @EventPattern(ROUTING_KEYS.ORDER_NOTIFICATION)
  async handleOrderCreated(
    @Payload() event: OrderCreatedEvent,
    @Ctx() context: RmqContext,
  ) {
    const originalMessage = context.getMessage();
    const channel = context.getChannelRef();

    try {
      await this.notificationsService.handleOrderCreated(event);
      channel.ack(originalMessage);
    } catch (e) {
      this.logger.error(`Failed to process order notification`, e);
      channel.nack(originalMessage, false, false);
    }
  }

  @EventPattern(ROUTING_KEYS.PAYMENT_SUCCESS)
  async handlePaymentSuccess(
    @Payload() event: PaymentSuccessEvent,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMessage = context.getMessage();

    try {
      await this.notificationsService.handlePaymentSuccess(event);
      channel.ack(originalMessage);
    } catch (error) {
      this.logger.error(
        `Failed to process payment success notification`,
        error,
      );
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
      await this.notificationsService.handlePaymentFailed(event);
      channel.ack(originalMessage);
    } catch (error) {
      this.logger.error(
        `Failed to process payment failure notification`,
        error,
      );
      channel.nack(originalMessage, false, false);
    }
  }

  @EventPattern(ROUTING_KEYS.INVENTORY_RESERVED)
  async handleInventoryReserved(
    @Payload() event: InventoryReservedEvent,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    try {
      await this.notificationsService.handleInventoryReserved(event);
      channel.ack(context.getMessage());
    } catch (error) {
      this.logger.log(
        'Failed to process inventory reserved notification ',
        error,
      );
      channel.nack(context.getMessage(), false, false);
    }
  }

  @EventPattern(ROUTING_KEYS.PAYMENT_REFUNDED)
  async handlePaymentRefunded(
    @Payload() event: PaymentRefundedEvent,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    try {
      await this.notificationsService.handlePaymentRefunded(event);
      channel.ack(context.getMessage());
    } catch (error) {
      this.logger.log('Failed to process payment refund notification ', error);
      channel.nack(context.getMessage(), false, false);
    }
  }

  @EventPattern(ROUTING_KEYS.INVENTORY_FAILED)
  async handleInventoryFailed(
    @Payload() event: InventoryFailedEvent,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMessage = context.getMessage();
    try {
      await this.notificationsService.handleInventoryFailed(event);
      channel.ack(originalMessage);
    } catch (error) {
      this.logger.log('Failed to process inventory failed notification ', error);
      channel.nack(originalMessage, false, false);
    }
  }
}

