import express from 'express';
import { isAuthenticated } from '../middleware/auth.js';
import {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    getCartCount
} from '../controllers/cartController.js';

const router = express.Router();

// All cart routes require authentication
router.use(isAuthenticated);

// Get user's cart
router.get('/cart', getCart);

// Add item to cart
router.post('/cart/add', addToCart);

// Update cart item quantity
router.put('/cart/update', updateCartItem);

// Remove item from cart
router.delete('/cart/remove/:cartItemId', removeFromCart);

// Clear entire cart
router.delete('/cart/clear', clearCart);

// Get cart count
router.get('/cart/count', getCartCount);

export default router;
