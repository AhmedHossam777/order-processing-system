import { Controller, Post } from '@nestjs/common';
import { OrderEventStoreService } from './services/order-event-store.service';
import { OrderProjectionService } from './services/order-projection.service';


@Controller('admin/orders')
export class OrdersAdminController {
  constructor(
    private readonly store: OrderEventStoreService,
    private readonly projection: OrderProjectionService,
  ) {}

  @Post('replay')
  async replay() {
    await this.projection.rebuildProjection();
    return { status: 'ok' };
  }
}