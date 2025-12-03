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
  validateCartItemId,
} from '../validator/validation';

const router = Router();

router.use(authenticate); // All cart routes require authentication

router.get('/', getCart);
router.post('/', validateAddToCart, addToCart);
router.put('/:id', validateCartItemId, validateUpdateCartItem, updateCartItem);
router.delete('/:id', validateCartItemId, removeFromCart);

export default router;
