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
import { Order } from './entities/order.entity';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,

    @Inject(PAYMENT_CLIENT)
    private readonly paymentClient: ClientProxy,

    @Inject(NOTIFICATION_CLIENT)
    private readonly notificationClient: ClientProxy,
  ) {}

  async createOrder(createOrderDto: CreateOrderDto): Promise<Order> {
    const order = this.orderRepository.create({
      ...createOrderDto,
      status: 'PENDING',
    });

    const savedOrder = await this.orderRepository.save(order);
    this.logger.log(`Order saved to DB: ${savedOrder.id}`);

    // creating the order event
    const createOrderEvent = new OrderCreatedEvent(
      savedOrder.id,
      savedOrder.product,
      savedOrder.quantity,
      savedOrder.price,
      savedOrder.userId,
    );

    this.paymentClient.emit(ROUTING_KEYS.ORDER_CREATED, createOrderEvent);
    this.notificationClient.emit(
      ROUTING_KEYS.ORDER_NOTIFICATION,
      createOrderEvent,
    );

    this.logger.log(`Events published for order: ${savedOrder.id}`);
    return savedOrder;
  }

  async updateOrderStatus(orderId: string, status: string): Promise<void> {
    await this.orderRepository.update(orderId, { status });
    this.logger.log(`Order ${orderId} status → ${status}`);
  }

  async findAll(): Promise<Order[]> {
    return this.orderRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Order> {
    return this.orderRepository.findOne({ where: { id } });
  }
}
