import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { connectDatabase } from './config/database';
import orderRoutes from './routes/order';

import authRoutes from './routes/auth';
import cartRoutes from './routes/cart';
import adminRoutes from './routes/admin';
import productRoutes from './routes/product';
import healthRoutes from './routes/health';
import { globalErrorHandler } from './middleware/errorhandler';

const app: Application = express();
const PORT = process.env.PORT || 3000;

const corsOptions = {
  origin:
    process.env.NODE_ENV === 'production'
      ? ['https://yourdomain.com', 'https://www.yourdomain.com'] // Add your frontend domains
      : true, // Allow all origins in development
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'E-Commerce API',
    version: '1.0.0',
    health: '/api/health',

    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      cart: '/api/cart',
      orders: '/api/orders',
      admin: '/api/admin',
    },
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
// Webhook route (bypasses auth, uses signature verification)
app.use('/api/orders/webhook', orderRoutes);

app.use('/api/health', healthRoutes);

// error handling middleware

app.use((err: Error, req: Request, res: Response, next: Function) => {
  console.error(err.stack);

  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use(globalErrorHandler);

const startServer = async () => {
  try {
    await connectDatabase();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
