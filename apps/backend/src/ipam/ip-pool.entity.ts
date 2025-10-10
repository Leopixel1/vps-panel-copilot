import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { IpAddress } from './ip-address.entity';

@Entity('ip_pools')
export class IpPool {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column()
  subnet: string; // CIDR notation, e.g., "10.0.0.0/24"

  @Column()
  gateway: string;

  @Column({ default: true })
  isPrivate: boolean;

  @Column({ default: true })
  active: boolean;

  @OneToMany(() => IpAddress, (ip) => ip.pool)
  addresses: IpAddress[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
