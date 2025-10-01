# 🚀 TrueMark Mint - Deployment Guide

Complete deployment instructions for the **Alpha CertSig NFT Taxonomy Platform** with 7 specialized certificate types, pricing tiers, and royalty management.

## 📋 **Prerequisites**

- Docker & Docker Compose
- Git with submodule support
- Modern web browser
- GitHub account (for repository access)

---

## 🔧 **Initial Setup**

### **1. Clone Repository with Submodules**
```bash
git clone --recursive https://github.com/yourusername/truemark-mint.git
cd truemark-mint

# If already cloned without --recursive:
git submodule update --init --recursive
```

### **2. Configure Git Line Endings (Windows)**
```bash
git config core.autocrlf true
```

### **3. Environment Configuration**
```bash
# Copy environment template
cp .env.example .env

# Edit configuration for your deployment
nano .env
```

**Required Environment Variables:**
```env
SECRET_KEY=your-secure-secret-key-here
JWT_SECRET=your-jwt-secret-key-here
IPFS_NODE_URL=https://ipfs.infura.io:5001
WEB3_PROVIDER_URL=https://mainnet.infura.io/v3/your-project-id
POLYGON_RPC_URL=https://polygon-rpc.com
```

---

## 🏠 **Local Development**

### **Option A: Docker Compose (Recommended)**
```bash
# Build and start all services
docker-compose up --build -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

**Services Available:**
- **Frontend**: http://localhost:8081 (Alpha CertSig Interface)
- **Backend**: http://localhost:5000 (Alpha Mint Engine API)
- **Nginx**: http://localhost:8082 (Production Proxy)
- **Redis**: localhost:6379 (Session Management)

### **Option B: Direct Development**
```bash
# Frontend (TrueMark Website)
cd truemark-website
python -m http.server 8080

# Backend (Alpha Mint Engine)
cd Alpha-mint-engine
pip install -r requirements.txt
python app.py
```

---

## ☁️ **Production Deployment**

### **Option 1: Railway (Recommended for Startups)**
1. Connect your GitHub repository to Railway
2. Railway will auto-detect Docker Compose
3. Set environment variables in Railway dashboard
4. Deploy with automatic SSL/domain

### **Option 2: Render**
1. Create new Web Service on Render
2. Connect GitHub repository
3. Use Docker deployment
4. Configure environment variables
5. Enable custom domain

### **Option 3: AWS ECS/Lightsail**
```bash
# Build and push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin your-account.dkr.ecr.us-east-1.amazonaws.com

docker build -t truemark-mint .
docker tag truemark-mint:latest your-account.dkr.ecr.us-east-1.amazonaws.com/truemark-mint:latest
docker push your-account.dkr.ecr.us-east-1.amazonaws.com/truemark-mint:latest
```

### **Option 4: Cloudflare Tunnel (Testing)**
```bash
# Install cloudflared
# Configure tunnel to localhost:8081
cloudflared tunnel --url http://localhost:8081
```

---

## 🎖️ **Alpha CertSig Features Verification**

### **Test All 7 NFT Types:**
1. **Knowledge NFT (K)** - Educational credentials
2. **Liability NFT (L)** - Legal compliance certificates
3. **Health NFT (H)** - Medical records
4. **Experience NFT (E)** - Professional verification
5. **Asset NFT (A)** - Asset authentication
6. **Compliance NFT (C)** - Regulatory compliance
7. **License NFT (Lic-NFT)** - Professional licenses

### **Verify Pricing System:**
- Entry Phase: 0.01 ETH / 15 MATIC
- Premium Phase: 0.05 ETH / 75 MATIC

### **Test Royalty Management:**
- 1.5% resale royalty
- 3% licensing royalty
- EIP-2981 compliance

---

## 🔧 **Troubleshooting**

### **Docker Issues**
```bash
# Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Check logs
docker-compose logs backend
docker-compose logs frontend
```

### **Port Conflicts**
Update `docker-compose.yml` ports if needed:
```yaml
ports:
  - "8081:8080"  # Frontend
  - "5001:5000"  # Backend
  - "8082:80"    # Nginx
```

### **Submodule Issues**
```bash
# Reset submodules
git submodule deinit --all
git submodule update --init --recursive
```

---

## 📊 **Monitoring & Maintenance**

### **Health Checks**
- Frontend: `http://localhost:8081/health`
- Backend: `http://localhost:5000/health`
- Redis: `redis-cli ping`

### **Backup Strategy**
- Database: Regular SQLite backups
- IPFS: Pin important content
- Configuration: Version control all configs

### **Security Updates**
- Regular dependency updates
- SSL certificate renewal
- Security headers configuration

---

## 🎯 **Production Checklist**

- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Domain configured
- [ ] Database backups enabled
- [ ] Monitoring setup
- [ ] Error logging configured
- [ ] Rate limiting tested
- [ ] Security headers enabled
- [ ] NFT taxonomy system tested
- [ ] Royalty calculations verified

---

## 📞 **Support**

For deployment issues or Alpha CertSig feature questions:
- Check GitHub Issues
- Review Docker logs
- Test individual NFT types
- Verify blockchain connectivity

**Certified by Alpha CertSig Mint © 2025 TrueMark LLC**