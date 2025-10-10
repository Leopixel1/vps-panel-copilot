import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Node } from './node.entity';

@Injectable()
export class NodesService {
  constructor(
    @InjectRepository(Node)
    private nodeRepo: Repository<Node>,
  ) {}

  async create(data: Partial<Node>): Promise<Node> {
    const node = this.nodeRepo.create(data);
    return await this.nodeRepo.save(node);
  }

  async findAll(): Promise<Node[]> {
    return await this.nodeRepo.find();
  }

  async findById(id: string): Promise<Node> {
    const node = await this.nodeRepo.findOne({ where: { id } });
    if (!node) {
      throw new NotFoundException('Node not found');
    }
    return node;
  }

  async getActiveNode(): Promise<Node> {
    const node = await this.nodeRepo.findOne({ where: { active: true } });
    if (!node) {
      throw new NotFoundException('No active node found');
    }
    return node;
  }

  async update(id: string, data: Partial<Node>): Promise<Node> {
    await this.nodeRepo.update(id, data);
    return await this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.nodeRepo.delete(id);
  }
}
