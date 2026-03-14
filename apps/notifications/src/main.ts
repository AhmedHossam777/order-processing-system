import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { NOTIFICATION_QUEUE, RABBITMQ_URL } from '@app/shared';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('NotificationsService');

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [RABBITMQ_URL],
        queue: NOTIFICATION_QUEUE,
        queueOptions: { durable: true },
        noAck: false,
      },
    },
  );
  await app.listen();

  logger.log('Notifications Service started');
  logger.log('Consuming from: notification_events_queue');
}
bootstrap();
