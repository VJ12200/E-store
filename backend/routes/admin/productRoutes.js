import express from 'express';
import { 
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductStats
} from '../../controllers/admin/product.js';

const router = express.Router();

router.get('/', getAllProducts);
router.get('/stats', getProductStats);
router.get('/:id', getProductById);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

export default router;


