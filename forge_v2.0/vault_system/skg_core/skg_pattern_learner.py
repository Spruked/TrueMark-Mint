# skg_pattern_learner.py
from collections import defaultdict
from typing import List, Dict, Set
from skg_node import SKGNode, SKGNodeType
import hashlib

class SKGPatternLearner:
    """
    Detects patterns in certificate data for deduplication and anomaly detection.
    Runs in FusionQueueEngine for swarm-wide pattern convergence.
    """
    
    def __init__(self):
        self.pattern_clusters: Dict[str, List[str]] = defaultdict(list)
        self.owner_fingerprint_cache: Dict[str, str] = {}
    
    def learn_from_certificate(self, cert_node: SKGNode, owner_node: SKGNode, chain_node: SKGNode):
        """
        Extract patterns and cluster similar certificates.
        """
        
        # Pattern 1: Wallet ownership frequency
        wallet_hash = self._hash_wallet_behavior(owner_node)
        self.pattern_clusters[f"wallet_behavior:{wallet_hash}"].append(cert_node.node_id)
        
        # Pattern 2: IPFS storage pattern (detects duplicate content)
        ipfs_pattern = cert_node.properties['ipfs_hash'][:16]  # First 16 chars
        self.pattern_clusters[f"ipfs_prefix:{ipfs_pattern}"].append(cert_node.node_id)
        
        # Pattern 3: Temporal issuance pattern
        hour_bucket = cert_node.properties['minted_at'][:13]  # YYYY-MM-DDTHH
        self.pattern_clusters[f"issuance_hour:{hour_bucket}"].append(cert_node.node_id)
        
        # Pattern 4: Chain activity pattern
        chain_id = chain_node.properties['chain_id']
        self.pattern_clusters[f"chain_activity:{chain_id}"].append(cert_node.node_id)
    
    def _hash_wallet_behavior(self, owner_node: SKGNode) -> str:
        """
        Create behavior fingerprint from wallet metadata.
        """
        wallet = owner_node.properties["wallet_address"]
        name = owner_node.properties["owner_name"]
        
        # Simple behavioral hash (expand with transaction history)
        behavior_string = f"{wallet}:{name}"
        return hashlib.md5(behavior_string.encode()).hexdigest()[:8]
    
    def detect_duplicates(self, cert_node: SKGNode) -> Set[str]:
        """
        Check if this certificate is a duplicate of existing ones.
        """
        duplicates = set()
        ipfs_hash = cert_node.properties['ipfs_hash']
        
        for pattern_key, cert_ids in self.pattern_clusters.items():
            if pattern_key.startswith("ipfs_prefix:") and ipfs_hash[:16] in pattern_key:
                duplicates.update(cert_ids)
        
        return duplicates
    
    def get_cluster_count(self) -> dict:
        """Return pattern cluster statistics."""
        return {
            "total_clusters": len(self.pattern_clusters),
            "wallet_behavior_clusters": len([k for k in self.pattern_clusters if k.startswith("wallet_behavior:")]),
            "ipfs_clusters": len([k for k in self.pattern_clusters if k.startswith("ipfs_prefix:")]),
            "temporal_clusters": len([k for k in self.pattern_clusters if k.startswith("issuance_hour:")])
        }