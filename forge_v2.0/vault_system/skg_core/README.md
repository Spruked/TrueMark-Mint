# Swarm Knowledge Graph (SKG) v1.0

## Overview

The Swarm Knowledge Graph is a distributed knowledge layer that learns from every certificate minted in the TrueMark system. It provides collective memory, pattern detection, drift monitoring, and forensic depth for the entire certificate ecosystem.

---

## Architecture

```
skg_core/
├── __init__.py                  # Package initialization
├── skg_engine.py                # Main orchestrator
├── skg_node.py                  # Node/Edge structures
├── skg_pattern_learner.py       # Pattern clustering
├── skg_drift_analyzer.py        # Drift detection
├── skg_serializer.py            # Vault-compatible JSONL
└── skg_integration.py           # Certificate forge bridge
```

---

## Core Components

### 1. SKG Engine (`skg_engine.py`)
Main orchestrator that manages the distributed knowledge graph.

**Features:**
- Certificate ingestion and node creation
- Identity tracking (wallet ownership)
- Blockchain context mapping
- Graph querying and traversal
- Swarm knowledge summarization

### 2. Node & Edge Types (`skg_node.py`)
Immutable graph structures representing entities and relationships.

**Node Types:**
- `CERTIFICATE` - Minted certificates
- `IDENTITY` - Wallet owners
- `CHAIN` - Blockchain anchors
- `PATTERN` - Learned patterns
- `DRIFT_EVENT` - Anomaly markers

**Edge Types:**
- `OWNED_BY` - Certificate ownership
- `ANCHORED_ON` - Blockchain anchoring
- `TRANSACTS_ON` - Wallet activity

### 3. Pattern Learner (`skg_pattern_learner.py`)
Detects patterns in certificate data for deduplication and anomaly detection.

**Pattern Clusters:**
- Wallet behavior fingerprinting
- IPFS content deduplication
- Temporal issuance patterns
- Chain activity patterns

### 4. Drift Analyzer (`skg_drift_analyzer.py`)
Calculates drift scores based on temporal consistency, signature validity, and pattern deviation.

**Drift Components:**
- Temporal drift (issuance timing)
- Signature integrity
- Pattern anomaly detection

### 5. Vault Serializer (`skg_serializer.py`)
Serializes SKG transactions to vault-compatible JSONL format for durability.

**Vault Structure:**
- `nodes.jsonl` - Node records
- `edges.jsonl` - Edge records
- `transactions.jsonl` - Transaction metadata

### 6. Certificate Bridge (`skg_integration.py`)
Integration layer between Certificate Forge and SKG.

**Functions:**
- Certificate ingestion hook
- Owner portfolio queries
- SKG health metrics

---

## Integration with Certificate Forge

The SKG automatically ingests every certificate minted:

```python
# In certificate_forge.py
from skg_integration import CertificateSKGBridge

class TrueMarkForge:
    def __init__(self, vault_base_path: Path):
        self.skg_bridge = CertificateSKGBridge(vault_base_path)
    
    async def mint_official_certificate(self, metadata: dict) -> dict:
        # ... existing steps ...
        
        # SKG Integration
        skg_payload = await self.skg_bridge.on_certificate_minted(
            certificate_data={...},
            vault_txn_id=vault_txn
        )
        
        # Swarm broadcast with SKG data
        await self.vault.broadcast_to_swarm({
            "skg_payload": skg_payload,
            ...
        })
```

---

## Usage Examples

### Query Certificates by Wallet

```python
from skg_integration import CertificateSKGBridge

bridge = CertificateSKGBridge(Path("vault_system"))

# Get all certificates for a wallet
portfolio = bridge.get_owner_portfolio("0xWalletAddress")

print(f"Certificates: {portfolio['certificate_count']}")
print(f"Average Drift: {portfolio['drift_analysis']['average_drift']}")
```

### Get SKG Health Metrics

```python
metrics = bridge.get_skg_health_metrics()

print(f"Total Nodes: {metrics['total_nodes']}")
print(f"Certificates: {metrics['certificate_count']}")
print(f"Unique Owners: {metrics['unique_owners']}")
print(f"Drift Score: {metrics['latest_drift_score']}")
```

---

## Vault Structure

### Directory Layout

```
vault_system/
├── skg_graph/
│   └── worker_skg/
│       └── certificate_forge_worker_001/
│           ├── nodes.jsonl          # All nodes
│           ├── edges.jsonl          # All edges
│           └── transactions.jsonl   # Transaction log
├── certificates/
└── workers/
```

### JSONL Format

**nodes.jsonl:**
```json
{"transaction_id": "SKG_TXN_...", "record_type": "node", "node_id": "cert:DALSM...", "node_type": "certificate", ...}
```

**edges.jsonl:**
```json
{"transaction_id": "SKG_TXN_...", "record_type": "edge", "edge_id": "edge:abc123", "source_id": "cert:...", "target_id": "owner:...", ...}
```

