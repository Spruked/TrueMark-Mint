/**
 * USD-Based Crypto Payment System
 * Converts USD prices to real-time crypto amounts
 */

class USDCryptoPricing {
    constructor() {
        this.prices = {
            MATIC: 0,
            ETH: 0
        };
        this.lastUpdate = 0;
        this.updateInterval = 30000; // 30 seconds
        this.apiEndpoints = {
            // Free price feeds
            coingecko: 'https://api.coingecko.com/api/v3/simple/price?ids=matic-network,ethereum&vs_currencies=usd',
            // Backup endpoints
            coinbase: 'https://api.coinbase.com/v2/exchange-rates',
            // For production, consider paid APIs like CoinMarketCap or CryptoCompare
        };
    }

    async initialize() {
        await this.updatePrices();
        this.startPriceUpdates();
        return true;
    }

    async updatePrices() {
        try {
            console.log('Updating crypto prices...');
            
            // Try CoinGecko first (free, reliable)
            const response = await fetch(this.apiEndpoints.coingecko);
            const data = await response.json();
            
            this.prices.MATIC = data['matic-network']?.usd || 0.75; // Fallback price
            this.prices.ETH = data.ethereum?.usd || 2500; // Fallback price
            
            this.lastUpdate = Date.now();
            
            console.log('Updated prices:', this.prices);
            this.updateAllPricingDisplays();
            
        } catch (error) {
            console.warn('Error updating prices, using fallback:', error);
            // Fallback prices if API fails
            this.prices.MATIC = 0.75;
            this.prices.ETH = 2500;
        }
    }

    startPriceUpdates() {
        setInterval(() => {
            this.updatePrices();
        }, this.updateInterval);
    }

    // Convert USD amount to crypto amount
    convertUSDToCrypto(usdAmount, cryptoSymbol) {
        const price = this.prices[cryptoSymbol];
        if (!price) {
            throw new Error(`Price not available for ${cryptoSymbol}`);
        }
        
        const cryptoAmount = usdAmount / price;
        return {
            amount: this.formatCryptoAmount(cryptoAmount),
            rawAmount: cryptoAmount,
            price: price,
            usdAmount: usdAmount
        };
    }

    formatCryptoAmount(amount) {
        // Format crypto amounts appropriately
        if (amount < 1) {
            return parseFloat(amount.toFixed(6));
        } else if (amount < 10) {
            return parseFloat(amount.toFixed(4));
        } else {
            return parseFloat(amount.toFixed(2));
        }
    }

    // Get pricing for your products
    getProductPricing(usdPrice, network = 'polygon') {
        const cryptoSymbol = network === 'polygon' ? 'MATIC' : 'ETH';
        const conversion = this.convertUSDToCrypto(usdPrice, cryptoSymbol);
        
        return {
            usdPrice: usdPrice,
            cryptoAmount: conversion.amount,
            cryptoSymbol: cryptoSymbol,
            network: network,
            pricePerToken: conversion.price,
            lastUpdate: this.lastUpdate
        };
    }

    updateAllPricingDisplays() {
        // Update any existing pricing displays
        const event = new CustomEvent('pricesUpdated', {
            detail: { prices: this.prices }
        });
        document.dispatchEvent(event);
    }
}

/**
 * Enhanced Payment Manager for USD-based pricing
 */
class USDPaymentManager {
    constructor() {
        this.usdPricing = new USDCryptoPricing();
        // Use configuration from payment-config.js
        this.productPrices = window.PAYMENT_CONFIG?.products || {
            // Fallback prices if config not loaded
            nft_basic: { price: 49.95, name: 'Basic NFT Certificate' },
            nft_premium: { price: 99.95, name: 'Premium NFT Certificate' },
            license_basic: { price: 149.95, name: 'Basic License NFT' },
            license_premium: { price: 299.95, name: 'Premium License NFT' }
        };
    }

    async initialize() {
        await this.usdPricing.initialize();
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('pricesUpdated', () => {
            this.updateProductDisplays();
        });
    }

    // Get pricing for a specific product
    getProductPricing(productType, network = 'polygon') {
        const product = this.productPrices[productType];
        if (!product) {
            throw new Error(`Product type ${productType} not found`);
        }

        const usdPrice = product.price || product; // Handle both object and number formats
        const pricing = this.usdPricing.getProductPricing(usdPrice, network);
        
        return {
            ...pricing,
            productType: productType,
            productName: product.name || productType,
            displayText: `${pricing.cryptoAmount} ${pricing.cryptoSymbol} ($${usdPrice})`,
            gasFeeEstimate: this.estimateGasFees(network)
        };
    }

    estimateGasFees(network) {
        // Estimate gas fees (you can make this more sophisticated)
        return {
            polygon: { amount: 0.01, symbol: 'MATIC', usd: 0.01 },
            ethereum: { amount: 0.005, symbol: 'ETH', usd: 12.50 }
        }[network];
    }

