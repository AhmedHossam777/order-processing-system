import { NestFactory } from '@nestjs/core';
import { PaymentsModule } from './orders/payments.module';

async function bootstrap() {
  const app = await NestFactory.create(PaymentsModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
