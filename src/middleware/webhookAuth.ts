import { Request, Response, NextFunction } from 'express';
import { verifySignature } from '../services/midtrans';

export const authenticateWebhook = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const { order_id, status_code, gross_amount, signature_key } = req.body;

    // Check if required fields are present
    if (!order_id || !status_code || !gross_amount || !signature_key) {
      res.status(400).json({
        message: 'Missing required webhook fields',
      });
      return;
    }

    // Verify the signature to ensure the request is from Midtrans
    const isValidSignature = verifySignature(
      order_id,
      status_code,
      gross_amount,
      signature_key
    );

    if (!isValidSignature) {
      console.warn('Invalid webhook signature received:', {
        order_id,
        status_code,
        gross_amount,
        signature_key: signature_key.substring(0, 20) + '...', // Log partial signature for debugging
      });

      res.status(401).json({
        message: 'Invalid signature - unauthorized webhook request',
      });
      return;
    }

    // Signature is valid, proceed to next middleware
    next();
  } catch (error: any) {
    console.error('Webhook authentication error:', error);
    res.status(500).json({
      message: 'Webhook authentication failed',
    });
  }
};
