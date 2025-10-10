import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Vm } from '../vms/vm.entity';

@Entity('snapshots')
export class Snapshot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  snapname: string; // Proxmox snapshot name

  @Column({ nullable: true })
  description: string;

  @ManyToOne(() => Vm, (vm) => vm.snapshots)
  vm: Vm;

  @CreateDateColumn()
  createdAt: Date;
}
