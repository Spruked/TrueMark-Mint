/**
 * Network Configuration Module
 * Centralized configuration for blockchain networks
 */

class NetworkConfig {
    constructor() {
        this.networks = {
            polygon: {
                name: 'Polygon',
                displayName: 'Polygon (MATIC)',
                chainId: 137,
                hexChainId: '0x89',
                rpcUrl: 'https://polygon-rpc.com',
                currency: 'MATIC',
                currencySymbol: 'MATIC',
                decimals: 18,
                explorerUrl: 'https://polygonscan.com',
                explorerName: 'PolygonScan',
                gasSettings: {
                    gasPrice: '30000000000', // 30 gwei
                    gasLimit: '300000',
                    maxFeePerGas: '40000000000', // 40 gwei
                    maxPriorityFeePerGas: '30000000000' // 30 gwei
                },
                contracts: {
                    truemark: process.env.POLYGON_TRUEMARK_CONTRACT || '0x0000000000000000000000000000000000000000',
                    marketplace: process.env.POLYGON_MARKETPLACE_CONTRACT || '0x0000000000000000000000000000000000000000'
                },
                type: 'personal',
                features: ['low-cost', 'fast', 'eco-friendly', 'layer2'],
                description: 'Low-cost, fast transactions perfect for personal NFT projects',
                costRange: '$0.01 - $0.50',
                avgConfirmationTime: '2-3 seconds',
                icon: '🟣',
                color: '#8247e5'
            },
            ethereum: {
                name: 'Ethereum',
                displayName: 'Ethereum (ETH)',
                chainId: 1,
                hexChainId: '0x1',
                rpcUrl: process.env.ETHEREUM_RPC_URL || 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
                currency: 'ETH',
                currencySymbol: 'ETH',
                decimals: 18,
                explorerUrl: 'https://etherscan.io',
                explorerName: 'Etherscan',
                gasSettings: {
                    gasPrice: '20000000000', // 20 gwei
                    gasLimit: '300000',
                    maxFeePerGas: '30000000000', // 30 gwei
                    maxPriorityFeePerGas: '2000000000' // 2 gwei
                },
                contracts: {
                    truemark: process.env.ETHEREUM_TRUEMARK_CONTRACT || '0x0000000000000000000000000000000000000000',
                    marketplace: process.env.ETHEREUM_MARKETPLACE_CONTRACT || '0x0000000000000000000000000000000000000000'
                },
                type: 'enterprise',
                features: ['maximum-security', 'largest-ecosystem', 'premium', 'mainnet'],
                description: 'Maximum security and decentralization for enterprise use',
                costRange: '$15 - $50',
                avgConfirmationTime: '15-30 seconds',
                icon: '💎',
                color: '#627eea'
            }
        };

        this.defaultNetwork = 'polygon';
        this.currentNetwork = this.defaultNetwork;
    }

    /**
     * Get network configuration by key
     * @param {string} networkKey - Network identifier
     * @returns {Object|null} Network configuration
     */
    getNetwork(networkKey) {
        return this.networks[networkKey] || null;
    }

    /**
     * Get all available networks
     * @returns {Object} All network configurations
     */
    getAllNetworks() {
        return this.networks;
    }

    /**
     * Get network keys
     * @returns {Array} Array of network keys
     */
    getNetworkKeys() {
        return Object.keys(this.networks);
    }

    /**
     * Get current network configuration
     * @returns {Object} Current network config
     */
    getCurrentNetwork() {
        return this.getNetwork(this.currentNetwork);
    }

    /**
     * Set current network
     * @param {string} networkKey - Network to set as current
     * @returns {boolean} Success status
     */
    setCurrentNetwork(networkKey) {
        if (this.networks[networkKey]) {
            this.currentNetwork = networkKey;
            return true;
        }
        return false;
    }

    /**
     * Get recommended network for user type
     * @param {string} userType - User type (admin, enterprise, minter, personal, demo)
     * @returns {string} Recommended network key
     */
    getRecommendedNetwork(userType) {
        switch (userType) {
            case 'admin':
            case 'enterprise':
                return 'ethereum';
            case 'minter':
            case 'personal':
            case 'demo':
            default:
                return 'polygon';
        }
    }

    /**
     * Validate network configuration
     * @param {string} networkKey - Network to validate
     * @returns {Object} Validation result
     */
    validateNetwork(networkKey) {
        const network = this.getNetwork(networkKey);
        
        if (!network) {
            return {
                valid: false,
                errors: [`Network '${networkKey}' not found`]
            };
        }

        const errors = [];
        
        // Check required fields
        const requiredFields = ['name', 'chainId', 'rpcUrl', 'currency'];
        requiredFields.forEach(field => {
            if (!network[field]) {
                errors.push(`Missing required field: ${field}`);
            }
        });

        // Check contract addresses
        if (!network.contracts?.truemark || network.contracts.truemark === '0x0000000000000000000000000000000000000000') {
            errors.push('TrueMark contract address not configured');
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Get network display information
     * @param {string} networkKey - Network key
     * @returns {Object} Display information
     */
    getNetworkDisplay(networkKey) {
        const network = this.getNetwork(networkKey);
        if (!network) return null;

        return {
            name: network.displayName || network.name,
            icon: network.icon,
            color: network.color,
            type: network.type,
            costRange: network.costRange,
            confirmationTime: network.avgConfirmationTime,
            features: network.features
        };
    }

    /**
     * Check if network supports feature
     * @param {string} networkKey - Network key
     * @param {string} feature - Feature to check
     * @returns {boolean} Feature support status
     */
    supportsFeature(networkKey, feature) {
        const network = this.getNetwork(networkKey);
        return network?.features?.includes(feature) || false;
    }

    /**
     * Get gas configuration for network
     * @param {string} networkKey - Network key
     * @returns {Object|null} Gas configuration
     */
    getGasConfig(networkKey) {
        const network = this.getNetwork(networkKey);
        return network?.gasSettings || null;
    }

    /**
     * Get contract address for network
     * @param {string} networkKey - Network key
     * @param {string} contractType - Contract type (truemark, marketplace)
     * @returns {string|null} Contract address
     */
    getContractAddress(networkKey, contractType) {
        const network = this.getNetwork(networkKey);
        return network?.contracts?.[contractType] || null;
    }

    /**
     * Format network for wallet addition
     * @param {string} networkKey - Network key
     * @returns {Object|null} Wallet network config
     */
    getWalletConfig(networkKey) {
        const network = this.getNetwork(networkKey);
        if (!network) return null;

        return {
            chainId: network.hexChainId,
            chainName: network.displayName || network.name,
            rpcUrls: [network.rpcUrl],
            nativeCurrency: {
                name: network.currency,
                symbol: network.currencySymbol || network.currency,
                decimals: network.decimals || 18
            },
            blockExplorerUrls: [network.explorerUrl]
        };
    }
}

// Create global instance
const networkConfig = new NetworkConfig();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NetworkConfig;
}

// Export for browser
if (typeof window !== 'undefined') {
    window.NetworkConfig = NetworkConfig;
    window.networkConfig = networkConfig;
}