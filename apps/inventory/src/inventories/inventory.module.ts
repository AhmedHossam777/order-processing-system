import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import {
  RABBITMQ_URL,
  ORDER_QUEUE,
  PAYMENT_QUEUE,
  ORDER_CLIENT,
  PAYMENT_CLIENT,
} from '@app/shared';
import { Reservation } from './entities/reservations.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reservation]),
    ClientsModule.register([
      {
        name: ORDER_CLIENT,
        transport: Transport.RMQ,
        options: {
          urls: [RABBITMQ_URL],
          queue: ORDER_QUEUE,
          queueOptions: { durable: true },
        },
      },
      {
        name: PAYMENT_CLIENT,
        transport: Transport.RMQ,
        options: {
          urls: [RABBITMQ_URL],
          queue: PAYMENT_QUEUE,
          queueOptions: { durable: true },
        },
      },
    ]),
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
})
export class InventoryModule {}
