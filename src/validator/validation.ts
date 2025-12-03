import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Type definitions for validated data
export interface ValidatedProductQuery {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  page: number;
  limit: number;
}

export interface ValidatedProductId {
  id: string;
}

// Auth validation schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email format').trim().toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .trim(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format').trim().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

// Product validation schemas
export const productQuerySchema = z.object({
  search: z
    .string()
    .optional()
    .transform((val) => val?.trim()),
  category: z
    .string()
    .optional()
    .transform((val) => val?.trim()),
  minPrice: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined)),
  maxPrice: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined)),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => {
      const parsed = val ? parseInt(val) : 20;
      return Math.min(parsed, 100);
    }),
});

export const productIdSchema = z.object({
  id: z.string().regex(/^\d+$/, 'Invalid product ID format'),
});

// Cart validation schemas
export const addToCartSchema = z.object({
  productId: z
    .string()
    .regex(/^\d+$/, 'Invalid product ID format')
    .transform((val) => parseInt(val))
    .refine((val) => val > 0, 'Product ID must be positive'),
  quantity: z
    .string()
    .regex(/^\d+$/, 'Quantity must be a positive integer')
    .transform((val) => parseInt(val))
    .refine((val) => val >= 1, 'Minimum quantity is 1'),
});

export const updateCartItemSchema = z.object({
  quantity: z
    .string()
    .regex(/^\d+$/, 'Quantity must be a positive integer')
    .transform((val) => parseInt(val))
    .refine((val) => val >= 1, 'Minimum quantity is 1'),
});

export const cartItemIdSchema = z.object({
  id: z.string().regex(/^\d+$/, 'Invalid cart item ID format'),
});

// Order validation schemas
export const orderStatusSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
});

// Admin product validation schemas
export const adminProductSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(255, 'Name must be less than 255 characters')
    .trim(),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .trim(),
  price: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Invalid price format')
    .transform((val) => parseFloat(val))
    .refine((val) => val >= 0, 'Price must be positive'),
  stock: z
    .string()
    .regex(/^\d+$/, 'Stock must be a positive integer')
    .transform((val) => parseInt(val))
    .refine((val) => val >= 0, 'Stock must be non-negative'),
  category: z
    .string()
    .min(1, 'Category is required')
    .max(100, 'Category must be less than 100 characters')
    .trim(),
  imageUrl: z.string().url('Invalid image URL').optional().or(z.literal('')),
});

// User profile update schema
export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .trim()
    .optional(),
  email: z
    .string()
    .email('Invalid email format')
    .trim()
    .toLowerCase()
    .optional(),
});

// Password change schema
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    confirmPassword: z.string().min(1, 'Password confirmation is required'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// Admin user management schema
export const adminUserSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .trim(),
  email: z.string().email('Invalid email format').trim().toLowerCase(),
  isAdmin: z.boolean().optional(),
});

