# 🐳 TrueMark Mint - Docker Deployment Guide

## Overview

Complete Docker orchestration for the TrueMark Mint platform with Certificate Forge v2.0 and Swarm Knowledge Graph (SKG) v1.0 integration.

---

## 📦 Container Architecture

### Service Overview

| Service | Container | Port | Purpose |
|---------|-----------|------|---------|
| **Frontend** | truemark-frontend | 8081:8080 | Alpha CertSig Taxonomy Interface |
| **Backend** | truemark-backend | 5000:5000 | Flask API & Mint Engine |
| **Forge** | truemark-forge | - | Certificate Forge v2.0 + SKG |
| **NGINX** | truemark-nginx | 8082:80, 8443:443 | Reverse Proxy |
| **Redis** | truemark-redis | 6379:6379 | Session Management |

---

## 🚀 Quick Start

### Prerequisites

1. **Docker Desktop** (Windows/Mac) or **Docker Engine** (Linux)
   - Download: https://www.docker.com/products/docker-desktop
   - Minimum Version: Docker 20.10+, Docker Compose 2.0+

2. **System Requirements**
   - RAM: 4GB minimum, 8GB recommended
   - Disk: 10GB free space
   - CPU: 2 cores minimum

### Installation Steps

#### Step 1: Start Docker Desktop

```powershell
# Windows - Start Docker Desktop application
# Check status
docker version
docker-compose version
```

#### Step 2: Clone & Navigate

```powershell
cd t:\truemark-mint
```

#### Step 3: Build All Services

```powershell
# Build all containers
docker-compose build

# Or build individually
docker-compose build frontend
docker-compose build backend
docker-compose build forge
```

#### Step 4: Start Services

```powershell
# Start all services in detached mode
docker-compose up -d

# Or start with logs visible
docker-compose up
```

#### Step 5: Verify Deployment

```powershell
# Check running containers
docker-compose ps

# View logs
docker-compose logs -f

# Check specific service
docker-compose logs -f forge
```

---

## 🔧 Service Configuration

### Certificate Forge v2.0 (forge)

**Dockerfile:** `Dockerfile.forge`

**Volumes:**
- `./forge_v2.0/vault_system:/app/vault_system` - SKG graph storage
- `./forge_v2.0/keys:/app/keys` - Ed25519 signing keys
- `./forge_v2.0/templates:/app/templates` - Certificate templates
- `./forge_v2.0/fonts:/app/fonts` - Typography assets

**Environment:**
- `PYTHONUNBUFFERED=1` - Real-time logs

**Command:**
```powershell
# Execute inside running container
docker-compose exec forge python certificate_forge.py --help

# Generate test certificate
docker-compose exec forge python certificate_forge.py test

# Generate with custom data
docker-compose exec forge python certificate_forge.py \
  --owner "John Doe" \
  --wallet "0x1234567890abcdef1234567890abcdef12345678" \
  --asset "Premium Asset #001" \
  --ipfs "QmHash123..." \
  --chain "ethereum"
```

**Features Included:**
- ✅ 10 Forensic Security Layers
- ✅ Ed25519 Cryptographic Signing
- ✅ SKG v1.0 Pattern Learning
- ✅ JSONL Vault Integration
- ✅ Anti-AI Artifacts

---

### Backend Service (backend)

**Dockerfile:** `Dockerfile.backend`

**Ports:** 5000:5000

**API Endpoints:**
- `http://localhost:5000/health` - Health check
- `http://localhost:5000/api/v1/mint` - Certificate minting
- `http://localhost:5000/api/v1/monitoring/skg` - SKG metrics
- `http://localhost:5000/api/v1/skg/portfolio/{wallet}` - Wallet portfolio

**Environment Variables:**
```yaml
FLASK_ENV=production
DATABASE_URL=sqlite:///data/truemark.db
SECRET_KEY=your-secret-key-here
JWT_SECRET=your-jwt-secret-here
IPFS_NODE_URL=https://ipfs.infura.io:5001
WEB3_PROVIDER_URL=https://mainnet.infura.io/v3/your-project-id
```

**Health Check:**
```powershell
curl http://localhost:5000/health
```

---

### Frontend Service (frontend)

**Dockerfile:** `Dockerfile.frontend`

**Ports:** 8081:8080

**Features:**
- Alpha CertSig Taxonomy Interface
- Security Monitor Dashboard
- SKG Metrics Display (when integrated)

**Access:**
```
http://localhost:8081
```

---

### NGINX Reverse Proxy (nginx)

**Config:** `nginx.conf`

**Ports:**
- 8082:80 (HTTP)
- 8443:443 (HTTPS)

**SSL:**
- Certificates: `./ssl/`
- Self-signed certs for development

