# Setup Guide

## Prerequisites

1. **Node.js and pnpm**
   - Node.js 18 or higher
   - pnpm 8 or higher

2. **Proxmox VE Server**
   - Proxmox VE 7.0 or higher
   - API access enabled
   - At least one VM template with Cloud-Init configured

3. **Database and Cache**
   - PostgreSQL 16 or higher
   - Redis 7 or higher (optional but recommended)

## Quick Start with Docker

### 1. Start Database Services

```bash
docker-compose up -d
```

This will start PostgreSQL and Redis containers.

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment

**Backend** (`apps/backend/.env`):
```bash
cp apps/backend/.env.example apps/backend/.env
```

Edit `apps/backend/.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=vps_panel

JWT_SECRET=your-super-secret-jwt-key-change-this
REDIS_HOST=localhost
REDIS_PORT=6379
NODE_ENV=development
API_PORT=3001
```

**Frontend** (`apps/frontend/.env.local`):
```bash
cp apps/frontend/.env.example apps/frontend/.env.local
```

Edit `apps/frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 4. Start Development Servers

```bash
pnpm dev
```

This will start:
- Backend API: http://localhost:3001
- Frontend: http://localhost:3000
- Swagger API Docs: http://localhost:3001/api

## Initial Configuration

### 1. Create First User

1. Go to http://localhost:3000/register
2. Register a new account
3. The first user will be created as a regular user

### 2. Promote to Admin

Connect to PostgreSQL and update the user role:

```sql
-- Connect to database
psql -h localhost -U postgres -d vps_panel

