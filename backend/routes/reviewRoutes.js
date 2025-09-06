import express from 'express';
import { getProductReviews, getUserReviews, createReview, updateReview, deleteReview, rateReviewHelpfulness, getReviewStats } from '../controllers/reviewController.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// Public routes (no authentication required)
router.get('/product/:productId', getProductReviews);
router.get('/product/:productId/stats', getReviewStats);
router.post('/:reviewId/helpfulness', rateReviewHelpfulness);

// Protected routes (authentication required)
router.get('/user', isAuthenticated, getUserReviews);
router.post('/', isAuthenticated, createReview);
router.put('/:reviewId', isAuthenticated, updateReview);
router.delete('/:reviewId', isAuthenticated, deleteReview);

export default router;