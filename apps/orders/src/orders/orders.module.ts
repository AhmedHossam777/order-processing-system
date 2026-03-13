import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  NOTIFICATION_CLIENT,
  NOTIFICATION_QUEUE,
  PAYMENT_CLIENT,
  PAYMENT_QUEUE,
  RABBITMQ_URL,
} from '@app/shared';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order]),

    ClientsModule.register([
      {
        name: PAYMENT_CLIENT,
        transport: Transport.RMQ,
        options: {
          urls: [RABBITMQ_URL],
          queue: PAYMENT_QUEUE,
          queueOptions: { durable: true },
        },
      },
      {
        name: NOTIFICATION_CLIENT,
        transport: Transport.RMQ,
        options: {
          urls: [RABBITMQ_URL],
          queue: NOTIFICATION_QUEUE,
          queueOptions: { durable: true },
        },
      },
    ]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
