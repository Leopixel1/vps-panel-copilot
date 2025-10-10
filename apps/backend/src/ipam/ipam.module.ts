import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IpPool } from './ip-pool.entity';
import { IpAddress } from './ip-address.entity';
import { IpamService } from './ipam.service';
import { IpamController } from './ipam.controller';

@Module({
  imports: [TypeOrmModule.forFeature([IpPool, IpAddress])],
  providers: [IpamService],
  controllers: [IpamController],
  exports: [IpamService],
})
export class IpamModule {}
