import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  NOTIFICATION_CLIENT,
  OrderCreatedEvent,
  PAYMENT_CLIENT,
  ROUTING_KEYS,
} from '@app/shared';
import { ClientProxy } from '@nestjs/microservices';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderEventStoreService } from './services/order-event-store.service';
import { OrderProjectionService } from './services/order-projection.service';
import { ORDER_DOMAIN_EVENT_TYPES } from './domain/order-doman-events';
import { OrderViewEntity } from './entities/order-view.entity';
import { v4 as uuidv4 } from 'uuid';


@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  constructor(


    @InjectRepository(OrderViewEntity)
    private readonly viewRepo: Repository<OrderViewEntity>,

    @Inject(PAYMENT_CLIENT)
    private readonly paymentClient: ClientProxy,

    @Inject(NOTIFICATION_CLIENT)
    private readonly notificationClient: ClientProxy,

    private readonly orderEventStoreService: OrderEventStoreService,

    private readonly orderProjectionService: OrderProjectionService,
    
  ) {}

  async createOrder(createOrderDto: CreateOrderDto){
    const orderId = uuidv4();  

    const createOrderEvent = new OrderCreatedEvent(
      orderId,
      createOrderDto.product,
      createOrderDto.quantity,
      createOrderDto.price,
      createOrderDto.userId,
    );

    await this.orderEventStoreService.append(
      orderId,
      ORDER_DOMAIN_EVENT_TYPES.ORDER_CREATED,
      createOrderEvent,
    );

    await this.orderProjectionService.applyEvent({
      type: ORDER_DOMAIN_EVENT_TYPES.ORDER_CREATED,
      payload: createOrderEvent,
      aggregateId: orderId,
    });

    this.paymentClient.emit(ROUTING_KEYS.ORDER_CREATED, createOrderEvent);

    this.notificationClient.emit(
      ROUTING_KEYS.ORDER_NOTIFICATION,
      createOrderEvent,
    );

    this.logger.log(`Events published for order: ${orderId}`);
  return { id: orderId, ...createOrderDto, status: 'PENDING' };
  }



  async findAll(): Promise<OrderViewEntity[]> {
    return this.viewRepo.find();
  }

  async findOne(id: string): Promise<OrderViewEntity> {
    return this.viewRepo.findOne({ where: { id } });
  }
}
