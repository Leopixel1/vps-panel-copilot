import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, OneToOne } from 'typeorm';
import { User } from '../users/user.entity';
import { Organization } from '../organizations/organization.entity';
import { Node } from '../nodes/node.entity';
import { Template } from '../templates/template.entity';
import { Plan } from '../plans/plan.entity';
import { IpAddress } from '../ipam/ip-address.entity';
import { Snapshot } from '../snapshots/snapshot.entity';

export enum VmStatus {
  CREATING = 'creating',
  RUNNING = 'running',
  STOPPED = 'stopped',
  SUSPENDED = 'suspended',
  ERROR = 'error',
}

@Entity('vms')
export class Vm {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  vmid: number;

  @Column({
    type: 'enum',
    enum: VmStatus,
    default: VmStatus.CREATING,
  })
  status: VmStatus;

  @Column({ nullable: true })
  hostname: string;

  @Column({ nullable: true })
  rootPassword: string;

  @Column({ default: false })
  passwordShown: boolean;

  @ManyToOne(() => User, (user) => user.vms)
  owner: User;

  @ManyToOne(() => Organization, (org) => org.vms)
  organization: Organization;

  @ManyToOne(() => Node, (node) => node.vms)
  node: Node;

  @ManyToOne(() => Template, (template) => template.vms)
  template: Template;

  @ManyToOne(() => Plan, (plan) => plan.vms)
  plan: Plan;

  @OneToOne(() => IpAddress, (ip) => ip.vm, { nullable: true })
  ipAddress: IpAddress;

  @OneToMany(() => Snapshot, (snapshot) => snapshot.vm)
  snapshots: Snapshot[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
