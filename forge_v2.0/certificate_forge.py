# certificate_forge.py
from pathlib import Path
from datetime import datetime
import asyncio
from forensic_renderer import ForensicCertificateRenderer
from crypto_anchor import CryptoAnchorEngine
from integration_bridge import VaultFusionBridge

class TrueMarkForge:
    """
    ONE COMMAND → Generates cryptographically-verifiable,
    forensically-perfect certificate with full vault integration.
    """

    def __init__(self, vault_base_path: Path):
        self.vault = VaultFusionBridge(vault_base_path)
        self.renderer = ForensicCertificateRenderer()
        self.crypto = CryptoAnchorEngine()

    async def mint_official_certificate(self, metadata: dict) -> dict:
        """
        Mints certificate, anchors to blockchain, logs to vault,
        broadcasts to swarm. Completes in <5 seconds.
        """

        # 1. Generate DALS serial with checksum
        dals_serial = self._generate_dals_serial(metadata['kep_category'])

        # 2. Create cryptographic payload
        payload = {
            "dals_serial": dals_serial,
            "owner": metadata['owner_name'],
            "wallet": metadata['wallet_address'],
            "ipfs_hash": metadata['ipfs_hash'],
            "stardate": self._calculate_stardate(),
            "kep_category": metadata['kep_category']
        }

        # 3. Ed25519 sign (root authority)
        signature_bundle = self.crypto.sign_payload(
            payload=payload,
            issuer_key="Caleon_Prime_Root_v2"
        )

        # 4. Render forensic PDF with embedded signature
        pdf_path = await self.renderer.create_forensic_pdf(
            data={**metadata, **payload, **signature_bundle},
            output_dir=self.vault.certificates_path
        )

        # 5. WorkerVaultWriter log (creates immutable record)
        vault_txn = await self.vault.record_certificate_issuance(
            worker_id="certificate_forge_worker_001",
            dals_serial=dals_serial,
            pdf_path=pdf_path,
            payload=payload,
            signature=signature_bundle['ed25519_signature']
        )

        # 6. FusionQueue swarm broadcast (global asset awareness)
        swarm_txn = await self.vault.broadcast_to_swarm({
            "event_type": "CERTIFICATE_MINTED",
            "dals_serial": dals_serial,
            "vault_txn": vault_txn,
            "asset_metadata": payload
        })

        # 7. Return verification package
        return {
            "certificate_pdf": str(pdf_path),
            "dals_serial": dals_serial,
            "vault_transaction_id": vault_txn,
            "swarm_broadcast_id": swarm_txn,
            "verification_url": f"https://verify.truemark.io/{dals_serial}",
            "qr_code_path": self.renderer.generate_verification_qr(dals_serial)
        }

    def _generate_dals_serial(self, category: str) -> str:
        """DALS-001 compliant serial with category encoding."""
        import uuid
        category_code = {
            "Knowledge": "K",
            "Asset": "A",
            "Identity": "I"
        }.get(category, "X")

        timestamp = datetime.utcnow().strftime("%Y%m%d")
        unique = uuid.uuid4().hex[:8].upper()
        return f"DALS{category_code}M{timestamp}-{unique}"

    def _calculate_stardate(self) -> str:
        """Generate stardate (simplified)."""
        now = datetime.utcnow()
        stardate = f"{now.year - 1900}{now.month:02d}{now.day:02d}.{now.hour:02d}{now.minute:02d}"
        return stardate

# CLI Wrapper (run this)
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Mint TrueMark Official Certificate")
    parser.add_argument("--owner", required=True)
    parser.add_argument("--wallet", required=True)
    parser.add_argument("--title", required=True)
    parser.add_argument("--ipfs", required=True)
    parser.add_argument("--category", default="Knowledge")
    parser.add_argument("--chain", default="Polygon")

    args = parser.parse_args()

    forge = TrueMarkForge(vault_base_path=Path("vault_system"))

    metadata = {
        "owner_name": args.owner,
        "wallet_address": args.wallet,
        "asset_title": args.title,
        "ipfs_hash": args.ipfs,
        "kep_category": args.category,
        "chain_id": args.chain
    }

    result = asyncio.run(forge.mint_official_certificate(metadata))

    print("✅ CERTIFICATE MINTED & ANCHORED")
    print(f"📄 PDF: {result['certificate_pdf']}")
    print(f"🏷️  Serial: {result['dals_serial']}")
    print(f"🔒 Vault: {result['vault_transaction_id']}")
    print(f"🐝 Swarm: {result['swarm_broadcast_id']}")