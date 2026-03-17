import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  product: string;

  @Column()
  quantity: number;

  @Column()
  price: number;

  @Column()
  userId: string;

  @Column({ default: 'PENDING' })
  status: string; // PENDING → CONFIRMED → FAILED

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}