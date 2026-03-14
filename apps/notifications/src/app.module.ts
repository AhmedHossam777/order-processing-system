import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [DatabaseModule, NotificationsModule],
})
export class AppModule {}
