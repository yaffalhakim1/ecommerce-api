import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Cart from '../models/Cart';
import CartItem from '../models/CartItem';
import Product from '../models/Product';
import { ValidationService } from '../validator/validation';

export const addItemToCart = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const validated = ValidationService.validateAddToCart(req.body);
    const { productId, quantity } = validated;
    const userId = req.user!.id;

    if (!productId || !quantity || quantity < 1) {
      res.status(400).json({ message: 'Invalid product ID or quantity' });
      return;
    }

    const product = await Product.findByPk(productId);

    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    if (product.stock < quantity) {
      res.status(400).json({ message: 'Insufficient product stock' });
      return;
    }

    let cart = await Cart.findOne({ where: { userId } });
    if (!cart) {
      cart = await Cart.create({ userId });
    }

    const existingCartItem = await CartItem.findOne({
      where: { cartId: cart.id, productId },
    });

    if (existingCartItem) {
      existingCartItem.quantity += quantity;
      await existingCartItem.save();
    } else {
      await CartItem.create({ cartId: cart.id, productId, quantity });
    }

    res.status(200).json({ message: 'Item added to cart successfully' });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getCartItems = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const cart = await Cart.findOne({
      where: { userId },
      include: [
        {
          model: CartItem,
          as: 'items',
          include: [{ model: Product, as: 'product' }],
        },
      ],
    });

    if (!cart) {
      res.status(200).json({ items: [] });
      return;
    }

    res.json({
      message: 'Cart retrieved successfully',
      cart,
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ message: 'Server error while fetching cart' });
  }
};

export const removeFromCart = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { productId } = req.params;

    const userId = req.user!.id;

    const cart = await Cart.findOne({ where: { userId } });
    if (!cart) {
      res.status(404).json({ message: 'Cart not found' });
      return;
    }

    const cartItem = await CartItem.findOne({
      where: { cartId: cart.id, productId },
    });

    if (!cartItem) {
      res.status(404).json({ message: 'Item not found in cart' });
      return;
    }

    await cartItem.destroy();

    res.status(200).json({ message: 'Item removed from cart successfully' });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateCartItem = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;
    const userId = req.user!.id;

    if (!quantity || quantity < 1) {
      res.status(400).json({ message: 'Invalid quantity' });
      return;
    }

    const cart = await Cart.findOne({ where: { userId } });

    if (!cart) {
      res.status(404).json({ message: 'Cart not found' });
      return;
    }

    const cartItem = await CartItem.findOne({
      where: { cartId: cart.id, productId },
      include: [{ model: Product, as: 'product' }],
    });

    if (!cartItem) {
      res.status(404).json({ message: 'Item not found in cart' });
      return;
    }

    const product = await Product.findByPk(productId);
    if (!product || product.stock < quantity) {
      res.status(400).json({ message: 'Insufficient product stock' });
      return;
    }

    cartItem.quantity = quantity;
    await cartItem.save();
    res.status(200).json({ message: 'Cart item updated successfully' });
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
