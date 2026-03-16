import { Module } from '@nestjs/common';
import { InventoryModule } from './inventories/inventory.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [InventoryModule, DatabaseModule],
})
export class AppModule {}
