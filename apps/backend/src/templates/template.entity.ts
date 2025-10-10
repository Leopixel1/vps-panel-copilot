import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Vm } from '../vms/vm.entity';

export enum OsType {
  LINUX = 'linux',
  WINDOWS = 'windows',
}

@Entity('templates')
export class Template {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column()
  vmid: number;

  @Column()
  nodeName: string;

  @Column({
    type: 'enum',
    enum: OsType,
    default: OsType.LINUX,
  })
  osType: OsType;

  @Column({ nullable: true })
  description: string;

  @Column({ default: true })
  active: boolean;

  @OneToMany(() => Vm, (vm) => vm.template)
  vms: Vm[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
