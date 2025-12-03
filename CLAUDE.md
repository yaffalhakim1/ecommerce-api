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
│   ├── adminAuth.ts
│   ├── auth.ts
│   └── webhookAuth.ts
├── models/              # Sequelize models with relationships
│   ├── User.ts
│   ├── Product.ts
│   ├── Cart.ts
│   ├── CartItem.ts
│   └── Order.ts
└── routes/              # Express route definitions
    ├── admin.ts
    ├── auth.ts
    ├── cart.ts
    ├── order.ts
    └── product.ts
```

### Key Models and Relationships

- **User**: Authentication model with bcrypt password hashing, admin flag
- **Product**: Product catalog with categories, pricing, and stock
- **Cart**: One-to-one with User, contains CartItems
- **CartItem**: Links Products to Carts with quantity
- **Order**: User orders with Midtrans payment integration, status tracking

### Authentication Flow

1. JWT-based authentication using `jsonwebtoken`
2. Middleware: `authenticate()` in `src/middleware/auth.ts`
3. Admin-specific routes use `adminAuth.ts` middleware
4. Token includes user ID, email, and admin status

### Payment Integration

- Midtrans payment gateway integration
- Webhook support for payment status updates
- Order status tracking: pending → completed/failed

## API Endpoints

- `/api/auth` - Registration and login
- `/api/products` - Product catalog (public)
- `/api/cart` - Shopping cart management (authenticated)
- `/api/orders` - Order management and webhooks
- `/api/admin` - Admin-only endpoints

## Environment Variables

Required variables in `.env.local`:
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` - Database connection
- `JWT_SECRET` - JWT signing secret
- `PORT` - Server port (default: 3000)

## Key Development Notes

- TypeScript strict mode enabled
- Express 5.x with proper typing
- Sequelize models use proper TypeScript interfaces
- Password hashing handled via bcrypt hooks in User model
- Error handling middleware provides development vs production responses
- CORS enabled for cross-origin requests

## Dependencies

- **Core**: express, cors, dotenv
- **Database**: sequelize, mariadb
- **Authentication**: jsonwebtoken, bcryptjs
- **Payments**: midtrans-client, stripe
- **Dev**: typescript, nodemon, ts-node, @types/*