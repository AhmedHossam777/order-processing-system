import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GetOrderByIdQuery } from '../get-order-by-id.query';
import { OrderViewEntity } from '../../entities/order-view.entity';

@QueryHandler(GetOrderByIdQuery)
export class GetOrderByIdHandler implements IQueryHandler<GetOrderByIdQuery> {
  constructor(
    @InjectRepository(OrderViewEntity)
    private readonly viewRepo: Repository<OrderViewEntity>,
  ) {}

  async execute(query: GetOrderByIdQuery): Promise<OrderViewEntity> {
    return this.viewRepo.findOne({ where: { id: query.orderId } });
  }
}
