import { Request, Response } from 'express';
import Product from '../models/Product';
import { Op } from 'sequelize';
import { ValidationService } from '../validator/validation';

export const getAllProducts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const validated = ValidationService.validateProductQuery(req.query);

    const {
      search,
      category,
      minPrice,
      maxPrice,
      page = 1,
      limit = 20,
    } = validated;

    const whereClause: any = {};

    if (search && search.trim()) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search.trim()}%` } },
        { description: { [Op.iLike]: `%${search.trim()}%` } },
      ];
    }

    if (category && category.trim()) {
      whereClause.category = category.trim();
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      whereClause.price = {};
      if (minPrice !== undefined) whereClause.price[Op.gte] = minPrice;
      if (maxPrice !== undefined) whereClause.price[Op.lte] = maxPrice;
    }
    const offset = (page - 1) * limit;

    const { count, rows: products } = await Product.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      message: 'Products retrieved successfully',
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: count,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      products,
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Server error while fetching products' });
  }
};

export const getProductById = async (
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
    res.json({
      message: 'Product retrieved successfully',
      product,
    });
  } catch (error) {
    console.error('Get product by ID error:', error);
    res.status(500).json({ message: 'Server error while fetching product' });
  }
};
