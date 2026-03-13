import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [DatabaseModule, PaymentsModule],
})
export class AppModule {}
