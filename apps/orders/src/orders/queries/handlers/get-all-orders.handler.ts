import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GetAllOrdersQuery } from '../get-all-orders.query';
import { OrderViewEntity } from '../../entities/order-view.entity';

@QueryHandler(GetAllOrdersQuery)
export class GetAllOrdersHandler implements IQueryHandler<GetAllOrdersQuery> {
  constructor(
    @InjectRepository(OrderViewEntity)
    private readonly viewRepo: Repository<OrderViewEntity>,
  ) {}

  async execute(query: GetAllOrdersQuery): Promise<OrderViewEntity[]> {
    return this.viewRepo.find();
  }
}
