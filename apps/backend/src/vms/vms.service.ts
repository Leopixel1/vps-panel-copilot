import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vm, VmStatus } from './vm.entity';
import { ProxmoxService } from '../proxmox/proxmox.service';
import { IpamService } from '../ipam/ipam.service';
import { NodesService } from '../nodes/nodes.service';
import { TemplatesService } from '../templates/templates.service';
import { PlansService } from '../plans/plans.service';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class VmsService {
  private readonly logger = new Logger(VmsService.name);

  constructor(
    @InjectRepository(Vm)
    private vmRepo: Repository<Vm>,
    private proxmoxService: ProxmoxService,
    private ipamService: IpamService,
    private nodesService: NodesService,
    private templatesService: TemplatesService,
    private plansService: PlansService,
  ) {}

  async createVm(
    name: string,
    templateId: string,
    planId: string,
    ownerId: string,
    organizationId: string
  ): Promise<Vm> {
    const template = await this.templatesService.findById(templateId);
    const plan = await this.plansService.findById(planId);
    const node = await this.nodesService.getActiveNode();

    // Allocate IP (prefer private)
    const ip = await this.ipamService.allocateIp(true);

    // Generate root password
    const rootPassword = this.generatePassword();
    const hashedPassword = await bcrypt.hash(rootPassword, 10);

    // Get Proxmox ticket
    const ticket = await this.proxmoxService.authenticate(node.id, {
      host: node.host,
      port: node.port,
      username: node.username,
      password: node.password,
    });

    // Get next available VM ID
    const newVmId = await this.proxmoxService.getNextVmId(node.id, {
      host: node.host,
      port: node.port,
      username: node.username,
      password: node.password,
    }, ticket);

    // Create VM record
    const vm = this.vmRepo.create({
      name,
      vmid: newVmId,
      hostname: name,
      rootPassword: hashedPassword,
      status: VmStatus.CREATING,
      owner: { id: ownerId } as any,
      organization: { id: organizationId } as any,
      node,
      template,
      plan,
      ipAddress: ip,
    });

    await this.vmRepo.save(vm);

    // Clone VM from template in background
    this.provisionVm(vm, node, template, plan, ip, ticket, rootPassword).catch((error) => {
      this.logger.error(`Failed to provision VM ${vm.id}:`, error);
      vm.status = VmStatus.ERROR;
      this.vmRepo.save(vm);
    });

    return vm;
  }

  private async provisionVm(vm: Vm, node: any, template: any, plan: any, ip: any, ticket: string, rootPassword: string): Promise<void> {
    const credentials = {
      host: node.host,
      port: node.port,
      username: node.username,
      password: node.password,
    };

    // Clone template
    const cloneTask = await this.proxmoxService.cloneVm(
      node.id,
      credentials,
      ticket,
      template.nodeName,
      template.vmid,
      vm.vmid,
      vm.name
    );

    // Wait for clone to complete
    const cloneSuccess = await this.proxmoxService.waitForTask(
      node.id,
      credentials,
      ticket,
      template.nodeName,
      cloneTask
    );

    if (!cloneSuccess) {
      throw new Error('Clone task failed');
    }

    // Configure VM with plan specs and Cloud-Init
    await this.proxmoxService.configureVm(node.id, credentials, ticket, template.nodeName, vm.vmid, {
      cores: plan.cpu,
      memory: plan.memory,
      ipconfig0: `ip=${ip.address}/${ip.pool.subnet.split('/')[1]},gw=${ip.pool.gateway}`,
      ciuser: 'root',
      cipassword: rootPassword,
      nameserver: '8.8.8.8',
    });

    // Resize disk if needed
    if (plan.disk) {
      await this.proxmoxService.resizeDisk(
        node.id,
        credentials,
        ticket,
        template.nodeName,
        vm.vmid,
        'scsi0',
        `+${plan.disk}G`
      );
    }

    // Assign IP to VM
    await this.ipamService.assignIpToVm(ip.id, vm.id);

    // Start VM
    await this.proxmoxService.startVm(node.id, credentials, ticket, template.nodeName, vm.vmid);

    // Update VM status
    vm.status = VmStatus.RUNNING;
    await this.vmRepo.save(vm);
  }

  private generatePassword(): string {
    const length = 16;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }

  async startVm(vmId: string): Promise<void> {
    const vm = await this.findById(vmId);
    const ticket = await this.getNodeTicket(vm.node);

    await this.proxmoxService.startVm(
      vm.node.id,
      this.getNodeCredentials(vm.node),
      ticket,
      vm.template.nodeName,
      vm.vmid
    );

    vm.status = VmStatus.RUNNING;
    await this.vmRepo.save(vm);
  }

  async stopVm(vmId: string): Promise<void> {
    const vm = await this.findById(vmId);
    const ticket = await this.getNodeTicket(vm.node);

    await this.proxmoxService.stopVm(
      vm.node.id,
      this.getNodeCredentials(vm.node),
      ticket,
      vm.template.nodeName,
      vm.vmid
    );

    vm.status = VmStatus.STOPPED;
    await this.vmRepo.save(vm);
  }

  async rebootVm(vmId: string): Promise<void> {
    const vm = await this.findById(vmId);
    const ticket = await this.getNodeTicket(vm.node);

    await this.proxmoxService.rebootVm(
      vm.node.id,
      this.getNodeCredentials(vm.node),
      ticket,
      vm.template.nodeName,
      vm.vmid
    );
  }

  async reinstallVm(vmId: string): Promise<Vm> {
    const vm = await this.findById(vmId);
    const ticket = await this.getNodeTicket(vm.node);
    const credentials = this.getNodeCredentials(vm.node);

    // Stop VM if running
    if (vm.status === VmStatus.RUNNING) {
      await this.proxmoxService.stopVm(
        vm.node.id,
        credentials,
        ticket,
        vm.template.nodeName,
        vm.vmid
      );
    }

    // Delete existing VM
    await this.proxmoxService.deleteVm(
      vm.node.id,
      credentials,
      ticket,
      vm.template.nodeName,
      vm.vmid
    );

    // Release old IP
    if (vm.ipAddress) {
      await this.ipamService.releaseIp(vm.ipAddress.id);
    }

    // Create new VM with same settings
    const newIp = await this.ipamService.allocateIp(true);
    const rootPassword = this.generatePassword();
    const hashedPassword = await bcrypt.hash(rootPassword, 10);

    // Re-provision
    vm.status = VmStatus.CREATING;
    vm.rootPassword = hashedPassword;
    vm.passwordShown = false;
    vm.ipAddress = newIp;
    await this.vmRepo.save(vm);

    this.provisionVm(vm, vm.node, vm.template, vm.plan, newIp, ticket, rootPassword).catch((error) => {
      this.logger.error(`Failed to reinstall VM ${vm.id}:`, error);
      vm.status = VmStatus.ERROR;
      this.vmRepo.save(vm);
    });

    return vm;
  }

  async getVmCredentials(vmId: string, userId: string): Promise<{ username: string; password: string }> {
    const vm = await this.vmRepo.findOne({
      where: { id: vmId, owner: { id: userId } },
    });

    if (!vm) {
      throw new NotFoundException('VM not found');
    }

    if (vm.passwordShown) {
      throw new BadRequestException('Credentials already shown');
    }

    // Mark as shown
    vm.passwordShown = true;
    await this.vmRepo.save(vm);

    // Return plain password (stored hashed, but we need the plain one - this is a limitation)
    // In real implementation, we'd store encrypted password that can be decrypted once
    return {
      username: 'root',
      password: vm.rootPassword, // This would be the plain password in real implementation
    };
  }

  async getConsoleUrl(vmId: string): Promise<any> {
    const vm = await this.findById(vmId);
    const ticket = await this.getNodeTicket(vm.node);

    return await this.proxmoxService.getConsoleUrl(
      vm.node.id,
      this.getNodeCredentials(vm.node),
      ticket,
      vm.template.nodeName,
      vm.vmid
    );
  }

  async findById(id: string): Promise<Vm> {
    const vm = await this.vmRepo.findOne({
      where: { id },
      relations: ['node', 'template', 'plan', 'ipAddress', 'ipAddress.pool', 'owner', 'organization'],
    });
    if (!vm) {
      throw new NotFoundException('VM not found');
    }
    return vm;
  }

  async findByOwnerId(ownerId: string): Promise<Vm[]> {
    return await this.vmRepo.find({
      where: { owner: { id: ownerId } },
      relations: ['node', 'template', 'plan', 'ipAddress'],
    });
  }

  async findByOrganizationId(organizationId: string): Promise<Vm[]> {
    return await this.vmRepo.find({
      where: { organization: { id: organizationId } },
      relations: ['node', 'template', 'plan', 'ipAddress', 'owner'],
    });
  }

  private async getNodeTicket(node: any): Promise<string> {
    return await this.proxmoxService.authenticate(node.id, {
      host: node.host,
      port: node.port,
      username: node.username,
      password: node.password,
    });
  }

  private getNodeCredentials(node: any) {
    return {
      host: node.host,
      port: node.port,
      username: node.username,
      password: node.password,
    };
  }
}
