import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('orders_view')
export class OrderViewEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  product: string;

  @Column()
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column()
  userId: string;

  @Column()
  status: string; // PENDING | COMPLETED | CANCELLED

  @UpdateDateColumn()
  updatedAt: Date;
}