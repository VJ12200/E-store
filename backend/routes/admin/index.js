import express from 'express';
import { isAuthenticated } from '../../middleware/auth.js';
import { requireAdmin } from '../../middleware/adminAuth.js';
import productRoutes from './productRoutes.js';
import reviewRoutes from './reviewRoutes.js';
import orderRoutes from './orderRoutes.js';

const router = express.Router();

router.use(isAuthenticated);
router.use(requireAdmin);

router.use('/products', productRoutes);
router.use('/reviews', reviewRoutes);
router.use('/orders', orderRoutes);

export default router;


