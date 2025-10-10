# Architecture Overview

## System Architecture

The VPS Panel is built as a modern monorepo application with clear separation between frontend and backend concerns.

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Interface                            │
│                    (Next.js + TailwindCSS)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐    │
│  │   Login/    │  │   Dashboard  │  │  Admin Dashboard     │    │
│  │   Register  │  │   (User VMs) │  │  (Infrastructure)    │    │
│  └─────────────┘  └──────────────┘  └─────────────────────┘    │
│                                                                   │
├─────────────────────────────────────────────────────────────────┤
│                        API Layer (REST)                          │
│                         (NestJS)                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │   Auth   │  │   VMs    │  │ Snapshots│  │    IPAM      │   │
│  │  Module  │  │  Module  │  │  Module  │  │   Module     │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │  Nodes   │  │Templates │  │  Plans   │  │   Proxmox    │   │
│  │  Module  │  │  Module  │  │  Module  │  │   Service    │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │
│                                                                   │
├─────────────────────────────────────────────────────────────────┤
│                    Data Persistence Layer                        │
│                                                                   │
│         ┌──────────────────┐         ┌──────────────┐          │
│         │    PostgreSQL    │         │    Redis     │          │
│         │   (Main Store)   │         │   (Cache)    │          │
│         └──────────────────┘         └──────────────┘          │
│                                                                   │
├─────────────────────────────────────────────────────────────────┤
│                  External Integration Layer                      │
│                                                                   │
│              ┌────────────────────────────────┐                 │
│              │        Proxmox VE API          │                 │
│              │     (VM Lifecycle & Cloud-Init)│                 │
│              └────────────────────────────────┘                 │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Core Components

### Frontend (Next.js App)

**Location**: `apps/frontend/`

- **App Router**: Modern Next.js 14 with App Router
- **Pages**:
  - `/` - Landing page
  - `/login` - User authentication
  - `/register` - User registration
  - `/dashboard` - User VM management
  - `/admin` - Admin panel (super_admin only)

- **Key Features**:
  - JWT-based authentication
  - Real-time VM status updates
  - Modal-based VM creation
  - Admin resource management

### Backend (NestJS API)

**Location**: `apps/backend/`

#### Module Structure

1. **Auth Module** (`src/auth/`)
   - JWT authentication strategy
   - Local authentication strategy
   - Role-based guards (RBAC)
   - Password hashing with bcrypt

2. **Users Module** (`src/users/`)
   - User entity and repository
   - User CRUD operations
   - Password validation

3. **Organizations Module** (`src/organizations/`)
   - Multi-tenant organization management
   - Organization-VM relationships

4. **VMs Module** (`src/vms/`)
   - VM lifecycle management
   - VM provisioning orchestration
   - Status tracking
   - Credential management (show-once)

5. **Proxmox Module** (`src/proxmox/`)
   - Proxmox API client
   - VM cloning and configuration
   - Cloud-Init setup
   - Console access (VNC proxy)
   - Task monitoring

6. **IPAM Module** (`src/ipam/`)
   - IP pool management
   - Collision-free IP allocation
   - Transaction-based locking
   - Subnet management

7. **Nodes Module** (`src/nodes/`)
   - Proxmox node configuration
   - Node credentials management
   - Active node selection

8. **Templates Module** (`src/templates/`)
   - VM template definitions
   - OS type tracking
   - Template-to-VM mapping

9. **Plans Module** (`src/plans/`)
   - Resource plan definitions
   - CPU, RAM, disk quotas
   - Snapshot quota management

10. **Snapshots Module** (`src/snapshots/`)
    - Snapshot creation
    - Rollback functionality
    - Quota enforcement
    - Proxmox snapshot sync

## Data Flow

### VM Provisioning Flow

```
User Request (Create VM)
    ↓
Frontend: /dashboard → Create VM Modal
    ↓
API: POST /vms { name, templateId, planId }
    ↓
IPAM Service: Allocate IP (with row-level lock)
    ↓
Proxmox Service: Authenticate & Get Next VM ID
    ↓
Database: Create VM record (status: creating)
    ↓
Background Task:
    1. Clone VM from template
    2. Wait for clone completion
    3. Configure resources (CPU, RAM)
    4. Setup Cloud-Init (IP, password, hostname)
    5. Resize disk if needed
    6. Assign IP to VM
    7. Start VM
    8. Update status to 'running'
    ↓
Frontend: Displays new VM in dashboard
```

### IPAM Collision Prevention

```
Request: Allocate IP
    ↓
Start Transaction
    ↓
Query: SELECT ... WHERE status='available' FOR UPDATE
    ↓
(Row-level pessimistic lock acquired)
    ↓
Update: SET status='reserved'
    ↓
Commit Transaction
    ↓
Return IP to caller
```

### Show-Once Credentials

```
VM Created
    ↓
Generate random password (16 chars)
    ↓
Store hashed password in DB
    ↓
Configure Cloud-Init with plain password
    ↓
User requests credentials (first time)
    ↓
API: Check passwordShown flag
    ↓
If false:
    - Return password
    - Set passwordShown = true
    ↓
If true:
    - Return error "Already shown"
```

