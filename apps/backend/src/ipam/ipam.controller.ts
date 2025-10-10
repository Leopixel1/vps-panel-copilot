import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IpamService } from './ipam.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';
import { RolesGuard } from '../auth/roles.guard';

@ApiTags('ipam')
@Controller('ipam')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IpamController {
  constructor(private readonly ipamService: IpamService) {}

  @Post('pools')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create IP pool (Admin only)' })
  async createPool(@Body() createPoolDto: any) {
    return await this.ipamService.createPool(
      createPoolDto.name,
      createPoolDto.subnet,
      createPoolDto.gateway,
      createPoolDto.isPrivate
    );
  }

  @Post('pools/:poolId/addresses')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add IP to pool (Admin only)' })
  async addIpToPool(@Param('poolId') poolId: string, @Body() body: { address: string }) {
    return await this.ipamService.addIpToPool(poolId, body.address);
  }

  @Get('pools')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all IP pools (Admin only)' })
  async getAllPools() {
    return await this.ipamService.getAllPools();
  }

  @Get('pools/:id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get IP pool by ID (Admin only)' })
  async getPoolById(@Param('id') id: string) {
    return await this.ipamService.getPoolById(id);
  }
}
