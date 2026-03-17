import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEventEntity } from '../entities/order-event.entity';

@Injectable()
export class OrderEventStoreService {
  constructor(
    @InjectRepository(OrderEventEntity)
    private readonly repo: Repository<OrderEventEntity>,
  ) {}

  async append(aggregateId: string, type: string, payload: Record<string, any>) {
    const evt = this.repo.create({ aggregateId, type, payload });
    return this.repo.save(evt);
  }

  async loadStream(aggregateId: string) {
    return this.repo.find({
      where: { aggregateId },
      order: { createdAt: 'ASC' },
    });
  }

  async loadAll() {
    return this.repo.find({ order: { createdAt: 'ASC' } });
  }
}