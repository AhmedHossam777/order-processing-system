import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from '../notifications/entities/notification.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5435,
      username: 'notifications_user',
      password: 'notifications_pass',
      database: 'notifications_db',
      entities: [Notification],
      synchronize: true,
    }),
  ],
})
export class DatabaseModule {}
