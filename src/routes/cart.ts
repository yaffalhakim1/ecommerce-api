import { Router } from 'express';
import { AuthRequest } from '../middleware/auth';
import {
  addItemToCart as addToCart,
  getCartItems as getCart,
  updateCartItem,
  removeFromCart,
} from '../controllers/cartController';
import { authenticate } from '../middleware/auth';
import {
  validateAddToCart,
  validateUpdateCartItem,
  validateCartProductId,
} from '../validator/validation';

const router = Router();

router.use(authenticate); // All cart routes require authentication

router.get('/', getCart);
router.post('/', validateAddToCart, addToCart);
router.put('/:productId', validateCartProductId, validateUpdateCartItem, updateCartItem);
router.delete('/:productId', validateCartProductId, removeFromCart);

export default router;
