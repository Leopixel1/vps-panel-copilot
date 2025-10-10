import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PlansService } from './plans.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';
import { RolesGuard } from '../auth/roles.guard';

@ApiTags('plans')
@Controller('plans')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create plan (Admin only)' })
  async create(@Body() createPlanDto: any) {
    return await this.plansService.create(createPlanDto);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all plans' })
  async findAll() {
    return await this.plansService.findAll();
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get plan by ID' })
  async findById(@Param('id') id: string) {
    return await this.plansService.findById(id);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update plan (Admin only)' })
  async update(@Param('id') id: string, @Body() updatePlanDto: any) {
    return await this.plansService.update(id, updatePlanDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete plan (Admin only)' })
  async delete(@Param('id') id: string) {
    await this.plansService.delete(id);
    return { message: 'Plan deleted successfully' };
  }
}
