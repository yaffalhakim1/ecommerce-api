# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Node.js e-commerce API built with TypeScript, Express.js, and Sequelize ORM using MariaDB as the database. The API provides authentication, product management, shopping cart functionality, and order processing with Midtrans payment integration.

## Development Commands

```bash
# Start development server with hot reload
npm run dev

# Build TypeScript to JavaScript
npm run build

# Start production server
npm start
```

## Database Configuration

**IMPORTANT**: The database connection is configured for production with real client data. Do not run migrations or delete data without explicit permission. Database configuration is in `src/config/database.ts`.

- Database: MariaDB
- ORM: Sequelize with auto-sync enabled (`{ alter: true }`)
- Connection configured via environment variables in `.env.local`

## Architecture

### Project Structure
```
src/
├── app.ts                 # Main Express application
├── config/
│   └── database.ts        # Sequelize database configuration
├── controllers/           # Route handlers
│   ├── adminController.ts
│   ├── authController.ts
│   ├── cartController.ts
│   ├── orderController.ts
│   └── productController.ts
├── middleware/           # Authentication and validation middleware
│   ├── adminAuth.ts      # Admin role verification (commented out)
│   ├── auth.ts           # JWT authentication middleware
│   ├── errorhandler.ts   # Global error handling middleware
│   └── webhookAuth.ts    # Midtrans webhook signature verification
├── models/              # Sequelize models with relationships
│   ├── User.ts
│   ├── Product.ts
│   ├── Cart.ts
│   ├── CartItem.ts
│   └── Order.ts
├── routes/              # Express route definitions
│   ├── admin.ts
│   ├── auth.ts
│   ├── cart.ts
│   ├── health.ts        # Health check endpoint
│   ├── order.ts
│   └── product.ts
├── services/            # External service integrations
│   └── midtrans.ts      # Midtrans payment gateway service
└── validator/           # Input validation with Zod
    └── validation.ts    # Comprehensive validation schemas and middleware
```

### Key Models and Relationships

- **User**: Authentication model with bcrypt password hashing, admin flag
  - Fields: id, email, password, name, isAdmin
  - Hooks: Automatic password hashing on create/update
  - Indexes: Unique email constraint
- **Product**: Product catalog with categories, pricing, and stock
  - Fields: id, name, description, price, stock, category, imageUrl
  - Indexes: category, name, price, composite (category, price)
  - Validation: price ≥ 0, stock ≥ 0
- **Cart**: One-to-one with User, contains CartItems
  - Fields: id, userId
  - Relationship: belongsTo User, hasMany CartItems
  - Indexes: unique userId
- **CartItem**: Links Products to Carts with quantity
  - Fields: id, cartId, productId, quantity
  - Relationships: belongsTo Cart, belongsTo Product
  - Validation: quantity ≥ 1
- **Order**: User orders with Midtrans payment integration, status tracking
  - Fields: id, userId, totalAmount, status, midtransPaymentId, orderItems, paymentType, transactionTime, settlementTime
  - Status enum: pending, completed, failed
  - Relationships: belongsTo User
  - Indexes: userId, status, midtransPaymentId, composite (userId, createdAt)

### Authentication Flow

1. JWT-based authentication using `jsonwebtoken`
2. Middleware: `authenticate()` in `src/middleware/auth.ts`
3. Token includes user ID, email, and admin status
4. Password hashing handled by bcrypt hooks in User model
5. Admin-specific routes use `adminAuth.ts` middleware (currently commented out)

### Payment Integration

- **Midtrans Payment Gateway**: Full integration with sandbox and production modes
  - Transaction creation with retry logic (max 3 retries, exponential backoff)
  - Webhook signature verification for security
  - Transaction status checking
  - Support for various payment methods
- **Stripe**: Available as dependency but not implemented
- **Order Processing**:
  - Checkout flow creates Midtrans transaction
  - Webhook handles payment notifications
  - Order status updates based on payment events

### Validation System

