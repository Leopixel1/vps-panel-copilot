import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { IpPool } from './ip-pool.entity';
import { IpAddress, IpStatus } from './ip-address.entity';

@Injectable()
export class IpamService {
  constructor(
    @InjectRepository(IpPool)
    private ipPoolRepo: Repository<IpPool>,
    @InjectRepository(IpAddress)
    private ipAddressRepo: Repository<IpAddress>,
  ) {}

  async allocateIp(preferPrivate: boolean = true): Promise<IpAddress> {
    // Use transaction to prevent race conditions
    return await this.ipAddressRepo.manager.transaction(async (manager) => {
      const ipAddressRepo = manager.getRepository(IpAddress);
      const ipPoolRepo = manager.getRepository(IpPool);

      // Find appropriate pool
      const pool = await ipPoolRepo.findOne({
        where: {
          active: true,
          isPrivate: preferPrivate,
        },
        relations: ['addresses'],
      });

      if (!pool) {
        throw new NotFoundException(
          `No active ${preferPrivate ? 'private' : 'public'} IP pool found`
        );
      }

      // Find available IP with row-level locking to prevent collision
      const availableIp = await ipAddressRepo
        .createQueryBuilder('ip')
        .where('ip.status = :status', { status: IpStatus.AVAILABLE })
        .andWhere('ip.poolId = :poolId', { poolId: pool.id })
        .andWhere('ip.vmId IS NULL')
        .setLock('pessimistic_write')
        .getOne();

      if (!availableIp) {
        throw new ConflictException('No available IP addresses in pool');
      }

      // Mark as reserved
      availableIp.status = IpStatus.RESERVED;
      await ipAddressRepo.save(availableIp);

      return availableIp;
    });
  }

  async assignIpToVm(ipId: string, vmId: string): Promise<IpAddress> {
    const ip = await this.ipAddressRepo.findOne({ where: { id: ipId } });
    if (!ip) {
      throw new NotFoundException('IP address not found');
    }

    if (ip.status !== IpStatus.RESERVED) {
      throw new ConflictException('IP address is not reserved');
    }

    ip.status = IpStatus.ASSIGNED;
    return await this.ipAddressRepo.save(ip);
  }

  async releaseIp(ipId: string): Promise<void> {
    const ip = await this.ipAddressRepo.findOne({ where: { id: ipId } });
    if (ip) {
      ip.status = IpStatus.AVAILABLE;
      ip.vm = null as any;
      await this.ipAddressRepo.save(ip);
    }
  }

  async createPool(name: string, subnet: string, gateway: string, isPrivate: boolean): Promise<IpPool> {
    const pool = this.ipPoolRepo.create({
      name,
      subnet,
      gateway,
      isPrivate,
    });
    return await this.ipPoolRepo.save(pool);
  }

  async addIpToPool(poolId: string, address: string): Promise<IpAddress> {
    const pool = await this.ipPoolRepo.findOne({ where: { id: poolId } });
    if (!pool) {
      throw new NotFoundException('IP pool not found');
    }

    const existingIp = await this.ipAddressRepo.findOne({ where: { address } });
    if (existingIp) {
      throw new ConflictException('IP address already exists');
    }

    const ip = this.ipAddressRepo.create({
      address,
      pool,
      status: IpStatus.AVAILABLE,
    });

    return await this.ipAddressRepo.save(ip);
  }

  async getPoolById(id: string): Promise<IpPool> {
    const pool = await this.ipPoolRepo.findOne({
      where: { id },
      relations: ['addresses'],
    });
    if (!pool) {
      throw new NotFoundException('IP pool not found');
    }
    return pool;
  }

  async getAllPools(): Promise<IpPool[]> {
    return await this.ipPoolRepo.find({ relations: ['addresses'] });
  }
}
