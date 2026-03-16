import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Unique, Index } from 'typeorm';

@Entity('order_events')
@Unique('uq_order_events_aggregate_sequence', ['aggregateId', 'sequence'])
@Index('idx_orders_events_aggregate_created_at', ['aggregateId', 'createdAt'])
export class OrderEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  aggregateId: string;

  @Column({ type: 'varchar', length: 50, default: 'ORDER' })
  aggregateType: string;

  @Column({ type: 'varchar', length: 100 })
  eventType: string; 

  @Column({ type: 'int', default: 1 })
  eventVersion: number; 

  @Column({ type: 'int' })
  sequence: number; 

  @Column({ type: 'varchar', length: 100, nullable: true })
  correlationId?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  causationId?: string;

  @Column({ type: 'jsonb' })
  payload: Record<string, any>;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}