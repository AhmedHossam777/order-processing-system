import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { INVENTORY_QUEUE, RABBITMQ_URL } from '@app/shared';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('InventoryService');
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [RABBITMQ_URL],
        queue: INVENTORY_QUEUE,
        queueOptions: { durable: true },
        noAck: false,
      },
    },
  );
  await app.listen();
  logger.log('Inventory Service started');
  logger.log('Consuming from: inventory_events_queue');
}
bootstrap();
