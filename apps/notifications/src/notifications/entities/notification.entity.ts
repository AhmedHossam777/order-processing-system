import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  type: string; // ORDER_CREATED | PAYMENT_SUCCESS | PAYMENT_FAILED

  @Column()
  subject: string;

  @Column('text')
  body: string;

  @Column({ nullable: true })
  orderId: string;

  @Column({ default: 'SENT' })
  status: string; // SENT | FAILED

  @CreateDateColumn()
  sentAt: Date;
}
