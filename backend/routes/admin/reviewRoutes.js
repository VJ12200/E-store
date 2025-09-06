import express from 'express';
import {
    getAllReviews,
    getReviewById,
    updateReview,
    deleteReview,
    getReviewStats,
    bulkDeleteReviews
} from '../../controllers/admin/review.js';

const router = express.Router();

router.get('/', getAllReviews);
router.get('/stats', getReviewStats);
router.get('/:id', getReviewById);
router.put('/:id', updateReview);
router.delete('/:id', deleteReview);
router.delete('/bulk', bulkDeleteReviews);

export default router;


