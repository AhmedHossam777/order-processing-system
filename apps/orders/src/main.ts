import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ORDER_QUEUE, RABBITMQ_URL } from '@app/shared';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger();

  const app = await NestFactory.create(AppModule);
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [RABBITMQ_URL],
      queue: ORDER_QUEUE,
      queueOptions: { durable: true },
      noAck: false,
    },
  });

  app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
);

  await app.startAllMicroservices();
  await app.listen(process.env.port ?? 3000);

  logger.log('Orders Service running on http://localhost:3000');
  logger.log('Consuming from: order_events_queue');
}
bootstrap();
