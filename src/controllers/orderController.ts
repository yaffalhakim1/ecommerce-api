import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Cart from '../models/Cart';
import CartItem from '../models/CartItem';
import Product from '../models/Product';
import Order from '../models/Order';
import User from '../models/User';
import { sequelize } from '../config/database';
import {
  createTransaction,
  createTransactionWithRetry,
  getTransactionStatus,
} from '../services/midtrans';

// Helper function to rollback stock when payment fails
const rollbackStock = async (
  orderItems: string,
  transaction: any
): Promise<void> => {
  try {
    const items = JSON.parse(orderItems);

    for (const item of items) {
      const product = await Product.findByPk(item.productId);
      if (product) {
        product.stock += item.quantity;
        await product.save({ transaction });
      }
    }

    console.log(
      `Stock rolled back for ${items.length} items due to payment failure`
    );
  } catch (error) {
    console.error('Error during stock rollback:', error);
  }
};

export const checkout = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const transaction = await sequelize.transaction();
  try {
    const userId = req.user!.id;
    const user = await User.findByPk(userId);

    if (!user) {
      await transaction.rollback();
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const cart = await Cart.findOne({
      where: { userId },
      include: [
        {
          model: CartItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'price', 'stock'], // Only fetch needed fields
            },
          ],
        },
      ],
      transaction,
    });

    if (
      !cart ||
      !cart.get('items') ||
      (cart.get('items') as any[]).length === 0
    ) {
      await transaction.rollback();
      res.status(400).json({ message: 'Cart is empty' });
      return;
    }

    const items = cart.get('items') as any[];
    let totalAmount = 0;
    const orderItems: any[] = [];
    const midtransItems: any[] = [];

    for (const item of items) {
      const product = item.product;
      if (product.stock < item.quantity) {
        await transaction.rollback();
        res.status(400).json({
          message: `Insufficient stock for ${product.name}`,
        });
        return;
      }

      await Product.update(
        { stock: sequelize.literal(`stock - ${item.quantity}`) },
        {
          where: { id: product.id },
          transaction,
        }
      );

      const itemTotal = parseFloat(product.price) * item.quantity;

      totalAmount += itemTotal;

      orderItems.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
      });

      midtransItems.push({
        id: product.id.toString(),
        price: Math.round(parseFloat(product.price)),
        quantity: item.quantity,
        name: product.name,
      });
    }

    const orderId = `ORDER-${Date.now()}-${userId}`;

    const order = await Order.create(
      {
        userId,
        totalAmount,
        status: 'pending',
        midtransPaymentId: orderId,
        orderItems: JSON.stringify(orderItems),
      },
      { transaction }
    );

    const midtransResponse = await createTransactionWithRetry(
      orderId,
      totalAmount,
      midtransItems,
      {
        first_name: user.name,
        email: user.email,
      }
    );

    await CartItem.destroy({
      where: {
        cartId: cart.id,
      },
      transaction,
    });

    await transaction.commit();

    res.status(201).json({
      message: 'Order created successfully',
      order: {
        id: order.id,
        orderId: orderId,
        totalAmount: order.totalAmount,
        status: order.status,
      },
      payment: {
        token: midtransResponse.token,
        redirect_url: midtransResponse.redirect_url,
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Checkout error:', error);
    res.status(500).json({ message: 'Server error during checkout' });
  }
};

export const getOrders = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;

    const orders = await Order.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
    });

    const formattedOrders = orders.map((order) => ({
      id: order.id,
      orderId: order.midtransPaymentId,
      totalAmount: order.totalAmount,
      status: order.status,
      items: JSON.parse(order.orderItems),
      createdAt: order.createdAt,
    }));

    res.json({
      message: 'Orders retrieved successfully',
      orders: formattedOrders,
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Server error while fetching orders' });
  }
};

export const getOrderStatus = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { orderId } = req.params;
    const userId = req.user!.id;

    const order = await Order.findOne({
      where: {
        id: orderId,
        userId, // Ensure user can only check their own orders
      },
    });

    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    // Get real-time status from Midtrans
    if (order.midtransPaymentId) {
      try {
        const midtransStatus = await getTransactionStatus(
          order.midtransPaymentId
        );

        res.json({
          message: 'Order status retrieved successfully',
          order: {
            id: order.id,
            orderId: order.midtransPaymentId,
            totalAmount: order.totalAmount,
            status: order.status,
            paymentType: order.paymentType,
            transactionTime: order.transactionTime,
            settlementTime: order.settlementTime,
            items: JSON.parse(order.orderItems),
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
          },
          midtransStatus: {
            transactionStatus: midtransStatus.transaction_status,
            fraudStatus: midtransStatus.fraud_status,
            paymentType: midtransStatus.payment_type,
            transactionTime: midtransStatus.transaction_time,
            settlementTime: midtransStatus.settlement_time,
          },
        });
      } catch (midtransError) {
        // If Midtrans API fails, return local status
        res.json({
          message: 'Order status retrieved successfully (local)',
          order: {
            id: order.id,
            orderId: order.midtransPaymentId,
            totalAmount: order.totalAmount,
            status: order.status,
            paymentType: order.paymentType,
            transactionTime: order.transactionTime,
            settlementTime: order.settlementTime,
            items: JSON.parse(order.orderItems),
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
          },
          warning: 'Unable to fetch real-time status from Midtrans',
        });
      }
    } else {
      res.status(400).json({ message: 'Order has no payment ID' });
    }
  } catch (error) {
    console.error('Get order status error:', error);
    res
      .status(500)
      .json({ message: 'Server error while fetching order status' });
  }
};

export const handlePaymentNotification = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      order_id,
      transaction_status,
      fraud_status,
      payment_type,
      transaction_time,
      settlement_time,
    } = req.body;

    const order = await Order.findOne({
      where: { midtransPaymentId: order_id },
    });

    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    let orderStatus: 'pending' | 'completed' | 'failed' = 'pending';

    // Enhanced status handling based on Midtrans official documentation
    if (transaction_status === 'capture') {
      if (fraud_status === 'challenge') {
        orderStatus = 'pending'; // waiting for fraud approval
      } else if (fraud_status === 'accept') {
        orderStatus = 'completed';
      }
    } else if (transaction_status === 'settlement') {
      orderStatus = 'completed';
    } else if (transaction_status === 'pending') {
      orderStatus = 'pending'; // waiting payment
    } else if (
      transaction_status === 'cancel' ||
      transaction_status === 'deny' ||
      transaction_status === 'expire'
    ) {
      orderStatus = 'failed';

      // Rollback stock when payment fails
      await rollbackStock(order.orderItems, await sequelize.transaction());
    }

    // Update order with additional Midtrans data
    order.status = orderStatus;

    // Store additional payment details if available
    if (payment_type) {
      order.set('paymentType', payment_type);
    }
    if (transaction_time) {
      order.set('transactionTime', new Date(transaction_time));
    }
    if (settlement_time) {
      order.set('settlementTime', new Date(settlement_time));
    }

    await order.save();

    console.log(
      `Payment notification processed: Order ${order_id} status updated to ${orderStatus}`
    );

    res.json({ message: 'Notification processed successfully' });
  } catch (error) {
    console.error('Payment notification error:', error);
    res.status(500).json({ message: 'Server error processing notification' });
  }
};
