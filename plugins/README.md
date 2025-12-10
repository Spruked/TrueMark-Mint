# TrueMark Mint Caleon Bubble Host Plugins

This directory contains bubble host assistant plugins for integrating TrueMark Mint with the Caleon ecosystem.

## Overview

The TrueMark Mint system integrates with Caleon services through specialized bubble host plugins that provide seamless communication and functionality between the minting platform and the Caleon infrastructure.

## Plugin Files

### caleon-worker-plugin.json
- **Target**: Caleon Worker Service
- **Purpose**: Handles minting operations, certificate verification, and blockchain integration
- **Capabilities**:
  - NFT minting assistance
  - Certificate verification
  - Blockchain transaction processing
  - Payment integration

### caleon-ucm-plugin.json
- **Target**: Caleon UCM (User Certificate Management) Service
- **Purpose**: Manages user authentication, data validation, and compliance checking
- **Capabilities**:
  - User authentication
  - Certificate management
  - Data validation
  - Compliance verification

### bubble-host-system-config.json
- **Purpose**: System-wide configuration for bubble host integration
- **Contains**: Service endpoints, plugin mappings, and system settings

## Deployment

### Using PowerShell (Windows)
```powershell
.\scripts\deploy-caleon-plugins.ps1
```

### Manual Deployment
1. Copy plugin files to your Caleon system's plugin directory
2. Register plugins with the bubble host system:
   ```bash
   curl -X POST http://bubble-host:8080/api/plugins/register \
        -H "Content-Type: application/json" \
        -d @caleon-worker-plugin.json

   curl -X POST http://bubble-host:8080/api/plugins/register \
        -H "Content-Type: application/json" \
        -d @caleon-ucm-plugin.json
   ```
3. Restart Caleon services to load plugins

## Configuration

### Environment Variables
- `JWT_SECRET`: Secret key for JWT token signing
- `ENCRYPTION_KEY`: Key for data encryption
- `DATABASE_URL`: PostgreSQL connection string

### Plugin Settings
- **Backend URL**: `http://truemark-backend:5000`
- **Blockchain Network**: Polygon (configurable)
- **Gas Limit**: 300,000 (configurable)
- **Timeout**: 30 seconds (configurable)

## API Endpoints

### Caleon Worker Plugin
- `POST /api/mint` - Mint NFT certificate
- `GET /api/verify` - Verify certificate authenticity
- `GET /api/status` - Check minting status
- `GET /api/health` - Health check

### Caleon UCM Plugin
- `POST /api/auth` - User authentication
- `POST /api/validate` - Data validation
- `GET /api/compliance` - Compliance status
- `GET /health` - Health check

## Monitoring

Monitor plugin performance through:
- Bubble host dashboard
- Docker container logs
- System health endpoints
- Plugin-specific metrics

## Troubleshooting

### Common Issues
1. **Plugin not loading**: Check JSON syntax and file permissions
2. **Connection failed**: Verify service endpoints in configuration
3. **Authentication errors**: Check JWT secrets and encryption keys

### Logs
```bash
# View Caleon Worker logs
docker logs caleon-worker

# View Caleon UCM logs
docker logs caleon-ucm

# View bubble host logs
docker logs host-bubble-worker
```

## Security

- Plugins use JWT for authentication
- Data encryption with AES-256
- Automatic certificate renewal
- Compliance checking enabled

## Support

For support and questions:
- Check the main TrueMark Mint documentation
- Review Caleon system logs
- Contact the development team