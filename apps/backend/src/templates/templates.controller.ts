import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TemplatesService } from './templates.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';
import { RolesGuard } from '../auth/roles.guard';

@ApiTags('templates')
@Controller('templates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create template (Admin only)' })
  async create(@Body() createTemplateDto: any) {
    return await this.templatesService.create(createTemplateDto);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all templates' })
  async findAll() {
    return await this.templatesService.findAll();
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get template by ID' })
  async findById(@Param('id') id: string) {
    return await this.templatesService.findById(id);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update template (Admin only)' })
  async update(@Param('id') id: string, @Body() updateTemplateDto: any) {
    return await this.templatesService.update(id, updateTemplateDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete template (Admin only)' })
  async delete(@Param('id') id: string) {
    await this.templatesService.delete(id);
    return { message: 'Template deleted successfully' };
  }
}
