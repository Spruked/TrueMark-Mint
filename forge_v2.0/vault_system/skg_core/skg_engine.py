# skg_engine.py
import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional
from uuid import uuid4

# Add skg_core to path
sys.path.insert(0, str(Path(__file__).parent))

from skg_node import SKGNode, SKGEdge, SKGNodeType
from skg_serializer import SKGSerializer
from skg_pattern_learner import SKGPatternLearner
from skg_drift_analyzer import SKGDriftAnalyzer

class SwarmKnowledgeGraphEngine:
    """
    Distributed knowledge graph that learns from certificate forge events.
    Integrates with WorkerVaultWriter and FusionQueueEngine for swarm consensus.
    """
    
    def __init__(self, vault_base_path: Path, worker_id: str):
        self.worker_id = worker_id
        self.vault_path = vault_base_path / "skg_graph"
        self.vault_path.mkdir(parents=True, exist_ok=True)
        
        # Core components
        self.serializer = SKGSerializer(self.vault_path, worker_id)
        self.pattern_learner = SKGPatternLearner()
        self.drift_analyzer = SKGDriftAnalyzer()
        
        # In-memory graph cache
        self.nodes: Dict[str, SKGNode] = {}
        self.edges: Dict[str, SKGEdge] = {}
        
        # Load existing graph from vault
        self._load_from_vault()
    
    def ingest_certificate(self, certificate_data: dict, vault_txn_id: str) -> str:
        """
        Ingest a newly minted certificate into the SKG.
        Returns SKG transaction ID for tracking.
        """
        
        # Create certificate node (immutable anchor point)
        cert_node = SKGNode(
            node_id=f"cert:{certificate_data['dals_serial']}",
            node_type=SKGNodeType.CERTIFICATE,
            properties={
                "dals_serial": certificate_data['dals_serial'],
                "asset_title": certificate_data.get('asset_title', ''),
                "ipfs_hash": certificate_data['ipfs_hash'],
                "minted_at": certificate_data['stardate'],
                "vault_txn_id": vault_txn_id,
                "ed25519_signature": certificate_data.get('ed25519_signature', ''),
                "verifying_key": certificate_data.get('verifying_key', '')
            },
            created_by=self.worker_id
        )
        
        # Create owner node (identity entity)
        owner_node = SKGNode(
            node_id=f"owner:{certificate_data.get('wallet_address', certificate_data.get('wallet', ''))}",
            node_type=SKGNodeType.IDENTITY,
            properties={
                "wallet_address": certificate_data.get('wallet_address', certificate_data.get('wallet', '')),
                "owner_name": certificate_data.get('owner', certificate_data.get('owner_name', '')),
                "first_seen": certificate_data['stardate']
            },
            created_by=self.worker_id
        )
        
        # Create chain node (blockchain context)
        chain_node = SKGNode(
            node_id=f"chain:{certificate_data.get('chain_id', 'Polygon')}:{certificate_data.get('block_height', 'pending')}",
            node_type=SKGNodeType.CHAIN,
            properties={
                "chain_id": certificate_data.get('chain_id', 'Polygon'),
                "block_height": certificate_data.get('block_height', 'pending'),
                "contract_address": certificate_data.get('contract_address', 'N/A')
            },
            created_by=self.worker_id
        )
        
        # Create edges (relationships)
        edges = [
            SKGEdge(
                edge_id=f"edge:{uuid4().hex[:8]}",
                source_id=cert_node.node_id,
                target_id=owner_node.node_id,
                edge_type="OWNED_BY",
                properties={"ownership_type": "primary"}
            ),
            SKGEdge(
                edge_id=f"edge:{uuid4().hex[:8]}",
                source_id=cert_node.node_id,
                target_id=chain_node.node_id,
                edge_type="ANCHORED_ON",
                properties={"anchor_type": "blockchain"}
            ),
            SKGEdge(
                edge_id=f"edge:{uuid4().hex[:8]}",
                source_id=owner_node.node_id,
                target_id=chain_node.node_id,
                edge_type="TRANSACTS_ON",
                properties={"wallet_type": "external"}
            )
        ]
        
        # Add to graph
        self.nodes[cert_node.node_id] = cert_node
        self.nodes[owner_node.node_id] = owner_node
        self.nodes[chain_node.node_id] = chain_node
        
        for edge in edges:
            self.edges[edge.edge_id] = edge
        
        # Serialize to vault
        skg_txn_id = self.serializer.serialize_transaction(
            nodes=[cert_node, owner_node, chain_node],
            edges=edges,
            event_type="CERTIFICATE_INGESTION"
        )
        
        # Learn patterns
        self.pattern_learner.learn_from_certificate(cert_node, owner_node, chain_node)
        
        # Analyze drift
        drift_score = self.drift_analyzer.analyze_certificate_drift(cert_node)
        
        # Update node with drift score
        cert_node.properties["drift_score"] = drift_score
        
        return skg_txn_id
    
    def query_by_wallet(self, wallet_address: str) -> List[Dict[str, Any]]:
        """
        Find all certificates owned by a wallet address.
        """
        results = []
        for node in self.nodes.values():
            if node.node_type == SKGNodeType.CERTIFICATE:
                # Traverse OWNED_BY edge to find owner
                for edge in self.edges.values():
                    if edge.source_id == node.node_id and edge.edge_type == "OWNED_BY":
                        owner_node = self.nodes.get(edge.target_id)
                        if owner_node and owner_node.properties.get("wallet_address") == wallet_address:
                            results.append({
                                "certificate": node.properties,
                                "ownership": edge.properties
                            })
        
        return results
    
    def get_swarm_knowledge_summary(self) -> dict:
        """
        Generate summary for Super Worker Guardian monitoring.
        """
        return {
            "total_nodes": len(self.nodes),
            "total_edges": len(self.edges),
            "certificate_count": len([n for n in self.nodes.values() if n.node_type == SKGNodeType.CERTIFICATE]),
            "unique_owners": len({n.properties.get("wallet_address") for n in self.nodes.values() if n.node_type == SKGNodeType.IDENTITY and n.properties.get("wallet_address")}),
            "latest_drift_score": self.drift_analyzer.get_global_drift_average(),
            "pattern_clusters": self.pattern_learner.get_cluster_count()
        }
    
    def _load_from_vault(self):
        """Load existing SKG state from vault JSONL files."""
        self.serializer.load_graph(self.nodes, self.edges)