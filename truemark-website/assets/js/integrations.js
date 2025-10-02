/**
 * TrueMark Mint - Integration Module
 * Handles MetaMask, Square Payment, and Alpha CertSig pricing integration
 */

// Configuration
const INTEGRATION_CONFIG = {
    // MetaMask Configuration
    metamask: {
        preferredNetwork: 'polygon', // Default to Polygon for lower fees
        networks: {
            polygon: {
                chainId: '0x89', // 137 in hex
                chainName: 'Polygon Mainnet',
                nativeCurrency: {
                    name: 'MATIC',
                    symbol: 'MATIC',
                    decimals: 18
                },
                rpcUrls: ['https://polygon-rpc.com/'],
                blockExplorerUrls: ['https://polygonscan.com/']
            },
            ethereum: {
                chainId: '0x1', // 1 in hex
                chainName: 'Ethereum Mainnet',
                nativeCurrency: {
                    name: 'ETH',
                    symbol: 'ETH',
                    decimals: 18
                },
                rpcUrls: ['https://mainnet.infura.io/v3/'],
                blockExplorerUrls: ['https://etherscan.io/']
            }
        }
    },
    
    // Square Payment Configuration
    square: {
        applicationId: 'sandbox-sq0idb-YOUR_APP_ID', // Replace with your Square App ID
        locationId: 'YOUR_LOCATION_ID', // Replace with your Square Location ID
        environment: 'sandbox' // Change to 'production' for live payments
    },
    
    // Alpha CertSig Pricing Configuration
    pricing: {
        entry: {
            ethereum: { amount: 0.01, currency: 'ETH', usd: 25 },
            polygon: { amount: 15, currency: 'MATIC', usd: 7 }
        },
        premium: {
            ethereum: { amount: 0.05, currency: 'ETH', usd: 125 },
            polygon: { amount: 75, currency: 'MATIC', usd: 35 }
        },
        royalty: {
            resale: 0.015, // 1.5%
            licensing: 0.03 // 3%
        }
    }
};

// Global state
let walletState = {
    connected: false,
    account: null,
    network: null,
    balance: null
};

let paymentState = {
    selectedMethod: 'crypto', // 'crypto' or 'card'
    selectedNetwork: 'polygon',
    selectedPhase: 'entry',
    amount: 0,
    currency: 'MATIC',
    walletAddress: null,
    connected: false
};

// Make paymentState globally accessible
window.paymentState = paymentState;

/**
 * MetaMask Integration
 */
class MetaMaskIntegration {
    constructor() {
        this.web3 = null;
        this.accounts = [];
    }

    async detectMetaMask() {
        if (typeof window.ethereum !== 'undefined') {
            console.log('MetaMask detected');
            this.web3 = window.ethereum;
            return true;
        } else {
            console.log('MetaMask not detected');
            this.showMetaMaskInstallPrompt();
            return false;
        }
    }

    async connectWallet() {
        try {
            if (!await this.detectMetaMask()) {
                throw new Error('MetaMask not available');
            }

            // Request account access
            const accounts = await this.web3.request({
                method: 'eth_requestAccounts'
            });

            if (accounts.length > 0) {
                walletState.connected = true;
                walletState.account = accounts[0];
                
                // Get network info
                const chainId = await this.web3.request({ method: 'eth_chainId' });
                walletState.network = this.getNetworkName(chainId);
                
                // Get balance
                await this.updateBalance();
                
                this.updateWalletUI();
                console.log('Wallet connected:', walletState);
                
                return true;
            }
        } catch (error) {
            console.error('Error connecting wallet:', error);
            
            if (window.errorHandler) {
                window.errorHandler.handleWalletError(error);
            } else {
                this.showError('Failed to connect wallet: ' + error.message);
            }
            return false;
        }
    }

