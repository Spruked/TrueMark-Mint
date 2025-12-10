# integration_bridge.py
from pathlib import Path
import json
from datetime import datetime
# from worker_vault_writer import WorkerVaultWriter  # Import when available
# from fusion_queue_engine import FusionQueueEngine  # Import when available

class VaultFusionBridge:
    """
    Handles vault logging and swarm broadcast for certificates.
    """

    def __init__(self, vault_base_path: Path):
        # self.vault_writer = WorkerVaultWriter(vault_base_path)  # Uncomment when available
        # self.fusion_queue = FusionQueueEngine()  # Uncomment when available
        self.vault_base_path = vault_base_path
        self.certificates_path = vault_base_path / "certificates" / "issued"
        self.certificates_path.mkdir(parents=True, exist_ok=True)

    async def record_certificate_issuance(self, worker_id: str, dals_serial: str,
                                         pdf_path: Path, payload: dict, signature: str):
        """
        Logs certificate genesis to worker vault and creates audit trail.
        """

        # Write event to worker events.jsonl (simplified)
        event_record = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "event_type": "CERTIFICATE_MINTED",
            "dals_serial": dals_serial,
            "worker_id": worker_id,
            "payload_hash": payload.get('payload_hash', ''),
            "signature": signature[:32] + "...",  # Truncate for display
            "pdf_size_bytes": pdf_path.stat().st_size if pdf_path.exists() else 0
        }

        # Save to events file
        events_file = self.vault_base_path / "workers" / f"{worker_id}_events.jsonl"
        events_file.parent.mkdir(parents=True, exist_ok=True)
        with open(events_file, "a") as f:
            json.dump(event_record, f)
            f.write("\n")

        # Write summary to summary.json
        summary = {
            "dals_serial": dals_serial,
            "minted_at": datetime.utcnow().isoformat() + "Z",
            "pdf_path": str(pdf_path),
            "payload": payload,
            "verification_url": f"https://verify.truemark.io/{dals_serial}",
            "vault_integrity_hash": self._calculate_vault_hash()
        }

        summary_path = self.certificates_path / f"{dals_serial}_summary.json"
        with open(summary_path, "w") as f:
            json.dump(summary, f, indent=2)

        return f"VAULT_TXN_{dals_serial}_{datetime.utcnow().timestamp()}"

    async def broadcast_to_swarm(self, certificate_data: dict):
        """
        Broadcasts certificate metadata to swarm via FusionQueue.
        """

        # Create Fusion payload (simplified - save to file)
        fusion_payload = {
            "certificate_event": certificate_data,
            "ingest_to_caleon": True,
            "update_worker_skgs": True,
            "priority": "high"
        }

        # Save to fusion queue file
        queue_file = self.vault_base_path / "fusion_queue" / "certificate_broadcasts.jsonl"
        queue_file.parent.mkdir(parents=True, exist_ok=True)
        with open(queue_file, "a") as f:
            json.dump({
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "payload": fusion_payload
            }, f)
            f.write("\n")

        return f"SWARM_TXN_{certificate_data['dals_serial']}"

    def _calculate_vault_hash(self) -> str:
        """Calculate integrity hash of vault system."""
        import hashlib

        vault_state = json.dumps({
            "vault_version": "1.0",
            "last_repair": datetime.utcnow().isoformat(),
            "worker_count": 1  # Simplified
        }, sort_keys=True)

        return hashlib.sha256(vault_state.encode()).hexdigest()[:16]