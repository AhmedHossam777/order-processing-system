import { Module } from '@nestjs/common';
import { InventoryModule } from './inventories/inventory.module';

@Module({
  imports: [InventoryModule],
})
export class AppModule {}
