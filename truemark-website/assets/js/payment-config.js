/**
 * Payment Configuration for TrueMark
 * This file contains non-sensitive configuration
 * Sensitive data is loaded from config-loader.js
 */

const PAYMENT_CONFIG = {
    // Wallet addresses - loaded securely from environment
    wallets: {
        polygon: '0x_WILL_BE_LOADED_FROM_ENV', // Will be replaced by config-loader.js
        ethereum: '0x_WILL_BE_LOADED_FROM_ENV' // Will be replaced by config-loader.js
    },
    
    // Square payment configuration - loaded securely from environment
    square: {
        applicationId: 'WILL_BE_LOADED_FROM_ENV', // Will be replaced by config-loader.js
        locationId: 'WILL_BE_LOADED_FROM_ENV', // Will be replaced by config-loader.js
        environment: 'sandbox' // Will be replaced by config-loader.js
    },
    
    // Your USD product pricing (non-sensitive)
    products: {
        nft_basic: {
            price: 49.95,
            name: 'Basic NFT Certificate',
            description: 'Entry-level digital asset certification'
        },
        nft_premium: {
            price: 99.95,
            name: 'Premium NFT Certificate', 
            description: 'Advanced digital asset certification with enhanced features'
        },
        license_basic: {
            price: 149.95,
            name: 'Basic License NFT',
            description: 'Licensing rights for basic commercial use'
        },
        license_premium: {
            price: 299.95,
            name: 'Premium License NFT',
            description: 'Full licensing rights with commercial distribution'
        }
    },
    
    // Network configurations (non-sensitive)
    networks: {
        polygon: {
            name: 'Polygon',
            symbol: 'MATIC',
            chainId: 137,
            rpcUrl: 'https://polygon-rpc.com',
            blockExplorer: 'https://polygonscan.com',
            gasPrice: 'standard'
        },
        ethereum: {
            name: 'Ethereum',
            symbol: 'ETH', 
            chainId: 1,
            rpcUrl: 'https://mainnet.infura.io/v3/your-project-id',
            blockExplorer: 'https://etherscan.io',
            gasPrice: 'fast'
        }
    },
    
    // Business information (non-sensitive public info)
    business: {
        name: 'TrueMark LLC',
        publicEmail: 'info@truemark.com', // Public contact email
        website: 'https://truemark.com',
        address: {
            // Only include public business address info here
            city: 'Your City',
            state: 'Your State',
            country: 'USA'
        }
    },
    
    // Royalty settings (non-sensitive)
    royalties: {
        resale: 1.5, // 1.5% on secondary sales
        licensing: 3.0 // 3% on licensing deals
    },

    // API endpoints for price feeds (non-sensitive)
    priceFeeds: {
        primary: 'https://api.coingecko.com/api/v3/simple/price?ids=matic-network,ethereum&vs_currencies=usd',
        backup: 'https://api.coinbase.com/v2/exchange-rates'
    }
};

// Function to update config with secure values
function updateConfigWithSecureValues() {
    if (window.CONFIG_LOADER) {
        const secureConfig = window.CONFIG_LOADER.getConfig();
        
        // Update sensitive values from secure loader
        PAYMENT_CONFIG.wallets = secureConfig.wallets;
        PAYMENT_CONFIG.square = secureConfig.square;
        
        // Update business info with private details
        Object.assign(PAYMENT_CONFIG.business, secureConfig.business);
        
        console.log('🔐 Secure configuration loaded');
    } else {
        console.warn('⚠️ Secure config loader not available - using defaults');
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateConfigWithSecureValues);
} else {
    updateConfigWithSecureValues();
}

// Make configuration globally available
window.PAYMENT_CONFIG = PAYMENT_CONFIG;