**Routes:**
- `/` → Frontend (8080)
- `/api` → Backend (5000)
- `/forge` → Forge API (future)

---

## 📊 SKG v1.0 Integration

### Vault Structure in Docker

```
/app/vault_system/
├── skg_graph/
│   └── worker_skg/
│       └── certificate_forge_worker_001/
│           ├── nodes.jsonl          # Certificate nodes
│           ├── edges.jsonl          # Ownership/anchor edges
│           └── transactions.jsonl   # SKG events
├── certificates/
│   └── issued/
│       └── DALSKM20251210-*.pdf
├── workers/
│   └── WORKER_certificate_forge_worker_001_*.jsonl
└── fusion_queue/
    └── FUSION_QUEUE_*.jsonl
```

### Accessing Vault Data

```powershell
# List vault contents
docker-compose exec forge ls -la /app/vault_system/skg_graph/

# View SKG nodes
docker-compose exec forge cat /app/vault_system/skg_graph/worker_skg/certificate_forge_worker_001/nodes.jsonl

# View transactions
docker-compose exec forge cat /app/vault_system/skg_graph/worker_skg/certificate_forge_worker_001/transactions.jsonl

# Copy vault to host
docker cp truemark-forge:/app/vault_system ./forge_v2.0/vault_system
```

---

## 🛠️ Common Operations

### Container Management

```powershell
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart specific service
docker-compose restart forge

# View logs
docker-compose logs -f backend

# Execute commands in container
docker-compose exec forge bash
docker-compose exec backend python -c "import flask; print(flask.__version__)"

# Remove all containers and volumes
docker-compose down -v
```

### Certificate Generation

```powershell
# Generate test certificate
docker-compose exec forge python certificate_forge.py test

# Generate batch of 10 certificates
docker-compose exec forge python -c "
from certificate_forge import CertificateForge
forge = CertificateForge()
for i in range(10):
    forge.mint_official_certificate(
        owner_name=f'Test Owner {i}',
        owner_wallet=f'0x{i:040x}',
        asset_name=f'Asset #{i:03d}',
        ipfs_hash=f'QmTest{i}',
        chain_type='ethereum'
    )
"
```

### SKG Queries

```powershell
# Query SKG health
docker-compose exec forge python -c "
from vault_system.skg_core.skg_integration import SKGBridge
bridge = SKGBridge('certificate_forge_worker_001')
print(bridge.get_skg_health_metrics())
"

# Query wallet portfolio
docker-compose exec forge python -c "
from vault_system.skg_core.skg_integration import SKGBridge
bridge = SKGBridge('certificate_forge_worker_001')
certs = bridge.get_owner_portfolio('0xYourWalletAddress')
print(f'Found {len(certs)} certificates')
for cert in certs:
    print(f'  - {cert}')
"
```

---

## 🔍 Monitoring & Debugging

### Container Health

```powershell
# Check container status
docker-compose ps

# View resource usage
docker stats

# Inspect specific container
docker inspect truemark-forge

# View container logs with timestamps
docker-compose logs -f --timestamps forge
```

### Performance Metrics

```powershell
# Backend API health
curl http://localhost:5000/health

# Frontend availability
curl http://localhost:8081

# Check container resource limits
docker-compose config
```

### Troubleshooting

**Issue: Container won't start**
```powershell
# Check logs for errors
docker-compose logs forge

# Rebuild container
docker-compose build --no-cache forge
docker-compose up -d forge
```

**Issue: Port already in use**
```powershell
# Find process using port
netstat -ano | findstr :5000

# Kill process or change port in docker-compose.yml
# Change: "5000:5000" to "5001:5000"
```

**Issue: Volume permissions (Linux)**
```bash
# Fix permissions
sudo chown -R $USER:$USER ./forge_v2.0/vault_system
```

**Issue: Out of disk space**
```powershell
# Clean up Docker
docker system prune -a --volumes

# Remove unused images
docker image prune -a
```

---

## 📦 Production Deployment

### Environment Variables

Create `.env` file:

```env
# Backend
SECRET_KEY=generate-strong-random-key-here
JWT_SECRET=another-strong-key-here
IPFS_NODE_URL=https://ipfs.infura.io:5001
WEB3_PROVIDER_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID

# Database
DATABASE_URL=postgresql://user:pass@db:5432/truemark

# Redis
REDIS_URL=redis://redis:6379/0

# Forge
FORGE_WORKER_ID=certificate_forge_worker_prod_001
FORGE_ENV=production
```

### SSL Certificates

```powershell
# Generate self-signed cert (development)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/truemark.key \
  -out ssl/truemark.crt

# For production, use Let's Encrypt with certbot
```

### Docker Compose Production

