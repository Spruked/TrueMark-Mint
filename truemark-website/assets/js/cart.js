/**
 * TrueMark Shopping Cart System
 * Manages cart state and operations
 */

const CART_STORAGE_KEY = 'truemark_cart';

const CartManager = {
    /**
     * Get current cart
     */
    getCart() {
        return JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]');
    },

    /**
     * Save cart
     */
    saveCart(cart) {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
        this.updateCartBadges();
    },

    /**
     * Add item to cart
     */
    addItem(item) {
        const cart = this.getCart();
        const existing = cart.find(i => i.type === item.type);
        
        if (existing) {
            existing.quantity++;
        } else {
            cart.push({ ...item, id: Date.now(), quantity: 1 });
        }
        
        this.saveCart(cart);
        return cart;
    },

    /**
     * Remove item from cart
     */
    removeItem(index) {
        const cart = this.getCart();
        cart.splice(index, 1);
        this.saveCart(cart);
        return cart;
    },

    /**
     * Update item quantity
     */
    updateQuantity(index, quantity) {
        const cart = this.getCart();
        if (cart[index]) {
            cart[index].quantity = Math.max(1, quantity);
            this.saveCart(cart);
        }
        return cart;
    },

    /**
     * Clear cart
     */
    clearCart() {
        localStorage.removeItem(CART_STORAGE_KEY);
        this.updateCartBadges();
    },

    /**
     * Get cart totals
     */
    getCartTotals() {
        const cart = this.getCart();
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const fee = subtotal * 0.02;
        const total = subtotal + fee;
        
        return { subtotal, fee, total, itemCount: cart.length };
    },

    /**
     * Update cart count badges
     */
    updateCartBadges() {
        const cart = this.getCart();
        const badges = document.querySelectorAll('.cart-badge, #cartCount, #cartItems, #cartCountText');
        
        badges.forEach(badge => {
            if (badge) badge.textContent = cart.length;
        });
    }
};

// Auto-update cart badges on page load
document.addEventListener('DOMContentLoaded', () => {
    CartManager.updateCartBadges();
});
