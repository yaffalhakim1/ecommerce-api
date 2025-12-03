import { Router } from 'express';
import { AuthRequest } from '../middleware/auth';
import {
  checkout,
  getOrders,
  getOrderStatus,
  handlePaymentNotification,
} from '../controllers/orderController';
import { authenticate } from '../middleware/auth';
import { authenticateWebhook } from '../middleware/webhookAuth';

const router = Router();

// Customer routes (require authentication)
router.post('/checkout', authenticate, checkout);
router.get('/', authenticate, getOrders);
router.get('/:orderId', authenticate, getOrderStatus);

// Webhook route (no auth required, but signature verification required)
router.post('/webhook', authenticateWebhook, handlePaymentNotification);

export default router;