## Database Schema

### Core Entities

- **users**: User accounts with roles
- **organizations**: Multi-tenant organizations
- **nodes**: Proxmox server configurations
- **templates**: VM template definitions
- **plans**: Resource allocation plans
- **ip_pools**: IP address pools (CIDR subnets)
- **ip_addresses**: Individual IP tracking
- **vms**: Virtual machine instances
- **snapshots**: VM snapshots

### Relationships

```
organizations
    ↓ (one-to-many)
users → vms

nodes
    ↓ (one-to-many)
vms

templates
    ↓ (one-to-many)
vms

plans
    ↓ (one-to-many)
vms

ip_pools
    ↓ (one-to-many)
ip_addresses
    ↓ (one-to-one)
vms

vms
    ↓ (one-to-many)
snapshots
```

## Security Architecture

### Authentication & Authorization

1. **JWT Tokens**
   - Issued on login/register
   - 7-day expiration
   - Stored in localStorage
   - Sent via Authorization header

2. **Role-Based Access Control**
   - `super_admin`: Full access to admin panel
   - `org_admin`: Manage organization users
   - `user`: Manage own VMs

3. **Guard System**
   - `JwtAuthGuard`: Verify JWT token
   - `RolesGuard`: Check user role
   - Applied to controllers/routes

### Data Protection

1. **Password Hashing**: bcrypt (10 rounds)
2. **Proxmox Credentials**: Encrypted in database
3. **HTTPS**: Required for Proxmox API
4. **Show-Once Passwords**: Flag prevents re-display
5. **CORS**: Enabled with origin validation

## API Design

### RESTful Endpoints

- **Authentication**: `/auth/*`
- **VMs**: `/vms/*`
- **Snapshots**: `/vms/:vmId/snapshots/*`
- **Admin Resources**: `/nodes`, `/templates`, `/plans`, `/ipam/pools`

### Response Format

```json
{
  "id": "uuid",
  "name": "resource-name",
  "status": "active",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

### Error Handling

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

## Cloud-Init Integration

### Configuration Flow

1. **Network Setup**
   ```yaml
   ipconfig0: ip=10.0.0.10/24,gw=10.0.0.1
   ```

2. **User Configuration**
   ```yaml
   ciuser: root
   cipassword: <generated-password>
   ```

3. **DNS Configuration**
   ```yaml
   nameserver: 8.8.8.8
   ```

### Template Requirements

- Cloud-Init package installed
- Cloud-Init drive configured (IDE2)
- qemu-guest-agent enabled
- Network interface configured

## Scalability Considerations

### Horizontal Scaling

- **Backend**: Stateless API servers (load balanced)
- **Frontend**: Static generation + CDN
- **Database**: PostgreSQL replication
- **Redis**: Cluster mode for session store

### Performance Optimization

- **IP Allocation**: Row-level locking (prevents collision)
- **VM Provisioning**: Async background tasks
- **Caching**: Redis for frequently accessed data
- **Connection Pooling**: TypeORM connection pool

### Monitoring Points

- API response times
- VM provisioning duration
- Database query performance
- Proxmox API latency
- IP pool utilization

## Future Enhancements

1. **Public IP Support**: Already architected, needs configuration
2. **Windows Templates**: Extensible via osType field
3. **Backup/Restore**: Snapshot-based backups
4. **Billing Integration**: Usage tracking ready
5. **Notifications**: Email/SMS on VM events
6. **2FA**: Additional auth layer
7. **Monitoring**: Resource usage dashboards
8. **Auto-scaling**: Based on load patterns

## Development Workflow

### Monorepo Structure

```
pnpm-workspace.yaml          # Workspace configuration
turbo.json                   # Build pipeline
package.json                 # Root dependencies

apps/
  backend/                   # NestJS API
  frontend/                  # Next.js App

packages/                    # Shared packages (future)
```

### Build Pipeline (Turbo)

1. **Backend Build**: `nest build`
2. **Frontend Build**: `next build`
3. **Parallel Execution**: Both build simultaneously
4. **Caching**: Turbo caches build artifacts

### Testing Strategy

- **Unit Tests**: Jest for services
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Cypress for UI flows
- **Manual Testing**: Proxmox integration

## Deployment Architecture

### Production Setup

```
Internet
    ↓
Load Balancer (Nginx/HAProxy)
    ↓
    ├── Frontend (Next.js) - Port 3000
    └── Backend (NestJS) - Port 3001
            ↓
    ├── PostgreSQL - Port 5432
    ├── Redis - Port 6379
    └── Proxmox VE - Port 8006
```

### Environment Configuration

- **Development**: Docker Compose
- **Staging**: Kubernetes cluster
- **Production**: Kubernetes with auto-scaling

### Backup Strategy

1. **Database**: Daily PostgreSQL dumps
2. **VM Snapshots**: User-managed + automated
3. **Configuration**: Git-based versioning
4. **Secrets**: Encrypted vault storage
