import express from 'express';
import { getCategoryStats } from '../controllers/analyticsController.js';

const router = express.Router();

router.get('/categories', getCategoryStats);

export default router;
