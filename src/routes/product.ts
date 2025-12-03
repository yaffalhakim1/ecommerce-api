import { Router } from 'express';
import {
  getAllProducts,
  getProductById,
} from '../controllers/productController';
import {
  validateProductQuery,
  validateProductId,
} from '../validator/validation';

const router = Router();

router.get('/', validateProductQuery, getAllProducts);
router.get('/:id', validateProductId, getProductById);

export default router;
