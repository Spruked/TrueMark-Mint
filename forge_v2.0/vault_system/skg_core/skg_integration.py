# skg_integration.py
import sys
from pathlib import Path

# Add skg_core to path
sys.path.insert(0, str(Path(__file__).parent))

from skg_engine import SwarmKnowledgeGraphEngine

class CertificateSKGBridge:
    """
    Bridge between Certificate Forge and SKG.
    Automatically ingests certificates into swarm knowledge.
    """
    
    def __init__(self, vault_base_path: Path):
        self.skg = SwarmKnowledgeGraphEngine(
            vault_base_path=vault_base_path,
            worker_id="certificate_forge_worker_001"
        )
    
    async def on_certificate_minted(self, certificate_data: dict, vault_txn_id: str):
        """
        Hook called by certificate_forge.py after minting.
        """
        
        # Ingest into SKG
        skg_txn_id = self.skg.ingest_certificate(certificate_data, vault_txn_id)
        
        # Get drift score for monitoring
        drift_score = certificate_data.get('drift_score', 0.0)
        
        # Prepare FusionQueue payload for swarm broadcast
        fusion_payload = {
            "event_type": "SKG_CERTIFICATE_INGESTED",
            "skg_transaction_id": skg_txn_id,
            "vault_transaction_id": vault_txn_id,
            "dals_serial": certificate_data['dals_serial'],
            "drift_score": drift_score,
            "pattern_clusters": self.skg.pattern_learner.get_cluster_count(),
            "requires_swarm_sync": True
        }
        
        return fusion_payload
    
    def get_owner_portfolio(self, wallet_address: str) -> dict:
        """
        Query SKG for all certificates owned by a wallet.
        Useful for customer dashboard.
        """
        certificates = self.skg.query_by_wallet(wallet_address)
        
        return {
            "wallet_address": wallet_address,
            "certificate_count": len(certificates),
            "certificates": certificates,
            "drift_analysis": {
                "average_drift": sum(c['certificate'].get('drift_score', 0) for c in certificates) / len(certificates) if certificates else 0,
                "highest_drift_certificate": max(certificates, key=lambda c: c['certificate'].get('drift_score', 0)) if certificates else None
            }
        }
    
    def get_skg_health_metrics(self) -> dict:
        """
        Health metrics for Super Worker Guardian.
        """
        return self.skg.get_swarm_knowledge_summary()