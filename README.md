# VPS Panel - Multi-tenant Proxmox Management

A comprehensive multi-tenant VPS management panel built with Next.js, NestJS, PostgreSQL, and Redis. Provision and manage virtual machines on Proxmox using Cloud-Init.

## Features

### VM Management
- **Provision VMs** from existing templates (Ubuntu LTS, Debian 12, AlmaLinux 9, extensible to Windows)
- **Lifecycle Operations**: Create, Start, Stop, Reboot, Reinstall
- **Console Access**: Web-based VNC console
- **Snapshots**: Create, rollback, delete with quota management
- **Show-once Credentials**: Secure one-time password display

### Network Management (IPAM)
- **IP Address Management** with collision-free allocation
- **Private IP Pool** (preferred) with public IP support
- **Automatic IP Assignment** during VM provisioning
- **Subnet Management** with CIDR notation

### Admin Features
- **Node Management**: Add/configure Proxmox nodes
- **Template Management**: Define VM templates
- **Plan Management**: CPU, Memory, Disk, Snapshot quotas
- **IP Pool Management**: Configure private/public IP ranges
- **Multi-tenant**: Organization and user management

### Technology Stack
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: NestJS + TypeScript
- **Database**: PostgreSQL 16
- **Cache**: Redis 7
- **API Integration**: Proxmox VE API + Cloud-Init

## Architecture

```
vps-panel-copilot/
├── apps/
│   ├── backend/          # NestJS API server
│   │   └── src/
│   │       ├── auth/     # Authentication & authorization
│   │       ├── users/    # User management
│   │       ├── organizations/  # Multi-tenancy
│   │       ├── nodes/    # Proxmox node management
│   │       ├── templates/ # VM template management
│   │       ├── plans/    # Resource plans
│   │       ├── ipam/     # IP address management
│   │       ├── vms/      # VM lifecycle management
│   │       ├── snapshots/ # Snapshot management
│   │       └── proxmox/  # Proxmox API integration
│   └── frontend/         # Next.js web application
├── packages/             # Shared packages (future)
├── docker-compose.yml    # Local development setup
└── turbo.json           # Monorepo configuration
```

## Quick Start

### Prerequisites
- Node.js 18+ and pnpm 8+
- Docker and Docker Compose (for local development)
- Proxmox VE server with API access

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Leopixel1/vps-panel-copilot.git
cd vps-panel-copilot
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Start database services**
```bash
docker-compose up -d
```

4. **Configure environment variables**

Backend (`apps/backend/.env`):
```bash
cp apps/backend/.env.example apps/backend/.env
# Edit apps/backend/.env with your configuration
```

Frontend (`apps/frontend/.env`):
```bash
cp apps/frontend/.env.example apps/frontend/.env
```

5. **Start development servers**
```bash
pnpm dev
```

The frontend will be available at `http://localhost:3000` and the backend API at `http://localhost:3001`.

API documentation (Swagger) is available at `http://localhost:3001/api`.

### Initial Setup

1. **Register first user** (will be created as regular user)
2. **Manually promote to admin** (update role in database)
3. **Add Proxmox node** via admin panel
4. **Configure IP pools** (private first, public later)
5. **Add VM templates** (reference existing Proxmox templates)
6. **Create resource plans** (CPU, RAM, Disk, snapshot quotas)
7. **Provision VMs** from the dashboard

## VM Provisioning Flow

1. **Select Template & Plan**: Choose OS template and resource allocation
2. **IP Allocation**: System automatically allocates IP from private pool with collision prevention
3. **Clone Template**: VM is cloned from Proxmox template
4. **Configure Resources**: CPU, memory, disk configured per plan
5. **Cloud-Init Setup**: Network, credentials configured via Cloud-Init
6. **Start VM**: VM boots with configured settings
7. **Show Credentials**: Root password displayed once (show-once feature)

## Key Features Implementation

### IPAM Collision Prevention
- Uses PostgreSQL row-level locking (`pessimistic_write`)
- Transaction-based IP allocation
- IP status tracking (available, reserved, assigned)

### Cloud-Init Integration
- Automatic network configuration
- One-time password generation
- Hostname and DNS setup
- Supports both Linux and Windows (extensible)

### Reinstall Functionality
1. Stops running VM
2. Deletes existing VM from Proxmox
3. Releases IP address
4. Allocates new IP
5. Provisions fresh VM with new credentials

### Snapshot Management
- Quota enforcement per plan
- Create, rollback, delete operations
- Stored on Proxmox with metadata in database

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login

### VMs
- `POST /vms` - Create VM
- `GET /vms` - List user VMs
- `GET /vms/:id` - Get VM details
- `POST /vms/:id/start` - Start VM
- `POST /vms/:id/stop` - Stop VM
- `POST /vms/:id/reboot` - Reboot VM
- `POST /vms/:id/reinstall` - Reinstall VM
- `GET /vms/:id/credentials` - Get credentials (show once)
- `GET /vms/:id/console` - Get console URL

### Snapshots
- `POST /vms/:vmId/snapshots` - Create snapshot
- `GET /vms/:vmId/snapshots` - List snapshots
- `POST /vms/:vmId/snapshots/:id/rollback` - Rollback
- `DELETE /vms/:vmId/snapshots/:id` - Delete snapshot

### Admin Endpoints
- Nodes: `GET/POST/PUT/DELETE /nodes`
- Templates: `GET/POST/PUT/DELETE /templates`
- Plans: `GET/POST/PUT/DELETE /plans`
- IP Pools: `GET/POST /ipam/pools`

## Database Schema

### Core Entities
- **Users**: Authentication and authorization
- **Organizations**: Multi-tenant isolation
- **Nodes**: Proxmox server configuration
- **Templates**: VM template definitions
- **Plans**: Resource allocation plans
- **IpPools**: IP address pools
- **IpAddresses**: Individual IP tracking
- **VMs**: Virtual machine instances
- **Snapshots**: VM snapshots

## Security Considerations

- JWT-based authentication
- Role-based access control (RBAC)
- Password hashing with bcrypt
- Show-once credentials feature
- HTTPS required for Proxmox API
- Multi-tenant data isolation

## Performance & Scalability

- Transaction-based IP allocation prevents race conditions
- Async VM provisioning (non-blocking)
- Redis caching for frequently accessed data
- PostgreSQL connection pooling
- Background task processing

## Development

### Running Tests
```bash
pnpm test
```

### Linting
```bash
pnpm lint
```

### Building for Production
```bash
pnpm build
```

## Deployment

### Production Environment Variables
- Set strong `JWT_SECRET`
- Configure database with SSL
- Set `NODE_ENV=production`
- Configure Redis for session storage

### Proxmox Requirements
- Proxmox VE 7.0+
- API token with VM management permissions
- Pre-configured VM templates with Cloud-Init
- Network bridge configuration

## Roadmap

- [ ] Public IP pool support (currently private only)
- [ ] Windows template support
- [ ] Backup and restore functionality
- [ ] Billing integration
- [ ] Email notifications
- [ ] Two-factor authentication
- [ ] Resource usage monitoring
- [ ] Automated scaling

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## License

MIT License - see [LICENSE](LICENSE) file for details

## Support

For issues and questions:
- GitHub Issues: https://github.com/Leopixel1/vps-panel-copilot/issues
- Documentation: See `/docs` folder

## Acknowledgments

Built with:
- [Next.js](https://nextjs.org/)
- [NestJS](https://nestjs.com/)
- [Proxmox VE](https://www.proxmox.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [PostgreSQL](https://www.postgresql.org/)
- [Redis](https://redis.io/)
