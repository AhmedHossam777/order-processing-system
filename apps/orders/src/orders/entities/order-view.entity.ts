import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('order_views')
@Index('idx_order_view_status_updated_at', ['status', 'updatedAt'])
export class OrderViewEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  product: string;

  @Column()
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column()
  userId: string;

  @Column({ type: 'varchar', length: 30 })
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';

  
  @Column({ type: 'int' , default: 0})
  lastEventSequence: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
