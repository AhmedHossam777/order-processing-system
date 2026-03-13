import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from '../payments/entities/payment.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5434,
      username: 'payments_user',
      password: 'payments_pass',
      database: 'payments_db',
      entities: [Payment],
      synchronize: true,
    }),
  ],
})
export class DatabaseModule {}
