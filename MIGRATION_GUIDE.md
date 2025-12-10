# 🔄 Migration Guide: Upgrading to Certificate Forge v2.0

## Overview

This guide shows how to integrate the new Certificate Forge v2.0 into your existing TrueMark Mint system, replacing the basic certificate generator with the forensic-grade, cryptographically-secured forge.

---

## Current vs. Forge v2.0 Comparison

### Current System (`truemark_certificate_generator/`)
- ✅ Basic PDF generation with ReportLab
- ✅ QR codes and simple layouts
- ❌ No cryptographic signing
- ❌ No vault integration
- ❌ No forensic security features
- ❌ No swarm broadcasting
- ❌ Simple fallback fonts only

### Forge v2.0 (`forge_v2.0/`)
- ✅ Professional PDF generation with 10 security layers
- ✅ QR codes with verification URLs
- ✅ Ed25519 digital signatures
- ✅ Vault system integration
- ✅ Anti-AI forensic markers
- ✅ Swarm consensus broadcasting
- ✅ Dynamic font system with graceful fallbacks

---

## Migration Steps

### Step 1: Update Backend API

**File:** `Alpha-mint-engine/app.py`

Add the forge import at the top:

```python
import sys
from pathlib import Path

# Add forge to Python path
sys.path.append(str(Path(__file__).parent.parent / "forge_v2.0"))
from certificate_forge import TrueMarkForge
```

Create new endpoint for official certificates:

```python
@app.route('/api/mint/official', methods=['POST'])
@limiter.limit("5 per minute")
def mint_official_certificate():
    """
    Mint official certificate using Forge v2.0
    """
    try:
        data = request.json
        
        # Validate required fields
        required = ['owner_name', 'wallet_address', 'asset_title', 'ipfs_hash']
        if not all(field in data for field in required):
            return jsonify({"error": "Missing required fields"}), 400
        
        # Initialize forge
        forge = TrueMarkForge(vault_base_path=Path("forge_v2.0/vault_system"))
        
        # Prepare metadata
        metadata = {
            "owner_name": data['owner_name'],
            "wallet_address": data['wallet_address'],
            "asset_title": data['asset_title'],
            "ipfs_hash": data['ipfs_hash'],
            "kep_category": data.get('kep_category', 'Knowledge'),
            "chain_id": data.get('chain_id', 'Polygon')
        }
        
        # Generate certificate (async)
        import asyncio
        result = asyncio.run(forge.mint_official_certificate(metadata))
        
        # Return result
        return jsonify({
            "success": True,
            "certificate": {
                "serial": result['dals_serial'],
                "pdf_url": f"/certificates/{result['dals_serial']}_OFFICIAL.pdf",
                "verification_url": result['verification_url'],
                "vault_transaction": result['vault_transaction_id'],
                "swarm_broadcast": result['swarm_broadcast_id']
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Certificate minting error: {str(e)}")
        return jsonify({"error": str(e)}), 500
```

Add certificate download endpoint:

```python
@app.route('/certificates/<filename>')
def serve_certificate(filename):
    """
    Serve generated certificate PDFs
    """
    cert_dir = Path("forge_v2.0/vault_system/certificates/issued")
    return send_from_directory(cert_dir, filename, as_attachment=True)
```

---

### Step 2: Update Frontend UI

**File:** `truemark-website/mint.html`

Add new button for official certificates:

```html
<!-- Add after existing mint button -->
<button id="mintOfficialBtn" class="btn btn-primary btn-lg">
    🔥 Mint Official Certificate (Forge v2.0)
</button>
```

**File:** `truemark-website/assets/js/mint.js`

Add handler for official minting:

```javascript
document.getElementById('mintOfficialBtn').addEventListener('click', async () => {
    const data = {
        owner_name: document.getElementById('ownerName').value,
        wallet_address: document.getElementById('walletAddress').value,
        asset_title: document.getElementById('assetTitle').value,
        ipfs_hash: document.getElementById('ipfsHash').value,
        kep_category: document.getElementById('category').value
    };
    
    // Validate
    if (!data.owner_name || !data.wallet_address || !data.asset_title) {
        alert('Please fill all required fields');
        return;
    }
    
    try {
        // Show loading
        showLoading('Minting official certificate with Forge v2.0...');
        
        // Call API
        const response = await fetch('/api/mint/official', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Show success
            showSuccess(`
                ✅ Official Certificate Minted!
                
                Serial: ${result.certificate.serial}
                Verification: ${result.certificate.verification_url}
                Vault TX: ${result.certificate.vault_transaction}
                Swarm: ${result.certificate.swarm_broadcast}
            `);
            
            // Download PDF
            window.open(result.certificate.pdf_url, '_blank');
            
            // Redirect to verification
            setTimeout(() => {
                window.open(result.certificate.verification_url, '_blank');
            }, 2000);
        } else {
            throw new Error(result.error);
        }
        
    } catch (error) {
        showError(`Failed to mint certificate: ${error.message}`);
    } finally {
        hideLoading();
    }
});
```

---

### Step 3: Preserve Legacy Generator (Optional)