// Validation Service Class
export class ValidationService {
  static validateRegister(body: unknown) {
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      const errorMessages = result.error.issues.map((issue) => issue.message);
      throw new Error(
        errorMessages.length === 1 ? errorMessages[0] : 'Validation failed'
      );
    }
    return result.data;
  }

  static validateLogin(body: unknown) {
    const result = loginSchema.safeParse(body);
    if (!result.success) {
      const errorMessages = result.error.issues.map((issue) => issue.message);
      throw new Error(
        errorMessages.length === 1 ? errorMessages[0] : 'Validation failed'
      );
    }
    return result.data;
  }

  static validateProductQuery(query: unknown): ValidatedProductQuery {
    const result = productQuerySchema.safeParse(query);
    if (!result.success) {
      const errorMessages = result.error.issues.map((issue) => issue.message);
      throw new Error(
        errorMessages.length === 1 ? errorMessages[0] : 'Validation failed'
      );
    }
    return result.data;
  }

  static validateProductId(params: unknown): ValidatedProductId {
    const result = productIdSchema.safeParse(params);
    if (!result.success) {
      const errorMessages = result.error.issues.map((issue) => issue.message);
      throw new Error(
        errorMessages.length === 1 ? errorMessages[0] : 'Validation failed'
      );
    }
    return result.data;
  }

  static validateAddToCart(body: unknown) {
    const result = addToCartSchema.safeParse(body);
    if (!result.success) {
      const errorMessages = result.error.issues.map((issue) => issue.message);
      throw new Error(
        errorMessages.length === 1 ? errorMessages[0] : 'Validation failed'
      );
    }
    return result.data;
  }

  static validateUpdateCartItem(body: unknown) {
    const result = updateCartItemSchema.safeParse(body);
    if (!result.success) {
      const errorMessages = result.error.issues.map((issue) => issue.message);
      throw new Error(
        errorMessages.length === 1 ? errorMessages[0] : 'Validation failed'
      );
    }
    return result.data;
  }

  static validateCartItemId(params: unknown) {
    const result = cartItemIdSchema.safeParse(params);
    if (!result.success) {
      const errorMessages = result.error.issues.map((issue) => issue.message);
      throw new Error(
        errorMessages.length === 1 ? errorMessages[0] : 'Validation failed'
      );
    }
    return result.data;
  }

  static validateOrderStatus(body: unknown) {
    const result = orderStatusSchema.safeParse(body);
    if (!result.success) {
      const errorMessages = result.error.issues.map((issue) => issue.message);
      throw new Error(
        errorMessages.length === 1 ? errorMessages[0] : 'Validation failed'
      );
    }
    return result.data;
  }

  static validateAdminProduct(body: unknown) {
    const result = adminProductSchema.safeParse(body);
    if (!result.success) {
      const errorMessages = result.error.issues.map((issue) => issue.message);
      throw new Error(
        errorMessages.length === 1 ? errorMessages[0] : 'Validation failed'
      );
    }
    return result.data;
  }

  static validateUpdateProfile(body: unknown) {
    const result = updateProfileSchema.safeParse(body);
    if (!result.success) {
      const errorMessages = result.error.issues.map((issue) => issue.message);
      throw new Error(
        errorMessages.length === 1 ? errorMessages[0] : 'Validation failed'
      );
    }
    return result.data;
  }

  static validateChangePassword(body: unknown) {
    const result = changePasswordSchema.safeParse(body);
    if (!result.success) {
      const errorMessages = result.error.issues.map((issue) => issue.message);
      throw new Error(
        errorMessages.length === 1 ? errorMessages[0] : 'Validation failed'
      );
    }
    return result.data;
  }

  static validateAdminUser(body: unknown) {
    const result = adminUserSchema.safeParse(body);
    if (!result.success) {
      const errorMessages = result.error.issues.map((issue) => issue.message);
      throw new Error(
        errorMessages.length === 1 ? errorMessages[0] : 'Validation failed'
      );
    }
    return result.data;
  }
}

// Middleware functions
export const validateRegister = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    ValidationService.validateRegister(req.body);
    next();
  } catch (err) {
    res.status(400).json({ message: (err as Error).message });
  }
};

export const validateLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    ValidationService.validateLogin(req.body);
    next();
  } catch (err) {
    res.status(400).json({ message: (err as Error).message });
  }
};

export const validateProductQuery = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    ValidationService.validateProductQuery(req.query);
    next();
  } catch (err) {
    res.status(400).json({ message: (err as Error).message });
  }
};

export const validateProductId = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    ValidationService.validateProductId(req.params);
    next();
  } catch (err) {
    res.status(400).json({ message: (err as Error).message });
  }
};

export const validateAddToCart = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    ValidationService.validateAddToCart(req.body);
    next();
  } catch (err) {
    res.status(400).json({ message: (err as Error).message });
  }
};

export const validateUpdateCartItem = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    ValidationService.validateUpdateCartItem(req.body);
    next();
  } catch (err) {
    res.status(400).json({ message: (err as Error).message });
  }
};

export const validateCartItemId = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    ValidationService.validateCartItemId(req.params);
    next();
  } catch (err) {
    res.status(400).json({ message: (err as Error).message });
  }
};

export const validateOrderStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    ValidationService.validateOrderStatus(req.body);
    next();
  } catch (err) {
    res.status(400).json({ message: (err as Error).message });
  }
};

export const validateAdminProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    ValidationService.validateAdminProduct(req.body);
    next();
  } catch (err) {
    res.status(400).json({ message: (err as Error).message });
  }
};

export const validateUpdateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    ValidationService.validateUpdateProfile(req.body);
    next();
  } catch (err) {
    res.status(400).json({ message: (err as Error).message });
  }
};

export const validateChangePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    ValidationService.validateChangePassword(req.body);
    next();
  } catch (err) {
    res.status(400).json({ message: (err as Error).message });
  }
};

export const validateAdminUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    ValidationService.validateAdminUser(req.body);
    next();
  } catch (err) {
    res.status(400).json({ message: (err as Error).message });
  }
};
