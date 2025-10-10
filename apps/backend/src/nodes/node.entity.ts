import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Vm } from '../vms/vm.entity';

@Entity('nodes')
export class Node {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column()
  host: string;

  @Column()
  port: number;

  @Column()
  username: string;

  @Column()
  password: string;

  @Column({ default: true })
  active: boolean;

  @Column({ nullable: true })
  storage: string;

  @OneToMany(() => Vm, (vm) => vm.node)
  vms: Vm[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
