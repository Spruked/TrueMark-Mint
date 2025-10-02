/**
 * TrueMark Error Handler
 * Comprehensive error handling for payment, network, and API failures
 */

class TrueMarkErrorHandler {
    constructor() {
        this.errorContainer = null;
        this.setupErrorDisplay();
        this.setupGlobalErrorHandlers();
    }

    setupErrorDisplay() {
        // Create error display container if it doesn't exist
        if (!document.getElementById('errorDisplay')) {
            const errorDiv = document.createElement('div');
            errorDiv.id = 'errorDisplay';
            errorDiv.className = 'error-display';
            errorDiv.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                max-width: 400px;
                z-index: 10000;
                display: none;
            `;
            document.body.appendChild(errorDiv);
            this.errorContainer = errorDiv;
        } else {
            this.errorContainer = document.getElementById('errorDisplay');
        }
    }

    setupGlobalErrorHandlers() {
        // Catch unhandled JavaScript errors
        window.addEventListener('error', (event) => {
            console.error('Global error caught:', event.error);
            this.showError('System Error', 'An unexpected error occurred. Please refresh the page.');
        });

        // Catch unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.showError('System Error', 'A network or processing error occurred. Please try again.');
        });
    }

    showError(title, message, type = 'error', duration = 5000) {
        const errorId = 'error-' + Date.now();
        
        const errorElement = document.createElement('div');
        errorElement.id = errorId;
        errorElement.className = `error-notification ${type}`;
        errorElement.innerHTML = `
            <div class="error-content">
                <div class="error-header">
                    <strong>${title}</strong>
                    <button class="error-close" onclick="this.closest('.error-notification').remove()">×</button>
                </div>
                <div class="error-message">${message}</div>
            </div>
        `;

        // Apply styles
        errorElement.style.cssText = `
            background: ${type === 'error' ? '#dc3545' : type === 'warning' ? '#ffc107' : '#28a745'};
            color: white;
            padding: 1rem;
            margin-bottom: 0.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideIn 0.3s ease;
        `;

        this.errorContainer.style.display = 'block';
        this.errorContainer.appendChild(errorElement);

        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => {
                const element = document.getElementById(errorId);
                if (element) {
                    element.style.animation = 'slideOut 0.3s ease';
                    setTimeout(() => element.remove(), 300);
                }
            }, duration);
        }

        return errorId;
    }

    showSuccess(title, message, duration = 3000) {
        return this.showError(title, message, 'success', duration);
    }

    showWarning(title, message, duration = 4000) {
        return this.showError(title, message, 'warning', duration);
    }

    // Specific error handlers for common issues
    handleWalletError(error) {
        console.error('Wallet error:', error);
        
        if (error.code === 4001) {
            this.showWarning('User Rejected', 'Transaction was rejected by user.');
        } else if (error.code === -32002) {
            this.showWarning('Request Pending', 'Please check your MetaMask wallet for a pending request.');
        } else if (error.message?.includes('insufficient funds')) {
            this.showError('Insufficient Funds', 'You don\'t have enough balance to complete this transaction.');
        } else if (error.message?.includes('network')) {
            this.showError('Network Error', 'Please check your network connection and try again.');
        } else {
            this.showError('Wallet Error', error.message || 'An error occurred with your wallet connection.');
        }
    }

    handlePaymentError(error) {
        console.error('Payment error:', error);
        
        if (error.message?.includes('Square')) {
            this.showError('Payment Failed', 'Credit card payment failed. Please check your card details.');
        } else if (error.message?.includes('gas')) {
            this.showError('Gas Error', 'Transaction failed due to gas estimation. Please try again.');
        } else if (error.message?.includes('timeout')) {
            this.showError('Transaction Timeout', 'Transaction is taking longer than expected. Please check the blockchain explorer.');
        } else {
            this.showError('Payment Error', error.message || 'Payment processing failed. Please try again.');
        }
    }

    handleNetworkError(error) {
        console.error('Network error:', error);
        
        if (error.message?.includes('fetch')) {
            this.showError('Connection Error', 'Unable to connect to the server. Please check your internet connection.');
        } else if (error.message?.includes('CORS')) {
            this.showError('Access Error', 'Server configuration error. Please contact support.');
        } else {
            this.showError('Network Error', 'Network connection failed. Please try again.');
        }
    }

    handleAPIError(response, endpoint) {
        console.error('API error:', response, endpoint);
        
        if (response.status === 404) {
            this.showError('Service Error', 'The requested service is not available.');
        } else if (response.status === 429) {
            this.showError('Rate Limited', 'Too many requests. Please wait a moment and try again.');
        } else if (response.status >= 500) {
            this.showError('Server Error', 'Server is experiencing issues. Please try again later.');
        } else if (response.status === 401) {
            this.showError('Authentication Error', 'Please log in again to continue.');
        } else {
            this.showError('API Error', `Request failed (${response.status}). Please try again.`);
        }
    }

    // Alias for consistency
    handleApiError(response, endpoint) {
        return this.handleAPIError(response, endpoint);
    }

    // Wrapper for async operations with error handling
    async withErrorHandling(operation, errorHandler = null) {
        try {
            return await operation();
        } catch (error) {
            if (errorHandler) {
                errorHandler(error);
            } else {
                // Try to categorize the error
                if (error.code !== undefined) {
                    this.handleWalletError(error);
                } else if (error.message?.includes('fetch') || error.message?.includes('network')) {
                    this.handleNetworkError(error);
                } else {
                    this.showError('Error', error.message || 'An unexpected error occurred.');
                }
            }
            throw error; // Re-throw for caller to handle if needed
        }
    }

    clearAllErrors() {
        if (this.errorContainer) {
            this.errorContainer.innerHTML = '';
            this.errorContainer.style.display = 'none';
        }
    }
}

// Add CSS for error notifications
const errorStyles = document.createElement('style');
errorStyles.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .error-notification {
        transform: translateX(0);
        transition: all 0.3s ease;
    }
    
    .error-content {
        position: relative;
    }
    
    .error-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
    }
    
    .error-close {
        background: none;
        border: none;
        color: white;
        font-size: 1.2rem;
        cursor: pointer;
        padding: 0;
        margin-left: 1rem;
    }
    
    .error-close:hover {
        opacity: 0.8;
    }
    
    .error-message {
        font-size: 0.9rem;
        line-height: 1.4;
    }
`;
document.head.appendChild(errorStyles);

// Create global error handler instance
const errorHandler = new TrueMarkErrorHandler();

// Make it globally accessible
window.errorHandler = errorHandler;

console.log('✅ TrueMark Error Handler initialized');