import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vm } from './vm.entity';
import { VmsService } from './vms.service';
import { VmsController } from './vms.controller';
import { ProxmoxModule } from '../proxmox/proxmox.module';
import { IpamModule } from '../ipam/ipam.module';
import { NodesModule } from '../nodes/nodes.module';
import { TemplatesModule } from '../templates/templates.module';
import { PlansModule } from '../plans/plans.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Vm]),
    ProxmoxModule,
    IpamModule,
    NodesModule,
    TemplatesModule,
    PlansModule,
  ],
  providers: [VmsService],
  controllers: [VmsController],
  exports: [VmsService],
})
export class VmsModule {}
