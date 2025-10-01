# 🏛️ TrueMark Mint - Premium Digital Certificate Platform

> **Heirloom-Grade Digital Certificates with Blockchain Authentication**

![TrueMark Mint Logo](truemark-website/assets/img/truemarklogo.png)

[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://docker.com)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Blockchain](https://img.shields.io/badge/Blockchain-Ethereum-purple.svg)](https://ethereum.org)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen.svg)](#)

## ✨ **Overview**

TrueMark Mint is a sophisticated digital certificate platform that combines premium heritage branding with cutting-edge blockchain technology. Built for organizations requiring authenticated, verifiable digital assets with institutional-grade security.

**Certified by Alpha CertSig Mint © 2025 TrueMark LLC, an affiliate of Pro Prime Holdings.**

---

## 🎯 **Key Features**

### 🏛️ **Premium Heritage Design**
- **Sophisticated Branding**: Gold, Navy, and Pearl color palette
- **Typography**: Merriweather serif headings with Open Sans body text
- **Responsive Layout**: Seamless experience across all devices
- **Professional Polish**: Corporate-grade visual presentation

### 🔐 **Enterprise Security**
- **Multi-Factor Authentication**: Secure login with 2FA support
- **Session Management**: JWT tokens with configurable expiration
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Comprehensive security checks

### ⚡ **Blockchain Integration**
- **Ethereum NFT Minting**: ERC-721 standard compliance
- **IPFS Storage**: Decentralized file storage
- **Transaction Verification**: Immutable blockchain records
- **Smart Contract Integration**: Automated certificate generation

### 📋 **Document Management**
- **Multi-Format Support**: Images, documents, videos, audio, code, archives
- **Drag & Drop Upload**: Intuitive file selection interface
- **Certificate Generation**: Branded PDF certificates with QR codes
- **Invoice System**: Professional billing documentation

---

## 🚀 **Quick Start**

### **Prerequisites**
- Docker & Docker Compose
- Git
- Modern web browser

### **1. Clone Repository**
```bash
git clone https://github.com/yourusername/truemark-mint.git
cd truemark-mint
```

### **2. Environment Setup**
```bash
# Copy environment template
cp .env.example .env

# Edit configuration (required for production)
nano .env
```

### **3. Launch Application**
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### **4. Access Application**
- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:5000
- **Admin Panel**: http://localhost:8080/login

---

## 🏗️ **Architecture**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │     Backend      │    │   Blockchain    │
│   (Website)     │◄──►│  (Alpha Engine)  │◄──►│   (Ethereum)    │
│                 │    │                  │    │                 │
│ • Authentication│    │ • NFT Minting    │    │ • Smart Contract│
│ • File Upload   │    │ • IPFS Storage   │    │ • Token Registry│
│ • Certificate   │    │ • Security       │    │ • Verification  │
│   Preview       │    │ • API Endpoints  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### **Technology Stack**

#### **Frontend**
- **HTML5/CSS3/JavaScript**: Modern web standards
- **Responsive Design**: Mobile-first approach
- **Progressive Enhancement**: Works without JavaScript
- **Security**: XSS protection, CSRF tokens

#### **Backend (Alpha CertSig Mint Engine)**
- **Flask**: Python web framework
- **Web3.py**: Ethereum blockchain interaction
- **IPFS**: Decentralized file storage
- **SQLite/PostgreSQL**: Database options
- **JWT**: Secure authentication

#### **Infrastructure**
- **Docker**: Containerized deployment
- **NGINX**: Reverse proxy and load balancing
- **Redis**: Session storage (optional)
- **Cloudflare**: CDN and DDoS protection

---

## 🔧 **Configuration**

### **Environment Variables**

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `SECRET_KEY` | Flask application secret | ✅ | - |
| `JWT_SECRET` | JWT token signing key | ✅ | - |
| `WEB3_PROVIDER_URL` | Ethereum node URL | ✅ | - |
| `IPFS_NODE_URL` | IPFS node endpoint | ✅ | - |
| `DATABASE_URL` | Database connection | ✅ | `sqlite:///data/truemark.db` |
| `MAX_FILE_SIZE` | Upload size limit | ❌ | `104857600` (100MB) |
| `CORS_ORIGINS` | Allowed origins | ❌ | `*` |

### **Blockchain Configuration**

```bash
# Ethereum Mainnet (Production)
WEB3_PROVIDER_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
WEB3_NETWORK=mainnet

# Ethereum Testnet (Development)
WEB3_PROVIDER_URL=https://goerli.infura.io/v3/YOUR_PROJECT_ID
WEB3_NETWORK=goerli
```

---

## 🧪 **Testing**

### **Demo Credentials**
```
Admin Access:    admin / truemark2025
Minter (2FA):    minter / mint123 (2FA Code: 123456)
Demo User:       demo / demo123
```

### **Test Scenarios**

1. **Authentication Flow**
   ```bash
   # Test login with different user roles
   curl -X POST http://localhost:5000/api/auth/login \
        -H "Content-Type: application/json" \
        -d '{"username":"demo","password":"demo123"}'
   ```

2. **File Upload & Minting**
   - Upload test files (PNG, PDF, etc.)
   - Complete asset metadata form
   - Review and submit mint request
   - Verify certificate generation

3. **Security Testing**
   - Rate limiting validation
   - Invalid token handling
   - File type restrictions
   - XSS/CSRF protection

---

## 📦 **Deployment**

### **Development**
```bash
# Local development server
cd truemark-website
python -m http.server 8080
```

### **Production with Docker**
```bash
# Production deployment
docker-compose -f docker-compose.prod.yml up -d

# SSL setup (Let's Encrypt)
docker-compose exec nginx certbot --nginx -d truemarkmint.com
```

### **Cloudflare Tunnel**
```bash
# Install cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Create tunnel
cloudflared tunnel create truemark-mint
cloudflared tunnel route dns truemark-mint truemarkmint.com

# Run tunnel
cloudflared tunnel run truemark-mint
```

---

## 🔒 **Security**

### **Best Practices Implemented**

- ✅ **HTTPS Enforcement**: All traffic encrypted
- ✅ **Rate Limiting**: API endpoint protection
- ✅ **Input Validation**: Comprehensive sanitization
- ✅ **JWT Security**: Secure token management
- ✅ **File Upload Safety**: Type and size restrictions
- ✅ **CORS Policy**: Controlled cross-origin access
- ✅ **Security Headers**: XSS, CSRF, clickjacking protection

### **Security Audit Checklist**

- [ ] Update all default passwords
- [ ] Configure strong JWT secrets
- [ ] Enable HTTPS with valid certificates
- [ ] Set up Web Application Firewall (WAF)
- [ ] Configure backup strategies
- [ ] Monitor application logs
- [ ] Regular dependency updates

---

## 📋 **API Documentation**

### **Authentication Endpoints**

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}
```

### **Minting Endpoints**

```http
POST /api/mint/create
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <binary>
metadata: <json>
```

### **Certificate Endpoints**

```http
GET /api/certificate/{certificate_id}
Authorization: Bearer <token>
```

---

## 🛠️ **Development**

### **Local Development Setup**

```bash
# Clone repository
git clone https://github.com/yourusername/truemark-mint.git
cd truemark-mint

# Frontend development
cd truemark-website
python -m http.server 8080

# Backend development
cd Alpha-mint-engine
pip install -r requirements.txt
python app.py
```

### **Contributing**

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 **Acknowledgments**

- **Alpha CertSig Mint**: Blockchain certification technology
- **Pro Prime Holdings**: Strategic partnership and support
- **Ethereum Foundation**: Blockchain infrastructure
- **IPFS**: Decentralized storage network

---

## 📞 **Support**

- **Email**: support@truemarkmint.com
- **Documentation**: [docs.truemarkmint.com](https://docs.truemarkmint.com)
- **Issues**: [GitHub Issues](https://github.com/yourusername/truemark-mint/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/truemark-mint/discussions)

---

## 🌟 **Star History**

[![Star History Chart](https://api.star-history.com/svg?repos=yourusername/truemark-mint&type=Timeline)](https://star-history.com/#yourusername/truemark-mint&Timeline)

---

**Certified by Alpha CertSig Mint © 2025 TrueMark LLC, an affiliate of Pro Prime Holdings.**

*Where heritage meets modern proof.*