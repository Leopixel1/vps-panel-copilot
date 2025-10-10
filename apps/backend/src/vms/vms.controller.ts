import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VmsService } from './vms.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('vms')
@Controller('vms')
@UseGuards(JwtAuthGuard)
export class VmsController {
  constructor(private readonly vmsService: VmsService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create VM' })
  async create(@Body() createVmDto: any, @Request() req) {
    return await this.vmsService.createVm(
      createVmDto.name,
      createVmDto.templateId,
      createVmDto.planId,
      req.user.id,
      req.user.organizationId
    );
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user VMs' })
  async findByOwner(@Request() req) {
    return await this.vmsService.findByOwnerId(req.user.id);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get VM by ID' })
  async findById(@Param('id') id: string) {
    return await this.vmsService.findById(id);
  }

  @Post(':id/start')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start VM' })
  async start(@Param('id') id: string) {
    await this.vmsService.startVm(id);
    return { message: 'VM started successfully' };
  }

  @Post(':id/stop')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Stop VM' })
  async stop(@Param('id') id: string) {
    await this.vmsService.stopVm(id);
    return { message: 'VM stopped successfully' };
  }

  @Post(':id/reboot')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reboot VM' })
  async reboot(@Param('id') id: string) {
    await this.vmsService.rebootVm(id);
    return { message: 'VM reboot initiated' };
  }

  @Post(':id/reinstall')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reinstall VM' })
  async reinstall(@Param('id') id: string) {
    return await this.vmsService.reinstallVm(id);
  }

  @Get(':id/credentials')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get VM credentials (show once)' })
  async getCredentials(@Param('id') id: string, @Request() req) {
    return await this.vmsService.getVmCredentials(id, req.user.id);
  }

  @Get(':id/console')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get console URL' })
  async getConsole(@Param('id') id: string) {
    return await this.vmsService.getConsoleUrl(id);
  }
}