    // Process crypto payment with exact USD conversion
    async processCryptoPayment(productType, network, walletAddress) {
        try {
            const pricing = this.getProductPricing(productType, network);
            
            console.log('Processing payment:', {
                product: productType,
                usdAmount: pricing.usdPrice,
                cryptoAmount: pricing.cryptoAmount,
                cryptoSymbol: pricing.cryptoSymbol,
                network: network
            });

            // In a real implementation, you would:
            // 1. Create a smart contract transaction
            // 2. Send the crypto to your wallet address
            // 3. Verify the transaction
            // 4. Deliver the product/NFT

            const transaction = await this.sendCryptoPayment(
                pricing.cryptoAmount,
                pricing.cryptoSymbol,
                network,
                walletAddress
            );

            return {
                success: true,
                transactionHash: transaction.hash,
                pricing: pricing
            };

        } catch (error) {
            console.error('Payment processing error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async sendCryptoPayment(amount, symbol, network, fromAddress) {
        // Get your receiving wallet address from config
        const yourWalletAddress = window.PAYMENT_CONFIG?.wallets?.[network] || 
                                 '0xYourWalletAddressHere'; // Fallback
        
        if (!window.ethereum) {
            throw new Error('MetaMask not installed');
        }
        
        console.log(`💸 Sending ${amount} ${symbol} to ${yourWalletAddress}`);
        
        try {
            const web3 = new Web3(window.ethereum);
            
            // Convert amount to Wei (for MATIC and ETH)
            const amountWei = web3.utils.toWei(amount.toString(), 'ether');
            
            const transaction = {
                from: fromAddress,
                to: yourWalletAddress,
                value: amountWei,
                gas: 21000 // Basic transfer gas limit
            };
            
            // Request transaction through MetaMask
            const txHash = await window.ethereum.request({
                method: 'eth_sendTransaction',
                params: [transaction]
            });
            
            console.log(`✅ Transaction sent! Hash: ${txHash}`);
            
            // Wait for transaction confirmation (optional)
            const receipt = await this.waitForTransaction(web3, txHash);
            
            return { 
                hash: txHash,
                receipt: receipt,
                amount: amount,
                symbol: symbol,
                to: yourWalletAddress
            };
            
        } catch (error) {
            console.error('❌ Transaction failed:', error);
            throw new Error(`Transaction failed: ${error.message}`);
        }
    }
    
    async waitForTransaction(web3, txHash, maxAttempts = 60) {
        // Wait for transaction to be mined (up to 10 minutes)
        console.log(`⏳ Waiting for transaction confirmation...`);
        
        for (let i = 0; i < maxAttempts; i++) {
            try {
                const receipt = await web3.eth.getTransactionReceipt(txHash);
                if (receipt) {
                    console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
                    return receipt;
                }
            } catch (error) {
                console.log(`⏳ Attempt ${i + 1}/${maxAttempts}: Still waiting...`);
            }
            
            // Wait 10 seconds before checking again
            await new Promise(resolve => setTimeout(resolve, 10000));
        }
        
        throw new Error('Transaction confirmation timeout');
    }

    updateProductDisplays() {
        // Update all product pricing displays with current rates
        document.querySelectorAll('[data-product-type]').forEach(element => {
            const productType = element.dataset.productType;
            const network = element.dataset.network || 'polygon';
            
            try {
                const pricing = this.getProductPricing(productType, network);
                element.textContent = pricing.displayText;
            } catch (error) {
                console.error('Error updating product display:', error);
            }
        });
    }
}

// Example usage and integration
document.addEventListener('DOMContentLoaded', async () => {
    // Wait for dependencies to load
    const maxAttempts = 50; // 5 seconds max wait
    let attempts = 0;
    
    while (attempts < maxAttempts && !window.paymentState) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    if (!window.paymentState) {
        console.error('❌ Payment state not available - integrations.js may not be loaded');
        return;
    }
    
    const paymentManager = new USDPaymentManager();
    await paymentManager.initialize();
    
    // Make it globally accessible
    window.usdPaymentManager = paymentManager;
    
    console.log('✅ USD-based crypto payment system initialized with dependencies');
});

// Example of how to use in your mint page
function setupProductPricing() {
    const mintButton = document.getElementById('mintCertificate');
    if (mintButton && window.usdPaymentManager) {
        mintButton.addEventListener('click', async () => {
            const productType = 'nft_basic'; // or get from UI selection
            const network = window.paymentState?.selectedNetwork || 'polygon';
            
            const pricing = window.usdPaymentManager.getProductPricing(productType, network);
            
            // Display pricing to user
            alert(`Price: ${pricing.displayText}\nGas Fee: ~${pricing.gasFeeEstimate.amount} ${pricing.gasFeeEstimate.symbol} (~$${pricing.gasFeeEstimate.usd})`);
            
            // Process payment
            const result = await window.usdPaymentManager.processCryptoPayment(
                productType,
                network,
                window.paymentState?.walletAddress
            );
            
            if (result.success) {
                alert('Payment successful! Transaction: ' + result.transactionHash);
            } else {
                alert('Payment failed: ' + result.error);
            }
        });
    }
}