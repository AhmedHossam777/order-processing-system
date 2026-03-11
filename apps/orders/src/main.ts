import { NestFactory } from '@nestjs/core';
import { OrdersModule } from './orders/orders.module';

async function bootstrap() {
  const app = await NestFactory.create(OrdersModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