    async switchNetwork(networkKey) {
        try {
            const network = INTEGRATION_CONFIG.metamask.networks[networkKey];
            if (!network) {
                throw new Error('Unsupported network');
            }

            await this.web3.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: network.chainId }]
            });

            walletState.network = networkKey;
            await this.updateBalance();
            this.updateWalletUI();
            
            console.log('Switched to network:', networkKey);
        } catch (error) {
            if (error.code === 4902) {
                // Network not added to MetaMask, try to add it
                await this.addNetwork(networkKey);
            } else {
                console.error('Error switching network:', error);
                this.showError('Failed to switch network: ' + error.message);
            }
        }
    }

    async addNetwork(networkKey) {
        try {
            const network = INTEGRATION_CONFIG.metamask.networks[networkKey];
            await this.web3.request({
                method: 'wallet_addEthereumChain',
                params: [network]
            });
        } catch (error) {
            console.error('Error adding network:', error);
            this.showError('Failed to add network: ' + error.message);
        }
    }

    async updateBalance() {
        try {
            if (!walletState.connected) return;

            const balance = await this.web3.request({
                method: 'eth_getBalance',
                params: [walletState.account, 'latest']
            });

            // Convert from wei to ether/matic
            const balanceInEther = parseInt(balance, 16) / Math.pow(10, 18);
            walletState.balance = balanceInEther.toFixed(4);
            
            console.log('Balance updated:', walletState.balance);
        } catch (error) {
            console.error('Error getting balance:', error);
        }
    }

    getNetworkName(chainId) {
        switch (chainId) {
            case '0x1': return 'ethereum';
            case '0x89': return 'polygon';
            default: return 'unknown';
        }
    }

    updateWalletUI() {
        const walletButton = document.getElementById('connectWallet');
        const walletInfo = document.getElementById('walletInfo');
        const networkInfo = document.getElementById('networkInfo');

        if (walletState.connected) {
            walletButton.textContent = 'Connected';
            walletButton.classList.add('connected');
            
            if (walletInfo) {
                walletInfo.innerHTML = `
                    <div class="wallet-details">
                        <div class="account">${walletState.account.substring(0, 6)}...${walletState.account.substring(38)}</div>
                        <div class="balance">${walletState.balance} ${walletState.network.toUpperCase()}</div>
                    </div>
                `;
                walletInfo.style.display = 'block';
            }
            
            if (networkInfo) {
                const networkName = walletState.network.charAt(0).toUpperCase() + walletState.network.slice(1);
                networkInfo.innerHTML = `<span class="network-indicator ${walletState.network}">${networkName}</span>`;
            }
        } else {
            walletButton.textContent = 'Connect Wallet';
            walletButton.classList.remove('connected');
            
            if (walletInfo) walletInfo.style.display = 'none';
            if (networkInfo) networkInfo.innerHTML = '';
        }
    }

    showMetaMaskInstallPrompt() {
        const modal = this.createModal(`
            <div class="metamask-install">
                <h3>MetaMask Required</h3>
                <p>To use cryptocurrency payments, you need to install MetaMask wallet.</p>
                <div class="install-actions">
                    <a href="https://metamask.io/download/" target="_blank" class="btn btn-primary">
                        Install MetaMask
                    </a>
                    <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                        Use Card Payment Instead
                    </button>
                </div>
            </div>
        `);
        document.body.appendChild(modal);
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'wallet-error';
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => errorDiv.remove(), 5000);
    }

    createModal(content) {
        const modal = document.createElement('div');
        modal.className = 'modal wallet-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                ${content}
            </div>
        `;
        return modal;
    }
}

/**
 * Square Payment Integration
 */
class SquarePaymentIntegration {
    constructor() {
        this.payments = null;
        this.card = null;
    }

    async initialize() {
        try {
            // Load Square Web Payments SDK
            if (!window.Square) {
                await this.loadSquareSDK();
            }

            this.payments = window.Square.payments(
                INTEGRATION_CONFIG.square.applicationId,
                INTEGRATION_CONFIG.square.locationId
            );

            console.log('Square Payments initialized');
            return true;
        } catch (error) {
            console.error('Error initializing Square Payments:', error);
            return false;
        }
    }

    async loadSquareSDK() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://sandbox.web.squarecdn.com/v1/square.js'; // Use production URL for live
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    async createCardPayment() {
        try {
            const cardOptions = {
                style: {
                    input: {
                        fontSize: '16px',
                        fontFamily: 'Open Sans, sans-serif'
                    },
                    '.input-container': {
                        borderColor: '#C6A94E',
                        borderRadius: '8px'
                    }
                }
            };

            this.card = await this.payments.card(cardOptions);
            await this.card.attach('#card-container');
            
            console.log('Card payment form created');
        } catch (error) {
            console.error('Error creating card payment:', error);
            this.showError('Failed to load payment form');
        }
    }

    async processPayment(amount, currency = 'USD') {
        try {
            if (!this.card) {
                throw new Error('Card payment not initialized');
            }

            // Tokenize the card
            const result = await this.card.tokenize();
            
            if (result.status === 'OK') {
                const token = result.token;
                
                // Send payment to backend
                const paymentResult = await this.sendPaymentToBackend({
                    token: token,
                    amount: Math.round(amount * 100), // Square expects cents
                    currency: currency
                });

                if (paymentResult.success) {
                    this.showSuccess('Payment successful!');
                    return paymentResult;
                } else {
                    throw new Error(paymentResult.error || 'Payment failed');
                }
            } else {
                throw new Error('Card tokenization failed');
            }
        } catch (error) {
            console.error('Payment error:', error);
            this.showError('Payment failed: ' + error.message);
            return { success: false, error: error.message };
        }
    }

    async sendPaymentToBackend(paymentData) {
        try {
            const response = await fetch('/api/payments/process', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authState.token}`
                },
                body: JSON.stringify(paymentData)
            });

            return await response.json();
        } catch (error) {
            console.error('Backend payment error:', error);
            return { success: false, error: 'Payment processing failed' };
        }
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `payment-notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 5000);
    }
}

/**
 * Pricing Manager for Alpha CertSig Taxonomy
 */
class PricingManager {
    constructor() {
        this.currentPhase = 'entry';
        this.selectedNetwork = 'polygon';
    }

    getPricing(phase = this.currentPhase, network = this.selectedNetwork) {
        return INTEGRATION_CONFIG.pricing[phase][network];
    }

    updatePricingDisplay(nftType = null) {
        const pricingSection = document.querySelector('.pricing-section');
        if (!pricingSection) return;

        const pricing = this.getPricing();
        const phase = this.currentPhase;
        const network = this.selectedNetwork;

        // Update pricing breakdown
        const priceBreakdown = pricingSection.querySelector('.price-breakdown');
        if (priceBreakdown) {
            priceBreakdown.innerHTML = `
                <div class="price-item">
                    <span>NFT Minting (${phase.charAt(0).toUpperCase() + phase.slice(1)} Phase)</span>
                    <span>${pricing.amount} ${pricing.currency}</span>
                </div>
                <div class="price-item">
                    <span>Network Fees (${network.charAt(0).toUpperCase() + network.slice(1)})</span>
                    <span>~${network === 'polygon' ? '0.01' : '0.005'} ${pricing.currency}</span>
                </div>
                ${nftType ? `
                <div class="price-item">
                    <span>NFT Type: ${this.getNftTypeName(nftType)}</span>
                    <span>Included</span>
                </div>
                ` : ''}
                <div class="price-item royalty-info">
                    <span>Future Royalties</span>
                    <span>1.5% resale / 3% licensing</span>
                </div>
                <div class="price-item total">
                    <span>Total</span>
                    <span>${pricing.amount} ${pricing.currency} (~$${pricing.usd})</span>
                </div>
            `;
        }

        // Update mint button
        const mintButton = document.getElementById('mintCertificate');
        if (mintButton) {
            mintButton.innerHTML = `
                <span class="mint-text">Mint Certificate - ${pricing.amount} ${pricing.currency} (~$${pricing.usd})</span>
                <span class="network-badge">${network.charAt(0).toUpperCase() + network.slice(1)}</span>
            `;
        }

        // Update phase indicator
        const phaseIndicator = document.querySelector('.pricing-phase-indicator');
        if (phaseIndicator) {
            phaseIndicator.className = `pricing-phase-indicator ${phase}`;
            phaseIndicator.textContent = `${phase.charAt(0).toUpperCase() + phase.slice(1)} Phase Pricing`;
        }
    }

    switchPhase(newPhase) {
        this.currentPhase = newPhase;
        this.updatePricingDisplay();
        
        // Update UI state
        document.querySelectorAll('.phase-selector').forEach(selector => {
            selector.classList.toggle('active', selector.dataset.phase === newPhase);
        });
    }

    switchNetwork(newNetwork) {
        this.selectedNetwork = newNetwork;
        paymentState.selectedNetwork = newNetwork;
        this.updatePricingDisplay();
        
        // Update UI state
        document.querySelectorAll('.network-selector').forEach(selector => {
            selector.classList.toggle('active', selector.dataset.network === newNetwork);
        });
    }

    getNftTypeName(type) {
        const names = {
            'K': 'Knowledge NFT',
            'L': 'Liability NFT',
            'H': 'Health NFT',
            'E': 'Experience NFT',
            'A': 'Asset NFT',
            'C': 'Compliance NFT',
            'Lic-NFT': 'License NFT'
        };
        return names[type] || 'Standard NFT';
    }

    calculateRoyalty(salePrice, type = 'resale') {
        const rate = INTEGRATION_CONFIG.pricing.royalty[type];
        return salePrice * rate;
    }
}

// Initialize integrations
const metaMask = new MetaMaskIntegration();
const squarePayment = new SquarePaymentIntegration();
const pricingManager = new PricingManager();

// Global functions for UI interaction
window.connectWallet = () => metaMask.connectWallet();
window.switchNetwork = (network) => {
    return window.errorHandler?.withErrorHandling(() => {
        metaMask.switchNetwork(network);
        pricingManager.switchNetwork(network);
        
        // Update UI
        document.querySelectorAll('.network-selector').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.network === network);
        });
        
        console.log('Network switched to:', network);
    }, (error) => window.errorHandler.handleNetworkError(error)) || console.error('Error handler not available');
};
window.switchPhase = (phase) => {
    return window.errorHandler?.withErrorHandling(() => {
        pricingManager.switchPhase(phase);
        
        // Update UI
        document.querySelectorAll('.phase-selector').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.phase === phase);
        });
        
        console.log('Phase switched to:', phase);
    }, (error) => {
        console.error('Error switching phase:', error);
        window.errorHandler?.handleError(error, 'PHASE_SWITCH_ERROR');
    }) || console.error('Error handler not available');
};
window.processPayment = (method) => {
    return window.errorHandler?.withErrorHandling(async () => {
        if (method === 'crypto') {
            return processCryptoPayment();
        } else {
            return squarePayment.processPayment(pricingManager.getPricing().usd);
        }
    }, (error) => window.errorHandler.handlePaymentError(error)) || Promise.reject(new Error('Error handler not available'));
};

async function processCryptoPayment() {
    return window.errorHandler?.withErrorHandling(async () => {
        if (!walletState.connected) {
            await metaMask.connectWallet();
        }
        
        const pricing = pricingManager.getPricing();
        
        // Check if user has sufficient balance
        if (parseFloat(walletState.balance) < pricing.amount) {
            throw new Error(`Insufficient balance. You need ${pricing.amount} ${pricing.currency}`);
        }
        
        // For demo purposes, show success
        // In production, this would trigger actual blockchain transaction
        console.log('Processing crypto payment:', pricing);
        
        // Simulate transaction
        setTimeout(() => {
            metaMask.showSuccess('Payment successful! Transaction confirmed on blockchain.');
        }, 2000);
        
        return { success: true, txHash: '0x...' };
    }, (error) => {
        metaMask.showError(error.message);
        window.errorHandler.handlePaymentError(error);
        return { success: false, error: error.message };
    }) || Promise.resolve({ success: false, error: 'Error handler not available' });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing TrueMark integrations...');
    
    // Initialize Square payments if card payment elements exist
    if (document.getElementById('card-container')) {
        squarePayment.initialize().then(() => {
            squarePayment.createCardPayment();
        });
    }
    
    // Initialize pricing display
    pricingManager.updatePricingDisplay();
    
    // Listen for MetaMask account changes
    if (window.ethereum) {
        window.ethereum.on('accountsChanged', (accounts) => {
            if (accounts.length === 0) {
                walletState.connected = false;
                walletState.account = null;
            } else {
                walletState.account = accounts[0];
            }
            metaMask.updateWalletUI();
        });
        
        window.ethereum.on('chainChanged', (chainId) => {
            walletState.network = metaMask.getNetworkName(chainId);
            metaMask.updateBalance();
            metaMask.updateWalletUI();
        });
    }
});

// Export missing global functions for HTML onclick handlers
window.selectPaymentMethod = function(method) {
    return window.errorHandler?.withErrorHandling(() => {
        paymentState.selectedMethod = method;
        
        // Update UI
        document.querySelectorAll('.payment-method').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.method === method);
        });
        
        // Show/hide payment sections
        const cryptoSection = document.getElementById('cryptoPaymentSection');
        const cardSection = document.getElementById('cardPaymentSection');
        
        if (method === 'crypto') {
            cryptoSection.style.display = 'block';
            cardSection.style.display = 'none';
        } else {
            cryptoSection.style.display = 'none';
            cardSection.style.display = 'block';
            // Initialize Square payment form if needed
            if (!squarePayment.card) {
                squarePayment.createCardPayment();
            }
        }
        
        console.log('Payment method selected:', method);
    }, (error) => {
        console.error('Error selecting payment method:', error);
        window.errorHandler?.handleError(error, 'PAYMENT_METHOD_ERROR');
    }) || console.error('Error handler not available');
};

console.log('TrueMark Integration Module loaded with global function exports');