- **Zod Integration**: Comprehensive validation schemas for all API inputs
  - Auth: email format, password complexity, name length
  - Products: price format, stock validation, category requirements
  - Cart: product ID format, quantity validation
  - Admin operations: product/user management validation
- **ValidationService**: Centralized validation with detailed error messages
- **Middleware**: Request validation applied at route level

### Error Handling

- **Global Error Handler**: `globalErrorHandler` in `src/middleware/errorhandler.ts`
- **Custom Error Class**: `AppError` with status codes and operational flags
- **Environment-based Responses**: Detailed errors in development, safe messages in production
- **Specific Error Handlers**: Cast errors, duplicate fields, validation errors, JWT errors
- **Async Error Catching**: `catchAsync` utility for async route handlers

## API Endpoints

- `/api/auth` - Registration and login
  - `POST /register` - User registration with validation
  - `POST /login` - User authentication
- `/api/products` - Product catalog (public)
  - `GET /` - List products with search, category, price filtering, pagination
  - `GET /:id` - Get product by ID
- `/api/cart` - Shopping cart management (authenticated)
  - `GET /` - Get user's cart items
  - `POST /` - Add item to cart
  - `PUT /:id` - Update cart item quantity
  - `DELETE /:id` - Remove item from cart
- `/api/orders` - Order management and webhooks
  - `POST /checkout` - Create order and initiate payment
  - `GET /` - Get user's orders
  - `GET /:orderId` - Get specific order status
  - `POST /webhook` - Midtrans payment webhook (signature verified)
- `/api/admin` - Admin-only endpoints (authentication required, admin check commented out)
  - `POST /products` - Create new product
  - `PUT /products/:id` - Update existing product
  - `DELETE /products/:id` - Delete product
  - User management routes: commented out but scaffolded
- `/api/health` - Health check endpoint

## Environment Variables

Required variables in `.env.local`:
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` - Database connection
- `JWT_SECRET` - JWT signing secret (required for authentication)
- `MIDTRANS_SERVER_KEY` - Midtrans server key for payment processing
- `MIDTRANS_CLIENT_KEY` - Midtrans client key
- `MIDTRANS_IS_PRODUCTION` - Set to 'true' for production mode
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)

## Key Development Notes

- **TypeScript Configuration**:
  - Strict mode enabled
  - Target ES2020, CommonJS modules
  - OutDir: `./dist`
  - Proper typing throughout the application
- **Express 5.x**: Latest Express with improved async/await support
- **Sequelize Best Practices**:
  - Proper TypeScript interfaces for all models
  - Comprehensive indexing for performance
  - Cascade delete relationships
  - Field validation and constraints
- **Security Features**:
  - Password hashing with bcrypt (10 rounds)
  - JWT token authentication
  - Webhook signature verification
  - CORS configuration
  - Input validation and sanitization
- **Performance Optimizations**:
  - Database connection pooling
  - Composite indexes for common queries
  - Pagination limits (max 100 items per page)
  - Exponential backoff for external API calls

## Dependencies

### Core Dependencies
- **express**: Web framework (v5.1.0)
- **cors**: Cross-origin resource sharing
- **dotenv**: Environment variable management
- **axios**: HTTP client for external APIs

### Database & ORM
- **sequelize**: ORM (v6.37.7)
- **mariadb**: MariaDB driver (v3.4.5)

### Authentication & Security
- **jsonwebtoken**: JWT token handling
- **bcryptjs**: Password hashing
- **crypto**: Built-in crypto module

### Payment Processing
- **midtrans-client**: Official Midtrans SDK
- **stripe**: Stripe integration (available but not implemented)

### Validation & Development
- **zod**: Schema validation (v4.1.13)

### Development Dependencies
- **typescript**: TypeScript compiler (v5.9.3)
- **nodemon**: Auto-restart during development (v3.1.11)
- **ts-node**: TypeScript execution (v10.9.2)
- **@types/**: TypeScript type definitions for all dependencies