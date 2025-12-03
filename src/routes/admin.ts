import { Router } from 'express';
import { AuthRequest } from '../middleware/auth';
import { authenticate } from '../middleware/auth';
// import { adminAuth } from '../middleware/adminAuth';
import {
  // getAllUsers,
  // createUser,
  // updateUser,
  // deleteUser,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/adminController';
import {
  validateAdminProduct,
  validateAdminUser,
} from '../validator/validation';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
// router.use(adminAuth);

// User management routes
// router.get('/users', getAllUsers);
// router.post('/users', validateAdminUser, createUser);
// router.put('/users/:id', validateAdminUser, updateUser);
// router.delete('/users/:id', deleteUser);

// Product management routes
router.post('/products', validateAdminProduct, createProduct);
router.put('/products/:id', validateAdminProduct, updateProduct);
router.delete('/products/:id', deleteProduct);

export default router;