If you want to keep both systems running:

**Rename old generator:**
```bash
mv truemark_certificate_generator truemark_certificate_generator_legacy
```

**Update imports in backend:**
```python
# Legacy system (basic certificates)
from truemark_certificate_generator_legacy.generator import create_certificate as create_basic_certificate

# New system (official certificates)
from forge_v2.0.certificate_forge import TrueMarkForge

@app.route('/api/mint/basic', methods=['POST'])
def mint_basic_certificate():
    """Legacy endpoint for basic certificates"""
    # Use old generator
    pass

@app.route('/api/mint/official', methods=['POST'])
def mint_official_certificate():
    """New endpoint for official certificates"""
    # Use forge v2.0
    pass
```

---

### Step 4: Update Docker Configuration

**File:** `docker-compose.yml`

Ensure the forge service has access to backend volumes:

```yaml
backend:
  volumes:
    - ./Alpha-mint-engine:/app
    - ./forge_v2.0:/app/forge_v2.0  # Add forge access
    - ./data:/app/data
    - ./logs:/app/logs

forge:
  volumes:
    - ./forge_v2.0/vault_system:/app/vault_system
    - ./forge_v2.0/keys:/app/keys
    - ./forge_v2.0/templates:/app/templates
    - ./forge_v2.0/fonts:/app/fonts
    - ./Alpha-mint-engine:/app/backend  # Share with backend
```

---

### Step 5: Add Environment Configuration

**File:** `.env`

Add forge-specific settings:

```bash
# Certificate Forge v2.0 Settings
FORGE_VAULT_PATH=forge_v2.0/vault_system
FORGE_KEY_PATH=forge_v2.0/keys/caleon_root.key
FORGE_TEMPLATES_PATH=forge_v2.0/templates
FORGE_FONTS_PATH=forge_v2.0/fonts

# Verification Settings
VERIFICATION_BASE_URL=https://verify.truemark.io
VERIFICATION_API_KEY=your-api-key-here

# Blockchain Settings
POLYGON_RPC_URL=https://polygon-rpc.com
IPFS_GATEWAY=https://ipfs.io/ipfs/
```

---

## Testing the Migration

### Test 1: Generate Basic Certificate (Legacy)

```bash
cd truemark_certificate_generator_legacy
python mint_certificate.py \
  --serial DALSM0001 \
  --owner "Test User" \
  --title "Test Asset" \
  --wallet "0xTest" \
  --domain "test.truemark" \
  --category "Knowledge" \
  --ipfs "ipfs://test" \
  --output test_basic.pdf
```

### Test 2: Generate Official Certificate (Forge v2.0)

```bash
cd forge_v2.0
python certificate_forge.py \
  --owner "Test User" \
  --wallet "0xTest" \
  --title "Test Asset" \
  --ipfs "ipfs://test" \
  --category "Knowledge"
```

### Test 3: API Integration Test

```bash
curl -X POST http://localhost:5000/api/mint/official \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "owner_name": "API Test User",
    "wallet_address": "0xAPITest",
    "asset_title": "API Test Asset",
    "ipfs_hash": "ipfs://apitest",
    "kep_category": "Knowledge"
  }'
```

---

## Rollback Plan

If you need to revert to the old system:

1. **Remove forge endpoints:**
   ```python
   # Comment out forge imports and endpoints in app.py
   ```

2. **Restore old generator:**
   ```bash
   mv truemark_certificate_generator_legacy truemark_certificate_generator
   ```

3. **Update frontend:**
   ```javascript
   // Point mint button back to /api/mint/basic
   ```

4. **Restart services:**
   ```bash
   docker-compose restart backend frontend
   ```

---

## Performance Comparison

### Basic Generator
- Speed: ~2 seconds per certificate
- File size: ~3 KB
- Security: Basic PDF
- Features: QR code, simple layout

### Forge v2.0
- Speed: < 5 seconds per certificate
- File size: ~10-15 KB (with security layers)
- Security: Ed25519 + vault + swarm
- Features: 10 security layers, cryptographic signing, forensic markers

---

## Best Practices

1. **Use Forge v2.0 for:**
   - Official customer certificates
   - High-value assets
   - Legal documentation
   - Bank-grade certificates
   - Enterprise clients

2. **Use Basic Generator for:**
   - Development testing
   - Internal documentation
   - Quick prototypes
   - Demo purposes

3. **Security Considerations:**
   - Keep `keys/caleon_root.key` OFFLINE in production
   - Use environment variables for sensitive paths
   - Enable rate limiting on certificate endpoints
   - Log all certificate generation events

4. **Performance Optimization:**
   - Use async endpoints for forge v2.0
   - Cache QR code generation
   - Pre-load fonts and templates
   - Implement batch processing for multiple certificates

---

## Support

For issues or questions:
- **Forge Documentation:** `forge_v2.0/README.md`
- **Deployment Guide:** `forge_v2.0/DEPLOYMENT_SUCCESS.md`
- **GitHub Issues:** https://github.com/Spruked/truemark-mint/issues

---

**Migration Complete! Your system now has world-class certificate generation capabilities.**