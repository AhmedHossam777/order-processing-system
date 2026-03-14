import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reservation } from '../inventories/entities/reservations.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5436,
      username: 'inventory_user',
      password: 'inventory_pass',
      database: 'inventory_db',
      entities: [Reservation],
      synchronize: true,
    }),
  ],
})
export class DatabaseModule {}
