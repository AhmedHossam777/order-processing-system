import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  NOTIFICATION_CLIENT,
  NOTIFICATION_QUEUE,
  PAYMENT_CLIENT,
  PAYMENT_QUEUE,
  RABBITMQ_URL,
} from '@app/shared';
import { OrderEventEntity } from './entities/order-event.entity';
import { OrderViewEntity } from './entities/order-view.entity';
import { OrderProjectionService } from './services/order-projection.service';
import { OrderEventStoreService } from './services/order-event-store.service';
import { OrdersAdminController } from './order-admin.controller';
import {
  CancelOrderHandler,
  CompleteOrderHandler,
  CreateOrderHandler,
  FailOrderHandler,
} from './commands/handlers';
import { GetAllOrdersHandler, GetOrderByIdHandler } from './queries/handlers';
import { CqrsModule } from '@nestjs/cqrs';

const CommandHandlers = [
  CreateOrderHandler,

  CompleteOrderHandler,

  FailOrderHandler,

  CancelOrderHandler,
];

const QueryHandlers = [GetAllOrdersHandler, GetOrderByIdHandler];

@Module({
  imports: [
    CqrsModule,

    TypeOrmModule.forFeature([OrderViewEntity, OrderEventEntity]),

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
  controllers: [OrdersController, OrdersAdminController],
  providers: [
    OrderEventStoreService,
    OrderProjectionService,
    ...CommandHandlers,
    ...QueryHandlers,
  ],
})
export class OrdersModule {}
