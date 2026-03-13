import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  orderId: string; // Reference, NOT a foreign key

  @Column()
  userId: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column()
  status: string; // SUCCESS | FAILED

  @Column({ nullable: true })
  transactionId: string;

  @Column({ nullable: true })
  failureReason: string;

  @CreateDateColumn()
  processedAt: Date;
}