-- Update user role to super_admin
UPDATE users SET role = 'super_admin' WHERE email = 'your@email.com';
```

### 3. Configure Proxmox Node

1. Login and go to http://localhost:3000/admin
2. Click "Add Node" and provide:
   - **Name**: A friendly name (e.g., "pve1")
   - **Host**: Proxmox server IP or hostname
   - **Port**: 8006 (default)
   - **Username**: root@pam
   - **Password**: Your Proxmox root password
   - **Storage**: local-lvm (or your storage name)

### 4. Configure IP Pool

1. In admin panel, go to "IP Pools" tab
2. Click "Add IP Pool":
   - **Name**: Private Network
   - **Subnet**: 10.0.0.0/24 (CIDR notation)
   - **Gateway**: 10.0.0.1
   - **Private**: ✓ (checked)

3. Add IP addresses to the pool:

You need to manually add IPs via API or database:

```bash
# Using API (requires admin token)
curl -X POST http://localhost:3001/ipam/pools/{poolId}/addresses \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"address": "10.0.0.10"}'
```

Or via database:
```sql
-- Add multiple IPs
INSERT INTO ip_addresses (id, address, status, "poolId", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  '10.0.0.' || i,
  'available',
  '{pool-id}',
  NOW(),
  NOW()
FROM generate_series(10, 254) AS i;
```

### 5. Add VM Templates

1. Go to "Templates" tab
2. Click "Add Template":
   - **Name**: Ubuntu 22.04 LTS
   - **VM ID**: 9000 (the template VM ID in Proxmox)
   - **Node Name**: pve (your Proxmox node name)
   - **OS Type**: linux
   - **Description**: Ubuntu 22.04 LTS with Cloud-Init

**Note**: The template must already exist in Proxmox with Cloud-Init configured.

### 6. Create Resource Plans

1. Go to "Plans" tab
2. Click "Add Plan":
   - **Name**: Small
   - **CPU**: 1
   - **Memory**: 1024 (MB)
   - **Disk**: 20 (GB)
   - **Snapshot Quota**: 3

## Preparing Proxmox Templates

### Ubuntu/Debian Template with Cloud-Init

```bash
# Download cloud image
wget https://cloud-images.ubuntu.com/jammy/current/jammy-server-cloudimg-amd64.img

# Create VM
qm create 9000 --name ubuntu-22.04-template --memory 1024 --net0 virtio,bridge=vmbr0

# Import disk
qm importdisk 9000 jammy-server-cloudimg-amd64.img local-lvm

# Configure VM
qm set 9000 --scsihw virtio-scsi-pci --scsi0 local-lvm:vm-9000-disk-0
qm set 9000 --ide2 local-lvm:cloudinit
qm set 9000 --boot c --bootdisk scsi0
qm set 9000 --serial0 socket --vga serial0
qm set 9000 --agent enabled=1

# Add Cloud-Init
qm set 9000 --ipconfig0 ip=dhcp

# Convert to template
qm template 9000
```

## Production Deployment

### Backend

```bash
cd apps/backend
pnpm build
pnpm start:prod
```

### Frontend

```bash
cd apps/frontend
pnpm build
pnpm start
```

### Environment Variables for Production

**Backend**:
- Set `NODE_ENV=production`
- Use strong `JWT_SECRET`
- Configure SSL for database connection
- Use Redis for session management

**Frontend**:
- Set `NEXT_PUBLIC_API_URL` to production API URL

### Reverse Proxy (Nginx)

```nginx
# Backend API
upstream backend {
    server localhost:3001;
}

# Frontend
upstream frontend {
    server localhost:3000;
}

server {
    listen 80;
    server_name your-domain.com;

    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Testing VM Provisioning

1. Login to the dashboard
2. Click "Create VM"
3. Fill in:
   - **VM Name**: test-vm-1
   - **Template**: Ubuntu 22.04 LTS
   - **Plan**: Small
4. Click "Create VM"

The VM will:
- Clone from template
- Allocate IP from pool (collision-free)
- Configure resources per plan
- Setup Cloud-Init with auto-generated password
- Start automatically

## Troubleshooting

### pnpm install fails with SyntaxError

**Error:**
```
/usr/local/lib/node_modules/pnpm/bin/pnpm.cjs:18
  if(!require('module')?.enableCompileCache?.())
                        ^

SyntaxError: Unexpected token '.'
```

**Cause:** This error occurs when Node.js version is older than 14, which doesn't support optional chaining (`?.`) syntax. The project requires Node.js 18 or higher.

**Solution:**

1. **Check your current Node.js version:**
   ```bash
   node --version
   ```

2. **Update Node.js to version 18 or higher:**

   **Option A: Using nvm (recommended):**
   ```bash
   # Install nvm if not already installed
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   
   # Install Node.js 18
   nvm install 18
   nvm use 18
   nvm alias default 18
   ```

   **Option B: Using package manager:**
   ```bash
   # Ubuntu/Debian
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # CentOS/RHEL
   curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
   sudo yum install -y nodejs
   ```

   **Option C: Download from nodejs.org:**
   - Visit https://nodejs.org/
   - Download and install Node.js 18 LTS or higher

3. **Verify the installation:**
   ```bash
   node --version  # Should show v18.x.x or higher
   ```

4. **Install pnpm (if needed):**
   ```bash
   npm install -g pnpm@8.15.0
   ```

5. **Try the installation again:**
   ```bash
   pnpm install
   ```

### VM Creation Fails

1. Check Proxmox node connectivity:
   ```bash
   curl -k https://{proxmox-host}:8006/api2/json/nodes
   ```

2. Verify template exists:
   ```bash
   qm list | grep 9000
   ```

3. Check database logs:
   ```bash
   docker-compose logs postgres
   ```

### IP Allocation Issues

1. Verify IP pool has available addresses:
   ```sql
   SELECT * FROM ip_addresses WHERE status = 'available';
   ```

2. Check for collision:
   ```sql
   SELECT address, status, COUNT(*) 
   FROM ip_addresses 
   GROUP BY address, status 
   HAVING COUNT(*) > 1;
   ```

### Cloud-Init Not Working

1. Ensure qemu-guest-agent is installed in template
2. Verify Cloud-Init is enabled:
   ```bash
   qm config 9000 | grep ide2
   ```

3. Check VM has Cloud-Init drive

## API Documentation

Swagger documentation available at: http://localhost:3001/api

### Key Endpoints

**Authentication**:
- POST `/auth/register` - Register
- POST `/auth/login` - Login

**VMs**:
- GET `/vms` - List VMs
- POST `/vms` - Create VM
- POST `/vms/:id/start` - Start VM
- POST `/vms/:id/stop` - Stop VM
- POST `/vms/:id/reboot` - Reboot VM
- POST `/vms/:id/reinstall` - Reinstall VM
- GET `/vms/:id/credentials` - Get credentials (show once)

**Snapshots**:
- GET `/vms/:vmId/snapshots` - List snapshots
- POST `/vms/:vmId/snapshots` - Create snapshot
- POST `/vms/:vmId/snapshots/:id/rollback` - Rollback
- DELETE `/vms/:vmId/snapshots/:id` - Delete

**Admin** (requires super_admin role):
- GET/POST/PUT/DELETE `/nodes` - Manage nodes
- GET/POST/PUT/DELETE `/templates` - Manage templates
- GET/POST/PUT/DELETE `/plans` - Manage plans
- GET/POST `/ipam/pools` - Manage IP pools

## Security Notes

1. **JWT Secret**: Always use a strong, random JWT secret in production
2. **Passwords**: Proxmox passwords are stored encrypted
3. **HTTPS**: Always use HTTPS in production for Proxmox API
4. **RBAC**: Role-based access control is enforced on all admin endpoints
5. **Show-Once Credentials**: Root passwords can only be viewed once after VM creation

## Support

For issues:
- GitHub Issues: https://github.com/Leopixel1/vps-panel-copilot/issues
- Documentation: See README.md
