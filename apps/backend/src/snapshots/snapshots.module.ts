import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Snapshot } from './snapshot.entity';
import { SnapshotsService } from './snapshots.service';
import { SnapshotsController } from './snapshots.controller';
import { VmsModule } from '../vms/vms.module';
import { ProxmoxModule } from '../proxmox/proxmox.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Snapshot]),
    VmsModule,
    ProxmoxModule,
  ],
  providers: [SnapshotsService],
  controllers: [SnapshotsController],
})
export class SnapshotsModule {}
