import { BadRequestException, HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ClientProxy } from '@nestjs/microservices';
import {
  InventoryFailedEvent,
  INVENTORY_CLIENT,
  NOTIFICATION_CLIENT,
  ORDER_CLIENT,
  OrderCreatedEvent,
  PaymentFailedEvent,
  PaymentRefundedEvent,
  PaymentSuccessEvent,
  ROUTING_KEYS,
} from '@app/shared';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,

    @Inject(NOTIFICATION_CLIENT)
    private readonly notificationClient: ClientProxy,

    @Inject(ORDER_CLIENT)
    private readonly orderClient: ClientProxy,

    @Inject(INVENTORY_CLIENT)
    private readonly inventoryClient: ClientProxy,
  ) {}

  async processOrderPayment(event: OrderCreatedEvent): Promise<void> {
    this.logger.log(`Processing payment for order: ${event.orderId}`);

    // Idempotency: if we already processed this order, skip (same event delivered twice)
    const existing = await this.paymentRepository.findOne({
      where: { orderId: event.orderId },
    });
    if (existing) {
      this.logger.log(`Payment for order ${event.orderId} already processed (${existing.status}), skipping`);
      return;
    }

    const totalPrice = event.quantity * event.price;

    await this.simulatePaymentProcessing();
    const isSuccessful = Math.random() > 0.2;

    if (isSuccessful) {
      const transactionId = `TXN-${Date.now()}`;

      const payment = this.paymentRepository.create({
        orderId: event.orderId,
        userId: event.userId,
        amount: totalPrice,
        status: 'SUCCESS',
        transactionId,
      });

      await this.paymentRepository.save(payment);
      this.logger.log(`Payment SUCCESS — saved to DB: ${payment.id}`);

      const successEvent = new PaymentSuccessEvent(
        event.orderId,
        totalPrice,
        event.userId,
        transactionId,
      );

      this.orderClient.emit(ROUTING_KEYS.PAYMENT_SUCCESS, successEvent);
      this.notificationClient.emit(ROUTING_KEYS.PAYMENT_SUCCESS, successEvent);
      this.inventoryClient.emit(ROUTING_KEYS.PAYMENT_SUCCESS, successEvent);
    } else {
      const reason = 'Insufficient funds';
      const payment = this.paymentRepository.create({
        orderId: event.orderId,
        userId: event.userId,
        amount: totalPrice,
        status: 'FAILED',
        failureReason: reason,
      });
      await this.paymentRepository.save(payment);

      this.logger.warn(`Payment FAILED — saved to DB: ${payment.id}`);

      const failedEvent = new PaymentFailedEvent(
        event.orderId,
        totalPrice,
        event.userId,
        reason,
      );

      this.orderClient.emit(ROUTING_KEYS.PAYMENT_FAILED, failedEvent);
      this.notificationClient.emit(ROUTING_KEYS.PAYMENT_FAILED, failedEvent);
    }
  }

  async refundPayment(event: InventoryFailedEvent): Promise<void> {
    const payment = await this.paymentRepository.findOne({
      where: { orderId: event.orderId },
    });

    if (!payment) {
      this.logger.error(
        `Could not find payment for order ${event.orderId}`,
      );
      throw new BadRequestException(
        `Could not find successful payment for order ${event.orderId}`
      );
    }

    // Idempotency: already refunded (e.g. same INVENTORY_FAILED delivered twice)
    if (payment.status === 'REFUNDED') {
      this.logger.log(`Order ${event.orderId} already refunded, skipping`);
      return;
    }

    if (payment.status !== 'SUCCESS') {
      throw new BadRequestException(
        `Order ${event.orderId} payment is ${payment.status}, cannot refund`
      );
    }

    payment.status = 'REFUNDED';
    payment.failureReason = event.reason;
    await this.paymentRepository.save(payment);
    this.logger.log(`Payment REFUNDED for order: ${event.orderId}`);

    const refundEvent = new PaymentRefundedEvent(
      payment.orderId,
      payment.amount,
      event.reason,
    );

    this.orderClient.emit(ROUTING_KEYS.PAYMENT_REFUNDED, refundEvent);
    this.notificationClient.emit(ROUTING_KEYS.PAYMENT_REFUNDED, refundEvent);
  }

  private async simulatePaymentProcessing(): Promise<void> {
    const delay = 1000 + Math.random() * 1000;
    return new Promise((resolve) => setTimeout(resolve, delay));
  }
}
