import { Request, Response } from 'express';
import Product from '../models/Product';
import { ValidationService } from '../validator/validation';

export const createProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const validated = ValidationService.validateAdminProduct(req.body);
    const { name, description, price, stock, category, imageUrl } = validated;

    const product = await Product.create({
      name,
      description,
      price,
      stock,
      category,
      imageUrl,
    });

    res.status(201).json({
      message: 'Product created successfully',
      product,
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const validated = ValidationService.validateAdminProduct(req.body);
    const { name, description, price, stock, category, imageUrl } = validated;
    const { id } = req.params;

    const product = await Product.findByPk(id);

    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    await product.update({
      name: name !== undefined ? name : product.name,
      description: description !== undefined ? description : product.description,
      price: price !== undefined ? price : product.price,
      stock: stock !== undefined ? stock : product.stock,
      category: category !== undefined ? category : product.category,
      imageUrl: imageUrl !== undefined ? imageUrl : product.imageUrl,
    });

    res.json({
      message: 'Product updated successfully',
      product,
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Server error while updating product' });
  }
};

export const deleteProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const validated = ValidationService.validateProductId(req.params);
    const { id } = validated;

    const product = await Product.findByPk(id);

    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    await product.destroy();

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Server error while deleting product' });
  }
};
