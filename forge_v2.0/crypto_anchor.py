# crypto_anchor.py
import ed25519
import hashlib
import json
from datetime import datetime

class CryptoAnchorEngine:
    """
    Signs certificates with root authority and creates blockchain-ready payload.
    """

    def __init__(self, root_key_path: str = "keys/caleon_root.key"):
        # Load Caleon Prime root signing key (KEEP THIS OFFLINE)
        try:
            with open(root_key_path, "rb") as f:
                self.signing_key = ed25519.SigningKey(f.read())
        except:
            # Fallback: generate a temporary key for demo (NEVER USE IN PRODUCTION)
            import os
            if not os.path.exists(root_key_path):
                sk, vk = ed25519.create_keypair()
                os.makedirs(os.path.dirname(root_key_path), exist_ok=True)
                with open(root_key_path, "wb") as f:
                    f.write(sk.to_bytes())
                self.signing_key = sk
            else:
                with open(root_key_path, "rb") as f:
                    self.signing_key = ed25519.SigningKey(f.read())

    def sign_payload(self, payload: dict, issuer_key: str) -> dict:
        """
        Creates Ed25519 signature and SKG update bundle.
        """
        # Canonical JSON serialization (deterministic)
        payload_json = json.dumps(payload, sort_keys=True, separators=(',', ':'))

        # SHA-256 hash of payload
        payload_hash = hashlib.sha256(payload_json.encode()).hexdigest()

        # Ed25519 signature
        signature = self.signing_key.sign(payload_hash.encode()).hex()

        # Public key for verification
        verifying_key = self.signing_key.get_verifying_key().to_ascii(encoding="hex").decode()

        return {
            "payload_hash": payload_hash,
            "ed25519_signature": signature,
            "verifying_key": verifying_key,
            "issuer": issuer_key,
            "signature_algorithm": "Ed25519",
            "signed_at": datetime.utcnow().isoformat() + "Z"
        }