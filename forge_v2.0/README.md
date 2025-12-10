# TRUE MARK ENTERPRISE CERTIFICATE FORGE v2.0

**Unified System: Visual Authority + Cryptographic Immutability**

## Overview

This is the production-ready TrueMark Certificate Forge that generates cryptographically-verifiable, forensically-perfect certificates with full vault integration.

## Architecture

- `certificate_forge.py` - Main orchestrator (single command entry point)
- `forensic_renderer.py` - Visual engine with anti-AI micro-artifacts
- `crypto_anchor.py` - Ed25519 signing and blockchain binding
- `integration_bridge.py` - Vault logging and swarm broadcast

## Installation

```bash
pip install -r requirements.txt
```

## Required Assets

### Templates (place in `templates/` directory)
- `parchment_base_600dpi.jpg` - Real scanned security paper texture
- `border_guilloche_vector.svg` - Mathematical security border pattern
- `truemark_tree_watermark.svg` - Brand watermark with slight rotation variance
- `seal_gold_embossed_600dpi.png` - Gold foil seal with specular highlights

### Fonts (place in `fonts/` directory)
- `EBGaramond-Bold.ttf` - Official serif font for headers
- `CourierPrime.ttf` - Monospace font for data fields
- `TrueMarkOfficer.ttf` - Script font for officer signatures

## Usage

```bash
python certificate_forge.py \
  --owner "Enterprise Customer Alpha" \
  --wallet "0xCaleonPrimeVaultAddress" \
  --title "First Official Caleon Asset" \
  --ipfs "ipfs://CaleonGenesisBlock" \
  --category "Knowledge"
```

## Output

The forge generates:
- Forensic PDF certificate with 10 layers of security
- Vault transaction record
- Swarm broadcast confirmation
- Verification QR code
- Cryptographic signature bundle

## Security Features

- Ed25519 digital signatures
- Anti-AI forensic markers (micro-noise, kerning variance)
- Blockchain anchoring
- Vault immutability
- Swarm consensus validation

## Integration

Connects to:
- WorkerVaultWriter for audit logging
- FusionQueue for swarm broadcasts
- Caleon UCM for asset awareness
- Polygon blockchain for anchoring