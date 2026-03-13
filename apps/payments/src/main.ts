import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { PAYMENT_QUEUE, RABBITMQ_URL } from '@app/shared';

async function bootstrap() {
  const logger = new Logger('PaymentsService');

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [RABBITMQ_URL],
        queue: PAYMENT_QUEUE,
        queueOptions: { durable: true },
        noAck: false,
      },
    },
  );

  await app.listen();
  logger.log('Payments Service started');
  logger.log('Consuming from: payment_events_queue');
}
bootstrap();
