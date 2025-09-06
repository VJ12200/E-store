import express from 'express';
import { searchProducts, getAllProducts, getSearchSuggestions, getProductsByCategory, getFeaturedProducts } from '../controllers/searchController.js';

const router = express.Router();

// Search routes
router.get('/search', searchProducts);
router.get('/products', getAllProducts);
router.get('/suggestions', getSearchSuggestions);
router.get('/category/:category', getProductsByCategory);
router.get('/featured', getFeaturedProducts);

export default router;