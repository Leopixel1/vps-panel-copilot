import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Node } from './node.entity';
import { NodesService } from './nodes.service';
import { NodesController } from './nodes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Node])],
  providers: [NodesService],
  controllers: [NodesController],
  exports: [NodesService],
})
export class NodesModule {}
