import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan } from './plan.entity';

@Injectable()
export class PlansService {
  constructor(
    @InjectRepository(Plan)
    private planRepo: Repository<Plan>,
  ) {}

  async create(data: Partial<Plan>): Promise<Plan> {
    const plan = this.planRepo.create(data);
    return await this.planRepo.save(plan);
  }

  async findAll(): Promise<Plan[]> {
    return await this.planRepo.find({ where: { active: true } });
  }

  async findById(id: string): Promise<Plan> {
    const plan = await this.planRepo.findOne({ where: { id } });
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }
    return plan;
  }

  async update(id: string, data: Partial<Plan>): Promise<Plan> {
    await this.planRepo.update(id, data);
    return await this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.planRepo.delete(id);
  }
}
