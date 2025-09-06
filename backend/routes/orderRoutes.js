import express from 'express';
import { isAuthenticated } from '../middleware/auth.js';
import { createOrder, getUserOrders, getOrderHistory } from '../controllers/orderController.js';

const router = express.Router();

// Create a new order
router.post('/orders', isAuthenticated, createOrder);

// Get user's current orders
router.get('/orders', isAuthenticated, getUserOrders);

// Get user's order history
router.get('/orders/history', isAuthenticated, getOrderHistory);

export default router;
