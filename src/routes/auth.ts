import { Router } from 'express';
import { register, login } from '../controllers/authController';
import { validateLogin, validateRegister } from '../validator/validation';

const router = Router();

// Authentication routes
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);

export default router;
