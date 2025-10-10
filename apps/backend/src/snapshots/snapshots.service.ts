import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Snapshot } from './snapshot.entity';
import { VmsService } from '../vms/vms.service';
import { ProxmoxService } from '../proxmox/proxmox.service';

@Injectable()
export class SnapshotsService {
  constructor(
    @InjectRepository(Snapshot)
    private snapshotRepo: Repository<Snapshot>,
    private vmsService: VmsService,
    private proxmoxService: ProxmoxService,
  ) {}

  async create(vmId: string, name: string, description?: string): Promise<Snapshot> {
    const vm = await this.vmsService.findById(vmId);

    // Check quota
    const existingSnapshots = await this.snapshotRepo.count({ where: { vm: { id: vmId } } });
    if (existingSnapshots >= vm.plan.snapshotQuota) {
      throw new BadRequestException(`Snapshot quota exceeded (${vm.plan.snapshotQuota})`);
    }

    const snapname = `snap_${Date.now()}`;

    // Create snapshot in Proxmox
    const ticket = await this.proxmoxService.authenticate(vm.node.id, {
      host: vm.node.host,
      port: vm.node.port,
      username: vm.node.username,
      password: vm.node.password,
    });

    await this.proxmoxService.createSnapshot(
      vm.node.id,
      {
        host: vm.node.host,
        port: vm.node.port,
        username: vm.node.username,
        password: vm.node.password,
      },
      ticket,
      vm.template.nodeName,
      vm.vmid,
      snapname,
      description
    );

    const snapshot = this.snapshotRepo.create({
      name,
      snapname,
      description,
      vm,
    });

    return await this.snapshotRepo.save(snapshot);
  }

  async findByVmId(vmId: string): Promise<Snapshot[]> {
    return await this.snapshotRepo.find({
      where: { vm: { id: vmId } },
      order: { createdAt: 'DESC' },
    });
  }

  async delete(id: string, vmId: string): Promise<void> {
    const snapshot = await this.snapshotRepo.findOne({
      where: { id, vm: { id: vmId } },
      relations: ['vm', 'vm.node', 'vm.template'],
    });

    if (!snapshot) {
      throw new NotFoundException('Snapshot not found');
    }

    const vm = snapshot.vm;

    // Delete from Proxmox
    const ticket = await this.proxmoxService.authenticate(vm.node.id, {
      host: vm.node.host,
      port: vm.node.port,
      username: vm.node.username,
      password: vm.node.password,
    });

    await this.proxmoxService.deleteSnapshot(
      vm.node.id,
      {
        host: vm.node.host,
        port: vm.node.port,
        username: vm.node.username,
        password: vm.node.password,
      },
      ticket,
      vm.template.nodeName,
      vm.vmid,
      snapshot.snapname
    );

    await this.snapshotRepo.delete(id);
  }

  async rollback(id: string, vmId: string): Promise<void> {
    const snapshot = await this.snapshotRepo.findOne({
      where: { id, vm: { id: vmId } },
      relations: ['vm', 'vm.node', 'vm.template'],
    });

    if (!snapshot) {
      throw new NotFoundException('Snapshot not found');
    }

    const vm = snapshot.vm;

    // Rollback in Proxmox
    const ticket = await this.proxmoxService.authenticate(vm.node.id, {
      host: vm.node.host,
      port: vm.node.port,
      username: vm.node.username,
      password: vm.node.password,
    });

    await this.proxmoxService.rollbackSnapshot(
      vm.node.id,
      {
        host: vm.node.host,
        port: vm.node.port,
        username: vm.node.username,
        password: vm.node.password,
      },
      ticket,
      vm.template.nodeName,
      vm.vmid,
      snapshot.snapname
    );
  }
}
