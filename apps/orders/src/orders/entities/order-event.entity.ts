import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('orders_events')
export class OrderEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  aggregateId: string; // orderId

  @Column()
  type: string; // ORDER_CREATED | ORDER_COMPLETED | ORDER_CANCELLED

  @Column({ type: 'jsonb' })
  payload: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}