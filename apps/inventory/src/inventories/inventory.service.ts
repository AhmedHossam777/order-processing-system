import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Reservation } from './entities/reservations.entity';
import { Repository } from 'typeorm';
import {
  InventoryFailedEvent,
  InventoryReservedEvent,
  ORDER_CLIENT,
  PAYMENT_CLIENT,
  PaymentSuccessEvent,
  ROUTING_KEYS,
} from '@app/shared';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,

    @Inject(ORDER_CLIENT) private readonly orderClient: ClientProxy,
    @Inject(PAYMENT_CLIENT) private readonly paymentClient: ClientProxy,
  ) {}

  async reserveStock(event: PaymentSuccessEvent) {
    this.logger.log(`Attempting to reserve stock for order: ${event.orderId}`);
    const inStock = Math.random() > 0.3;

    if (inStock) {
      const reservation = this.reservationRepository.create({
        orderId: event.orderId,
        status: 'RESERVED',
      });

      await this.reservationRepository.save(reservation);

      this.orderClient.emit(
        ROUTING_KEYS.INVENTORY_RESERVED,
        new InventoryReservedEvent(event.orderId),
      );
    } else {
      const reason = 'Out of stock';
      const reservation = this.reservationRepository.create({
        orderId: event.orderId,
        status: 'FAILED',
        reason,
      });
      await this.reservationRepository.save(reservation);

      this.logger.warn(
        `OUT OF STOCK for order: ${event.orderId} (DB ID: ${reservation.id})`,
      );

      this.paymentClient.emit(
        ROUTING_KEYS.INVENTORY_FAILED,
        new InventoryFailedEvent(event.orderId, 'Unknown Product', reason),
      );
    }
  }
}
