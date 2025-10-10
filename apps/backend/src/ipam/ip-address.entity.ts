import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToOne, JoinColumn } from 'typeorm';
import { IpPool } from './ip-pool.entity';
import { Vm } from '../vms/vm.entity';

export enum IpStatus {
  AVAILABLE = 'available',
  RESERVED = 'reserved',
  ASSIGNED = 'assigned',
}

@Entity('ip_addresses')
export class IpAddress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  address: string;

  @Column({
    type: 'enum',
    enum: IpStatus,
    default: IpStatus.AVAILABLE,
  })
  status: IpStatus;

  @ManyToOne(() => IpPool, (pool) => pool.addresses)
  pool: IpPool;

  @OneToOne(() => Vm, (vm) => vm.ipAddress, { nullable: true })
  @JoinColumn()
  vm: Vm;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
