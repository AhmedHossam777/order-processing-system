import { Controller, Logger } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import {
  InventoryFailedEvent,
  OrderCreatedEvent,
  ROUTING_KEYS,
} from '@app/shared';

@Controller()
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);
  constructor(private readonly paymentsService: PaymentsService) {}

  @EventPattern(ROUTING_KEYS.ORDER_CREATED)
  async handleOrderCreated(
    @Payload() event: OrderCreatedEvent,
    @Ctx() context: RmqContext,
  ) {
    const originalMessage = context.getMessage();
    const channel = context.getChannelRef();

    try {
      await this.paymentsService.processOrderPayment(event);
      channel.ack(originalMessage);
      this.logger.log(`ACK: order ${event.orderId}`);
    } catch (e) {
      this.logger.error(`Payment processing failed `, e);
      channel.nack(originalMessage, false, false);
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
      await this.paymentsService.refundPayment(event);
      channel.ack(originalMessage);
    } catch (error) {
      this.logger.error(`Payment refund failed `, error);
      channel.nack(originalMessage, false, false);
    }
  }
}
