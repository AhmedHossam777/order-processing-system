import { Controller, Logger } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { PaymentSuccessEvent, ROUTING_KEYS } from '@app/shared';

@Controller()
export class InventoryController {
  private readonly logger = new Logger(InventoryController.name);

  constructor(private readonly inventoryService: InventoryService) {}

  @EventPattern(ROUTING_KEYS.PAYMENT_SUCCESS)
  async handlePaymentSuccess(
    @Payload() event: PaymentSuccessEvent,
    @Ctx() context: RmqContext,
  ) {
    const originalMessage = context.getMessage();
    const channel = context.getChannelRef();

    try {
      await this.inventoryService.reserveStock(event);
      channel.ack(originalMessage);
    } catch (e) {
      this.logger.error('Inventory error', e);
      channel.nack(originalMessage, false, false);
    }
  }
}
