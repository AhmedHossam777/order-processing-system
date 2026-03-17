import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../orders/entities/order.entity';
import { OrderViewEntity } from '../orders/entities/order-view.entity';
import { OrderEventEntity } from '../orders/entities/order-event.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5433,
      username: 'orders_user',
      password: 'orders_pass',
      database: 'orders_db',
      entities: [Order, OrderEventEntity, OrderViewEntity],
      synchronize: true,
    }),
  ],
})
export class DatabaseModule {}