```powershell
# Use production config
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Set replica count
docker-compose up -d --scale forge=3
```

### Health Checks

Add to `docker-compose.yml`:

```yaml
services:
  forge:
    healthcheck:
      test: ["CMD", "python", "-c", "import sys; sys.exit(0)"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 5s
```

---

## 🔐 Security Best Practices

### 1. Secrets Management

```powershell
# Use Docker secrets (Swarm mode)
echo "your-secret-key" | docker secret create jwt_secret -

# Or use external secrets manager
# - AWS Secrets Manager
# - Azure Key Vault
# - HashiCorp Vault
```

### 2. Network Isolation

```yaml
networks:
  truemark-network:
    driver: bridge
    internal: true  # No external access
```

### 3. Read-Only Containers

```yaml
services:
  forge:
    read_only: true
    tmpfs:
      - /tmp
```

### 4. User Privileges

```yaml
services:
  forge:
    user: "1000:1000"  # Non-root user
```

---

## 📈 Performance Optimization

### Multi-Stage Builds

```dockerfile
# Optimize Dockerfile.forge
FROM python:3.9-slim AS builder
WORKDIR /build
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

FROM python:3.9-slim
COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH
```

### Layer Caching

```powershell
# Order Dockerfile instructions by change frequency
# 1. System dependencies (rarely change)
# 2. Python requirements (occasionally change)
# 3. Application code (frequently changes)
```

### Resource Limits

```yaml
services:
  forge:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 4G
        reservations:
          cpus: '1.0'
          memory: 2G
```

---

## 🧪 Testing

### Integration Tests

```powershell
# Run forge tests in container
docker-compose exec forge pytest tests/

# Run backend tests
docker-compose exec backend python -m pytest

# Load testing
docker-compose exec backend python -m locust -f tests/load_test.py
```

### Certificate Generation Test

```powershell
# Generate 100 test certificates
docker-compose exec forge python -c "
from certificate_forge import CertificateForge
import time

forge = CertificateForge()
start = time.time()

for i in range(100):
    forge.mint_official_certificate(
        owner_name=f'Test Owner {i}',
        owner_wallet=f'0x{i:040x}',
        asset_name=f'Asset #{i:03d}',
        ipfs_hash=f'QmTest{i}',
        chain_type='ethereum'
    )
    if (i + 1) % 10 == 0:
        print(f'Generated {i + 1}/100 certificates')

elapsed = time.time() - start
print(f'Total time: {elapsed:.2f}s')
print(f'Avg per cert: {elapsed/100:.2f}s')
"
```

---

## 📚 Additional Resources

- **Docker Documentation:** https://docs.docker.com
- **Docker Compose Reference:** https://docs.docker.com/compose/compose-file/
- **TrueMark Forge v2.0:** See `forge_v2.0/README.md`
- **SKG v1.0 Integration:** See `forge_v2.0/SKG_DEPLOYMENT_SUCCESS.md`
- **Migration Guide:** See `MIGRATION_GUIDE.md`

---

## 🆘 Support

### Container Logs

```powershell
# All services
docker-compose logs -f

# Specific service with tail
docker-compose logs -f --tail=100 forge

# Save logs to file
docker-compose logs > logs/docker-deployment.log
```

### Container Shell Access

```powershell
# Bash shell
docker-compose exec forge bash

# Python REPL
docker-compose exec forge python

# Root access (debugging only)
docker-compose exec -u root forge bash
```

---

## ✅ Deployment Checklist

- [ ] Docker Desktop installed and running
- [ ] All services build successfully (`docker-compose build`)
- [ ] Environment variables configured (`.env` file)
- [ ] SSL certificates generated (`./ssl/`)
- [ ] All services start (`docker-compose up -d`)
- [ ] Health checks pass (all containers healthy)
- [ ] Backend API responding (`curl localhost:5000/health`)
- [ ] Frontend accessible (`http://localhost:8081`)
- [ ] Forge generates certificates (`docker-compose exec forge python certificate_forge.py test`)
- [ ] SKG vault structure created (`docker-compose exec forge ls /app/vault_system/skg_graph/`)
- [ ] Logs accessible (`docker-compose logs`)

---

## 🎯 Next Steps

1. **Start Docker Desktop** on your machine
2. **Run build**: `docker-compose build`
3. **Start services**: `docker-compose up -d`
4. **Test forge**: `docker-compose exec forge python certificate_forge.py test`
5. **Access frontend**: `http://localhost:8081`
6. **Monitor logs**: `docker-compose logs -f`

---

**Status:** ✅ All Docker files ready for deployment  
**Version:** TrueMark Mint v2.0 with Certificate Forge v2.0 + SKG v1.0  
**Last Updated:** December 10, 2025
