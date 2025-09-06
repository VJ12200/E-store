import express from 'express';
import { getTopSellingProducts, getCategoryStats } from '../controllers/analyticsController.js';

const router = express.Router();

router.get('/top-selling', getTopSellingProducts);
router.get('/categories', getCategoryStats);

export default router;