import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('orders_events')
export class OrderEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  aggregateId: string; 

  @Column()
  type: string; 

  @Column({ type: 'jsonb' })
  payload: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}