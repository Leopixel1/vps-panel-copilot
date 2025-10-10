import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NodesService } from './nodes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';
import { RolesGuard } from '../auth/roles.guard';

@ApiTags('nodes')
@Controller('nodes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NodesController {
  constructor(private readonly nodesService: NodesService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create node (Admin only)' })
  async create(@Body() createNodeDto: any) {
    return await this.nodesService.create(createNodeDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all nodes (Admin only)' })
  async findAll() {
    return await this.nodesService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get node by ID (Admin only)' })
  async findById(@Param('id') id: string) {
    return await this.nodesService.findById(id);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update node (Admin only)' })
  async update(@Param('id') id: string, @Body() updateNodeDto: any) {
    return await this.nodesService.update(id, updateNodeDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete node (Admin only)' })
  async delete(@Param('id') id: string) {
    await this.nodesService.delete(id);
    return { message: 'Node deleted successfully' };
  }
}
