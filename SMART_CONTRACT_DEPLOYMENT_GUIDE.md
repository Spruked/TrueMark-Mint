# TrueMark Mint Smart Contract Deployment Guide

## Overview
This guide walks you through deploying the TrueMark Mint smart contract using Remix IDE and MetaMask. The contract handles NFT minting, certificate verification, and royalty management for the TrueMark system.

## Prerequisites
- MetaMask wallet installed and funded with testnet ETH/MATIC
- Access to Remix IDE (remix.ethereum.org)
- Basic understanding of Solidity and Web3

## Step 1: Prepare Your Environment

### 1.1 Set Up MetaMask
1. Install MetaMask browser extension
2. Create or import a wallet
3. Add test networks:
   - **Polygon Mumbai Testnet**: Network ID 80001
   - **Goerli Testnet**: Network ID 5 (if using Ethereum)

### 1.2 Fund Your Wallet
- **Polygon Mumbai**: Get free MATIC from https://faucet.polygon.technology/
- **Goerli**: Get free ETH from https://goerlifaucet.com/

## Step 2: Access Remix IDE

1. Open https://remix.ethereum.org/
2. Create a new file: `TrueMarkMint.sol`
3. Copy the contract code (see below)

## Step 3: TrueMark Mint Contract Code

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract TrueMarkMint is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    // Certificate metadata structure
    struct Certificate {
        string serialNumber;
        string web3Domain;
        string caleonVerification;
        address ownerWallet;
        uint256 timestamp;
        string metadataURI;
    }

    // Mapping from token ID to certificate
    mapping(uint256 => Certificate) public certificates;

    // Events
    event CertificateMinted(uint256 indexed tokenId, address indexed owner, string serialNumber);
    event CertificateVerified(uint256 indexed tokenId, string verificationHash);

    constructor() ERC721("TrueMark Certificate", "TRMCERT") {}

    // Mint certificate function
    function mintCertificate(
        address to,
        string memory serialNumber,
        string memory web3Domain,
        string memory caleonVerification,
        string memory tokenURI
    ) public onlyOwner returns (uint256) {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);

        certificates[tokenId] = Certificate({
            serialNumber: serialNumber,
            web3Domain: web3Domain,
            caleonVerification: caleonVerification,
            ownerWallet: to,
            timestamp: block.timestamp,
            metadataURI: tokenURI
        });

        emit CertificateMinted(tokenId, to, serialNumber);
        return tokenId;
    }

    // Verify certificate authenticity
    function verifyCertificate(uint256 tokenId) public view returns (bool) {
        require(_exists(tokenId), "Certificate does not exist");
        return bytes(certificates[tokenId].serialNumber).length > 0;
    }

    // Get certificate details
    function getCertificate(uint256 tokenId) public view returns (Certificate memory) {
        require(_exists(tokenId), "Certificate does not exist");
        return certificates[tokenId];
    }

    // Override functions
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
```

## Step 4: Deploy the Contract

### 4.1 Compile the Contract
1. In Remix, go to the "Solidity Compiler" tab
2. Select compiler version: `0.8.19`
3. Click "Compile TrueMarkMint.sol"

### 4.2 Deploy to Testnet
1. Go to "Deploy & Run Transactions" tab
2. Select "Injected Provider - MetaMask" as environment
3. MetaMask will prompt you to connect and switch networks
4. Click "Deploy"
5. Confirm the transaction in MetaMask
6. Wait for confirmation (usually 10-30 seconds on Polygon)

### 4.3 Verify Deployment
- Copy the contract address from Remix
- Check on blockchain explorer:
  - Polygon Mumbai: https://mumbai.polygonscan.com/
  - Goerli: https://goerli.etherscan.io/

## Step 5: Test the Contract

### 5.1 Mint a Test Certificate
1. In Remix, expand the deployed contract
2. Call `mintCertificate` with test parameters:
   - `to`: Your wallet address
   - `serialNumber`: "TEST-2025-TRM-000001"
   - `web3Domain`: "truemark.x"
   - `caleonVerification`: "HASH_OF_CONTENT+SIGNATURE"
   - `tokenURI`: "https://ipfs.io/ipfs/YOUR_METADATA_HASH"

### 5.2 Verify the Certificate
1. Call `verifyCertificate` with the token ID
2. Should return `true`

## Step 6: Integrate with TrueMark Mint

### 6.1 Update Contract Addresses
In your `mint.js` file, update the contract addresses:

```javascript
contracts: {
    truemark: '0xYOUR_DEPLOYED_CONTRACT_ADDRESS', // Update this
    marketplace: '0x...' // Marketplace contract if needed
}
```

### 6.2 Update Backend
Update your Flask backend (`app.py`) to interact with the deployed contract:

```python
# Add Web3 integration
from web3 import Web3

# Contract ABI (simplified)
CONTRACT_ABI = [...]  # Add the full ABI

# Initialize Web3
w3 = Web3(Web3.HTTPProvider('https://polygon-mumbai.infura.io/v3/YOUR_INFURA_KEY'))

# Contract instance
contract = w3.eth.contract(address='0xYOUR_CONTRACT_ADDRESS', abi=CONTRACT_ABI)
```

## Step 7: Production Deployment

### 7.1 Switch to Mainnet
- **Polygon Mainnet**: Chain ID 137
- **Ethereum Mainnet**: Chain ID 1

### 7.2 Fund with Real Currency
- Buy MATIC on exchanges for Polygon
- Buy ETH for Ethereum

### 7.3 Deploy to Production
Repeat steps 4.1-4.3 on mainnet (be careful with gas fees!)

## Troubleshooting

### Common Issues:
1. **MetaMask not connecting**: Ensure you're on the correct network
2. **Transaction failing**: Check gas limits and wallet balance
3. **Contract not deploying**: Verify Solidity version and compilation

### Gas Optimization:
- Use Polygon for lower fees
- Optimize contract functions
- Batch transactions when possible

## Security Considerations
- Only deploy from verified wallets
- Test thoroughly on testnets
- Implement access controls
- Monitor contract interactions
- Keep private keys secure

## Next Steps
1. Integrate with IPFS for metadata storage
2. Add royalty management
3. Implement certificate transfer restrictions
4. Add batch minting functionality

For support, refer to the TrueMark documentation or contact the development team.