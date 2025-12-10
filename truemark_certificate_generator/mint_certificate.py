#!/usr/bin/env python3
"""
TrueMark Certificate Generator CLI
Official bank-grade certificate generation system
"""

import argparse
import sys
from pathlib import Path
from datetime import datetime

# Add current directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from generator import create_certificate

def main():
    parser = argparse.ArgumentParser(description='Generate TrueMark Official Certificate')
    parser.add_argument('--serial', required=True, help='DALS Serial Number (e.g., DALSM0001)')
    parser.add_argument('--owner', required=True, help='Owner Name')
    parser.add_argument('--title', required=True, help='Asset Title')
    parser.add_argument('--wallet', required=True, help='Web3 Wallet Address')
    parser.add_argument('--domain', required=True, help='TrueMark Web3 Domain')
    parser.add_argument('--category', required=True, help='KEP Category')
    parser.add_argument('--ipfs', required=True, help='IPFS Hash')
    parser.add_argument('--chain-id', default='137', help='Chain ID (default: 137 for Polygon)')
    parser.add_argument('--stardate', help='Issue Stardate (auto-generated if not provided)')
    parser.add_argument('--sig-id', help='Signature Verification ID (auto-generated if not provided)')
    parser.add_argument('--output', required=True, help='Output PDF file path')

    args = parser.parse_args()

    # Generate missing fields
    if not args.stardate:
        # Generate stardate (simplified)
        now = datetime.utcnow()
        stardate = f"{now.year - 1900}{now.month:02d}{now.day:02d}.{now.hour:02d}{now.minute:02d}"
        args.stardate = stardate

    if not args.sig_id:
        # Generate signature ID (simplified hash)
        import hashlib
        sig_data = f"{args.serial}{args.owner}{args.wallet}"
        args.sig_id = hashlib.sha256(sig_data.encode()).hexdigest()[:16].upper()

    # Prepare certificate data
    cert_data = {
        "owner_name": args.owner,
        "asset_title": args.title,
        "wallet": args.wallet,
        "kep_category": args.category,
        "web3_domain": args.domain,
        "chain_id": args.chain_id,
        "ipfs_hash": args.ipfs,
        "stardate": args.stardate,
        "dals_serial": args.serial,
        "sig_id": args.sig_id,
        "verification_url": f"https://truemark.app/verify/{args.serial}"
    }

    # Generate certificate
    try:
        create_certificate(cert_data, args.output)
        print(f"✅ SUCCESS: TrueMark Certificate {args.serial} generated")
        print(f"📄 Output: {args.output}")
        print(f"🔗 Verification: {cert_data['verification_url']}")
    except Exception as e:
        print(f"❌ ERROR: Failed to generate certificate: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()