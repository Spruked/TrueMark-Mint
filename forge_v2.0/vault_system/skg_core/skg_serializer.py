# skg_serializer.py
import json
from pathlib import Path
from typing import Dict, List
from datetime import datetime
from skg_node import SKGNode, SKGEdge

class SKGSerializer:
    """
    Serializes SKG transactions to vault-compatible JSONL format.
    Enables historical replay and Caleon ingestion.
    """
    
    def __init__(self, vault_path: Path, worker_id: str):
        self.vault_path = vault_path
        self.worker_id = worker_id
        
        # Create worker-specific SKG vault directory
        self.worker_skg_path = vault_path / "worker_skg" / worker_id
        self.worker_skg_path.mkdir(parents=True, exist_ok=True)
        
        # Open JSONL append-only files
        self.nodes_file = open(self.worker_skg_path / "nodes.jsonl", "a")
        self.edges_file = open(self.worker_skg_path / "edges.jsonl", "a")
        self.transactions_file = open(self.worker_skg_path / "transactions.jsonl", "a")
    
    def serialize_transaction(self, nodes: List[SKGNode], edges: List[SKGEdge], 
                             event_type: str) -> str:
        """
        Serialize a batch of nodes/edges as a single transaction.
        Returns transaction ID.
        """
        
        transaction_id = f"SKG_TXN_{self.worker_id}_{int(datetime.utcnow().timestamp() * 1000000)}"
        
        # Write transaction header
        txn_record = {
            "transaction_id": transaction_id,
            "event_type": event_type,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "worker_id": self.worker_id,
            "node_count": len(nodes),
            "edge_count": len(edges)
        }
        self.transactions_file.write(json.dumps(txn_record) + "\n")
        
        # Write nodes
        for node in nodes:
            node_record = {
                "transaction_id": transaction_id,
                "record_type": "node",
                **node.to_dict()
            }
            self.nodes_file.write(json.dumps(node_record) + "\n")
        
        # Write edges
        for edge in edges:
            edge_record = {
                "transaction_id": transaction_id,
                "record_type": "edge",
                **edge.to_dict()
            }
            self.edges_file.write(json.dumps(edge_record) + "\n")
        
        # Flush to disk (durability)
        self.nodes_file.flush()
        self.edges_file.flush()
        self.transactions_file.flush()
        
        return transaction_id
    
    def load_graph(self, nodes_dict: Dict, edges_dict: Dict):
        """
        Load existing graph from vault JSONL files.
        """
        # Load nodes
        nodes_file = self.worker_skg_path / "nodes.jsonl"
        if nodes_file.exists():
            with open(nodes_file, "r") as f:
                for line in f:
                    record = json.loads(line)
                    # Reconstruct node (skipping transaction metadata)
                    # Implementation depends on your needs for warm-start
                    pass
        
        # Load edges similarly
        # Note: For large graphs, implement lazy loading
    
    def get_transaction_log(self, limit: int = 100) -> List[Dict]:
        """
        Retrieve recent SKG transactions for monitoring.
        """
        transactions = []
        txn_file = self.worker_skg_path / "transactions.jsonl"
        if txn_file.exists():
            with open(txn_file, "r") as f:
                for line in f:
                    transactions.append(json.loads(line))
                    if len(transactions) >= limit:
                        break
        
        return transactions