import { Controller, Get, Logger } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import {
  OrderCreatedEvent,
  PaymentFailedEvent,
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
}
