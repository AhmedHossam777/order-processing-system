import { Injectable, Logger } from '@nestjs/common';
import { Notification } from './entities/notification.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  OrderCreatedEvent,
  PaymentFailedEvent,
  PaymentSuccessEvent,
} from '@app/shared';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async handleOrderCreated(event: OrderCreatedEvent): Promise<void> {
    const subject = 'Order Received';
    const body = `Your order ${event.orderId} for ${event.product} x${event.quantity} ($${event.quantity * event.price}) has been received.`;

    await this.saveAndSendNotification(
      event.userId,
      'ORDER_CREATED',
      subject,
      body,
      event.orderId,
    );
  }

  async handlePaymentSuccess(event: PaymentSuccessEvent): Promise<void> {
    const subject = 'Payment Confirmed';
    const body = `Payment of $${event.amount} confirmed. Transaction: ${event.transactionId}`;

    await this.saveAndSendNotification(
      event.userId,
      'PAYMENT_SUCCESS',
      subject,
      body,
      event.orderId,
    );
  }

  async handlePaymentFailed(event: PaymentFailedEvent): Promise<void> {
    const subject = 'Payment Failed';
    const body = `Payment of $${event.amount} for order ${event.orderId} failed. Reason: ${event.reason}`;

    await this.saveAndSendNotification(
      event.userId,
      'PAYMENT_FAILED',
      subject,
      body,
      event.orderId,
    );
  }

  private async saveAndSendNotification(
    userId: string,
    type: string,
    subject: string,
    body: string,
    orderId: string,
  ): Promise<void> {
    const notification = this.notificationRepository.create({
      userId,
      type,
      subject,
      body,
      orderId,
      status: 'SENT',
    });
    await this.notificationRepository.save(notification);

    this.logger.log(`   [${type}] To: ${userId}`);
    this.logger.log(`   Subject: ${subject}`);
    this.logger.log(`   Body: ${body}`);
    this.logger.log(`   Saved to DB: ${notification.id}`);
  }
}
