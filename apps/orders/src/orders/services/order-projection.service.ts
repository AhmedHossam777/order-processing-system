import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderViewEntity } from '../entities/order-view.entity';
import { OrderEventStoreService } from './order-event-store.service';
import {
  ORDER_DOMAIN_EVENT_TYPES,
  OrderCreatedDomainEventPayload,
} from '../domain/order-doman-events';

@Injectable()
export class OrderProjectionService {
  private readonly logger = new Logger(OrderProjectionService.name);

  constructor(
    @InjectRepository(OrderViewEntity)
    private readonly viewRepo: Repository<OrderViewEntity>,
    private readonly eventStore: OrderEventStoreService,
  ) {}


  async applyEvent(event: { type: string; payload: Record<string, any>; aggregateId: string }) {
    switch (event.type) {
      case ORDER_DOMAIN_EVENT_TYPES.ORDER_CREATED: {
        const p = event.payload as OrderCreatedDomainEventPayload;
        const view = this.viewRepo.create({
          id: p.orderId,
          product: p.product,
          quantity: p.quantity,
          price: p.price,
          userId: p.userId,
          status: 'PENDING',
        });
        await this.viewRepo.save(view);
        this.logger.log(`Projected ORDER_CREATED → ${p.orderId}`);
        break;
      }

      case ORDER_DOMAIN_EVENT_TYPES.ORDER_COMPLETED:
        await this.viewRepo.update(event.aggregateId, { status: 'COMPLETED' });
        this.logger.log(`Projected ORDER_COMPLETED → ${event.aggregateId}`);
        break;

      case ORDER_DOMAIN_EVENT_TYPES.ORDER_CANCELLED:
        await this.viewRepo.update(event.aggregateId, { status: 'CANCELLED' });
        this.logger.log(`Projected ORDER_CANCELLED → ${event.aggregateId}`);
        break;
      case ORDER_DOMAIN_EVENT_TYPES.ORDER_FAILED:
        await this.viewRepo.update(event.aggregateId, { status: 'FAILED' });
        this.logger.log(`Projected ORDER_FAILED → ${event.aggregateId}`);
        break;

      default:
        this.logger.warn(`Unknown event type: ${event.type}`);
    }
  }

   async rebuildProjection() {
    this.logger.warn('Rebuilding projection from event store...');
    await this.viewRepo.clear(); // wipe the read model
    const allEvents = await this.eventStore.loadAll();

    for (const event of allEvents) {
      await this.applyEvent(event);
    }

    this.logger.log(`Projection rebuilt. Applied ${allEvents.length} events.`);
  }
}
