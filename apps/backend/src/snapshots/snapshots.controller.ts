import { Controller, Post, Get, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SnapshotsService } from './snapshots.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('snapshots')
@Controller('vms/:vmId/snapshots')
@UseGuards(JwtAuthGuard)
export class SnapshotsController {
  constructor(private readonly snapshotsService: SnapshotsService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create snapshot' })
  async create(
    @Param('vmId') vmId: string,
    @Body() createSnapshotDto: { name: string; description?: string }
  ) {
    return await this.snapshotsService.create(
      vmId,
      createSnapshotDto.name,
      createSnapshotDto.description
    );
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all snapshots for VM' })
  async findByVmId(@Param('vmId') vmId: string) {
    return await this.snapshotsService.findByVmId(vmId);
  }

  @Post(':id/rollback')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rollback to snapshot' })
  async rollback(@Param('vmId') vmId: string, @Param('id') id: string) {
    await this.snapshotsService.rollback(id, vmId);
    return { message: 'Snapshot rollback initiated' };
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete snapshot' })
  async delete(@Param('vmId') vmId: string, @Param('id') id: string) {
    await this.snapshotsService.delete(id, vmId);
    return { message: 'Snapshot deleted successfully' };
  }
}
