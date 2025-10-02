/**
 * Secure Configuration Loader for TrueMark
 * Loads sensitive data from environment variables or secure config
 */

class ConfigLoader {
    constructor() {
        this.config = null;
        this.loadConfig();
    }

    loadConfig() {
        // Try to load from environment variables first
        this.config = {
            square: {
                applicationId: this.getEnvVar('SQUARE_APPLICATION_ID') || 'sandbox-sq0idb-placeholder',
                locationId: this.getEnvVar('SQUARE_LOCATION_ID') || 'PLACEHOLDER',
                environment: this.getEnvVar('SQUARE_ENVIRONMENT') || 'sandbox'
            },
            wallets: {
                polygon: this.getEnvVar('POLYGON_WALLET_ADDRESS') || '0xPlaceholderPolygonAddress',
                ethereum: this.getEnvVar('ETHEREUM_WALLET_ADDRESS') || '0xPlaceholderEthereumAddress'
            },
            business: {
                name: this.getEnvVar('BUSINESS_NAME') || 'TrueMark LLC',
                email: this.getEnvVar('BUSINESS_EMAIL') || 'bryan@truemark.com',
                phone: this.getEnvVar('BUSINESS_PHONE') || 'XXX-XXX-XXXX'
            },
            api: {
                infura: this.getEnvVar('INFURA_PROJECT_ID') || '',
                alchemy: this.getEnvVar('ALCHEMY_API_KEY') || ''
            },
            security: {
                jwtSecret: this.getEnvVar('JWT_SECRET') || 'default-dev-secret',
                adminEmail: this.getEnvVar('ADMIN_EMAIL') || 'bryan@truemark.com'
            }
        };

        // Check if we have placeholder values
        this.checkConfiguration();
    }

    getEnvVar(name) {
        // Try to read from window.ENV_CONFIG first (for development)
        if (window.ENV_CONFIG && window.ENV_CONFIG[name]) {
            return window.ENV_CONFIG[name];
        }
        
        // In a browser environment, you might load this from a server endpoint
        // or use a build process to inject environment variables
        if (typeof process !== 'undefined' && process.env) {
            return process.env[name];
        }
        
        // Fallback to checking for a global config endpoint
        return null;
    }

    checkConfiguration() {
        const placeholderValues = [
            'placeholder',
            'PLACEHOLDER', 
            'your_square_app_id_here',
            'your_polygon_wallet_address_here',
            'XXX-XXX-XXXX'
        ];

        const hasPlaceholders = JSON.stringify(this.config)
            .toLowerCase()
            .includes('placeholder');

        if (hasPlaceholders) {
            console.warn('⚠️ Configuration contains placeholder values!');
            console.warn('📝 Please update your .env file with real values:');
            console.warn('   - Square Application ID and Location ID');
            console.warn('   - Your MetaMask wallet addresses');
            console.warn('   - Business contact information');
        }

        // Check for critical missing values
        this.validateCriticalConfig();
    }

    validateCriticalConfig() {
        const critical = {
            'Square App ID': this.config.square.applicationId,
            'Square Location ID': this.config.square.locationId,
            'Polygon Wallet': this.config.wallets.polygon,
            'Ethereum Wallet': this.config.wallets.ethereum
        };

        const missing = [];
        for (const [name, value] of Object.entries(critical)) {
            if (!value || value.includes('placeholder') || value.includes('PLACEHOLDER')) {
                missing.push(name);
            }
        }

        if (missing.length > 0) {
            console.error('❌ Missing critical configuration:');
            missing.forEach(item => console.error(`   - ${item}`));
            console.error('🔧 Update your .env file to enable payments!');
        }
    }

    getConfig() {
        return this.config;
    }

    // Specific getters for easy access
    getSquareConfig() {
        return this.config.square;
    }

    getWalletConfig() {
        return this.config.wallets;
    }

    getBusinessConfig() {
        return this.config.business;
    }

    isProductionReady() {
        const config = this.getConfig();
        
        // Check if all critical values are set and not placeholders
        const hasRealSquareId = !config.square.applicationId.includes('placeholder');
        const hasRealLocationId = !config.square.locationId.includes('PLACEHOLDER');
        const hasRealPolygonWallet = config.wallets.polygon.startsWith('0x') && 
                                   config.wallets.polygon.length === 42;
        const hasRealEthereumWallet = config.wallets.ethereum.startsWith('0x') && 
                                    config.wallets.ethereum.length === 42;

        return hasRealSquareId && hasRealLocationId && 
               hasRealPolygonWallet && hasRealEthereumWallet;
    }

    getSetupInstructions() {
        return {
            title: "🔧 Setup Instructions for TrueMark Payment Integration",
            steps: [
                {
                    title: "1. 🏦 Square Account Setup",
                    details: [
                        "• Go to https://developer.squareup.com/",
                        "• Sign in to your Square Developer account",
                        "• Create a new application or use existing",
                        "• Copy your Application ID and Location ID",
                        "• Add them to your .env file"
                    ]
                },
                {
                    title: "2. 💳 MetaMask Wallet Setup", 
                    details: [
                        "• Open MetaMask browser extension",
                        "• Copy your wallet address (0x...)",
                        "• Make sure you have MATIC for Polygon payments",
                        "• Add wallet address to .env file",
                        "• Fund wallet with small amount for testing"
                    ]
                },
                {
                    title: "3. 🔐 Environment Configuration",
                    details: [
                        "• Edit the .env file in your project root",
                        "• Replace all placeholder values",
                        "• Never commit .env to git (already in .gitignore)",
                        "• Test the configuration"
                    ]
                }
            ]
        };
    }
}

// Initialize configuration loader
const configLoader = new ConfigLoader();

// Make it globally available
window.CONFIG_LOADER = configLoader;
window.PAYMENT_CONFIG = configLoader.getConfig();

// Log setup status
console.log('🔧 Configuration Status:');
console.log('   Production Ready:', configLoader.isProductionReady() ? '✅' : '❌');
if (!configLoader.isProductionReady()) {
    console.log('   📋 Run CONFIG_LOADER.getSetupInstructions() for help');
}