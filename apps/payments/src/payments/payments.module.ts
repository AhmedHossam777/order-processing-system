import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { Payment } from './entities/payment.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  NOTIFICATION_CLIENT,
  NOTIFICATION_QUEUE,
  ORDER_CLIENT,
  ORDER_QUEUE,
  RABBITMQ_URL,
} from '@app/shared';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment]),
    ClientsModule.register([
      {
        name: NOTIFICATION_CLIENT,
        transport: Transport.RMQ,
        options: {
          urls: [RABBITMQ_URL],
          queue: NOTIFICATION_QUEUE,
          queueOptions: { durable: true },
        },
      },
      {
        name: ORDER_CLIENT,
        transport: Transport.RMQ,
        options: {
          urls: [RABBITMQ_URL],
          queue: ORDER_QUEUE,
          queueOptions: { durable: true },
        },
      },
    ]),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
