import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './organization.entity';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private orgRepo: Repository<Organization>,
  ) {}

  async create(name: string, description?: string): Promise<Organization> {
    const org = this.orgRepo.create({ name, description });
    return await this.orgRepo.save(org);
  }

  async findAll(): Promise<Organization[]> {
    return await this.orgRepo.find({ relations: ['users', 'vms'] });
  }

  async findById(id: string): Promise<Organization | null> {
    return await this.orgRepo.findOne({
      where: { id },
      relations: ['users', 'vms'],
    });
  }
}
