import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { ProxmoxModule } from './proxmox/proxmox.module';
import { VmsModule } from './vms/vms.module';
import { IpamModule } from './ipam/ipam.module';
import { NodesModule } from './nodes/nodes.module';
import { TemplatesModule } from './templates/templates.module';
import { PlansModule } from './plans/plans.module';
import { SnapshotsModule } from './snapshots/snapshots.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get('DB_PORT', 5432),
        username: config.get('DB_USER', 'postgres'),
        password: config.get('DB_PASSWORD', 'postgres'),
        database: config.get('DB_NAME', 'vps_panel'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: config.get('NODE_ENV') !== 'production',
      }),
    }),
    AuthModule,
    UsersModule,
    OrganizationsModule,
    ProxmoxModule,
    VmsModule,
    IpamModule,
    NodesModule,
    TemplatesModule,
    PlansModule,
    SnapshotsModule,
  ],
})
export class AppModule {}