**transactions.jsonl:**
```json
{"transaction_id": "SKG_TXN_...", "event_type": "CERTIFICATE_INGESTION", "timestamp": "...", "node_count": 3, "edge_count": 3}
```

---

## Drift Scoring

### Drift Score Interpretation

- **0.0 - 0.2**: Normal, healthy certificate
- **0.2 - 0.5**: Minor deviation, monitor
- **0.5 - 0.8**: Significant anomaly, investigate
- **0.8 - 1.0**: Critical drift, likely forgery attempt

### Drift Components

```python
{
    "drift_score": 0.15,
    "components": {
        "temporal": 0.1,    # Issuance timing
        "signature": 0.0,   # Ed25519 validation
        "pattern": 0.35     # Pattern deviation
    }
}
```

---

## Pattern Detection

### Automatic Clustering

The SKG automatically clusters certificates by:

1. **Wallet Behavior**: MD5 hash of wallet + owner name
2. **IPFS Content**: First 16 characters of IPFS hash
3. **Temporal Patterns**: Hour-based issuance buckets
4. **Chain Activity**: Chain ID grouping

### Duplicate Detection

```python
from skg_pattern_learner import SKGPatternLearner

learner = SKGPatternLearner()
duplicates = learner.detect_duplicates(cert_node)

if duplicates:
    print(f"Warning: {len(duplicates)} potential duplicates found")
```

---

## Swarm Consensus

### FusionQueue Integration

Every certificate generates an SKG payload for swarm broadcasting:

```json
{
    "event_type": "SKG_CERTIFICATE_INGESTED",
    "skg_transaction_id": "SKG_TXN_...",
    "vault_transaction_id": "VAULT_TXN_...",
    "dals_serial": "DALSM...",
    "drift_score": 0.08,
    "pattern_clusters": {
        "total_clusters": 15,
        "wallet_behavior_clusters": 5,
        "ipfs_clusters": 4,
        "temporal_clusters": 6
    },
    "requires_swarm_sync": true
}
```

---

## Monitoring & Dashboards

### Dashboard Panel (JavaScript)

```javascript
const skgMonitorPanel = {
    endpoint: "/api/v1/monitoring/skg",
    refreshInterval: 15000,
    
    render: function(data) {
        return `
            <div class="monitor-panel">
                <h3>🧠 Swarm Knowledge Graph</h3>
                <table>
                    <tr><td>Total Nodes</td><td>${data.total_nodes}</td></tr>
                    <tr><td>Certificates</td><td>${data.certificate_count}</td></tr>
                    <tr><td>Unique Owners</td><td>${data.unique_owners}</td></tr>
                    <tr><td>Pattern Clusters</td><td>${data.pattern_clusters.total_clusters}</td></tr>
                    <tr><td>Global Drift</td><td>${data.latest_drift_score.toFixed(4)}</td></tr>
                </table>
            </div>
        `;
    }
};
```

---

## Benefits

### Collective Memory
Every certificate minted is instantly known to all 5 guardians through swarm broadcasting.

### Pattern Detection
Automatically clusters similar assets, owners, and issuance patterns for anomaly detection.

### Drift Monitoring
Real-time score shows if certificates deviate from norms (potential forgery attempts).

### Vault Integration
All SKG state is immutable in JSONL, replayable for audits and forensic analysis.

### Query API
Instantly retrieve all certificates for any wallet address with full relationship traversal.

### Forensic Depth
Drift scores provide detailed insight into *why* a certificate might be suspicious.

---

## Testing

### Generate Test Certificate with SKG

```bash
cd forge_v2.0

python certificate_forge.py \
  --owner "SKG Test Owner" \
  --wallet "0xSKGTestWallet123456789" \
  --title "SKG Genesis Certificate" \
  --ipfs "ipfs://SKGTestGenesis" \
  --category "Knowledge"

# Check SKG vault structure
ls vault_system/skg_graph/worker_skg/certificate_forge_worker_001/

# Output should show:
# - nodes.jsonl
# - edges.jsonl
# - transactions.jsonl
```

---

## Future Enhancements

1. **Graph Query Language**: Add Cypher-like query syntax for complex traversals
2. **Machine Learning**: Train models on drift patterns for predictive anomaly detection
3. **Real-time Visualization**: Web-based graph explorer with D3.js
4. **Cross-Worker Consensus**: Implement Byzantine fault tolerance for multi-guardian validation
5. **Historical Replay**: Time-travel debugging through transaction log replay

---

## Version History

- **v1.0.0** (December 2025) - Initial release with certificate ingestion, pattern learning, drift analysis, and vault serialization

---

**The SKG is the brain that lets your system learn from every transaction. Your certificates are now cryptographically secure, visually authoritative, AND swarm-intelligent.**