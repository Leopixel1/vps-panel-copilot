import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Template } from './template.entity';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectRepository(Template)
    private templateRepo: Repository<Template>,
  ) {}

  async create(data: Partial<Template>): Promise<Template> {
    const template = this.templateRepo.create(data);
    return await this.templateRepo.save(template);
  }

  async findAll(): Promise<Template[]> {
    return await this.templateRepo.find({ where: { active: true } });
  }

  async findById(id: string): Promise<Template> {
    const template = await this.templateRepo.findOne({ where: { id } });
    if (!template) {
      throw new NotFoundException('Template not found');
    }
    return template;
  }

  async update(id: string, data: Partial<Template>): Promise<Template> {
    await this.templateRepo.update(id, data);
    return await this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.templateRepo.delete(id);
  }
}
