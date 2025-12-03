# E-Commerce API

A comprehensive RESTful API for e-commerce applications built with Node.js, Express, TypeScript, and MariaDB. This API provides complete functionality for user authentication, product management, shopping cart, order processing, and payment integration with Midtrans.

## 🚀 Features

- **User Authentication**: Secure registration and login with JWT tokens
- **Product Management**: Browse and search products with pagination and filtering
- **Shopping Cart**: Add, update, and remove items from cart
- **Order Management**: Create orders and track order status
- **Payment Integration**: Midtrans payment gateway integration
- **Admin Panel**: Admin-only endpoints for product and order management
- **Data Validation**: Comprehensive input validation using Zod
- **Error Handling**: Centralized error handling with detailed error messages
- **Security**: CORS, bcrypt password hashing, and signature verification
- **Webhook Support**: Payment status webhooks from Midtrans

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MariaDB with Sequelize ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Zod
- **Payment**: Midtrans
- **Security**: bcryptjs, CORS, crypto
- **Development**: nodemon, ts-node

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MariaDB database
- Midtrans account (for payment processing)

## 🚀 Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yaffalhakim1/ecommerce-api.git
   cd ecommerce-api
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:

   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # Database Configuration
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=your_database_user
   DB_PASSWORD=your_database_password
   DB_NAME=ecommerce_db

   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key
   JWT_EXPIRES_IN=7d

   # Midtrans Configuration
   MIDTRANS_SERVER_KEY=your_midtrans_server_key
   MIDTRANS_CLIENT_KEY=your_midtrans_client_key
   MIDTRANS_IS_PRODUCTION=false
   ```

4. **Set up the database**

   - Create a MariaDB database named `ecommerce_db`
   - The application will automatically create the necessary tables on startup

5. **Build and run the application**

   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm run build
   npm start
   ```

## 📚 API Documentation

### Base URL

```
http://localhost:3000/api
```

### Authentication Endpoints

#### Register User

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### Login User

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### Product Endpoints

#### Get All Products

```http
GET /api/products?page=1&limit=10&category=electronics&search=laptop
```

#### Get Product by ID

```http
GET /api/products/:id
```

### Cart Endpoints (Requires Authentication)

#### Get User Cart

```http
GET /api/cart
Authorization: Bearer <jwt_token>
```

#### Add Item to Cart

```http
POST /api/cart
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "productId": 1,
  "quantity": 2
}
```

#### Update Cart Item

```http
PUT /api/cart/:itemId
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "quantity": 3
}
```

#### Remove Item from Cart

```http
DELETE /api/cart/:itemId
Authorization: Bearer <jwt_token>
```

### Order Endpoints (Requires Authentication)

#### Create Order

```http
POST /api/orders
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "shippingAddress": "123 Main St, City, Country",
  "paymentMethod": "midtrans"
}
```

#### Get User Orders

```http
GET /api/orders
Authorization: Bearer <jwt_token>
```

#### Get Order by ID

```http
GET /api/orders/:id
Authorization: Bearer <jwt_token>
```

#### Process Payment

```http
POST /api/orders/:id/pay
Authorization: Bearer <jwt_token>
```

#### Payment Webhook

```http
POST /api/orders/webhook
```

### Admin Endpoints (Requires Admin Authentication)

#### Create Product

```http
POST /api/admin/products
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

{
  "name": "Product Name",
  "description": "Product description",
  "price": 99.99,
  "stock": 100,
  "category": "electronics",
  "imageUrl": "https://example.com/image.jpg"
}
```

#### Update Product

```http
PUT /api/admin/products/:id
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

{
  "price": 89.99,
  "stock": 50
}
```

#### Delete Product

```http
DELETE /api/admin/products/:id
Authorization: Bearer <admin_jwt_token>
```

#### Get All Orders

```http
GET /api/admin/orders
Authorization: Bearer <admin_jwt_token>
```

#### Update Order Status

```http
PUT /api/admin/orders/:id/status
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

{
  "status": "shipped"
}
```

### Health Check

```http
GET /api/health
```

## 🔒 Authentication

The API uses JWT (JSON Web Tokens) for authentication. To access protected endpoints:

1. Include the JWT token in the Authorization header:

   ```http
   Authorization: Bearer <your_jwt_token>
   ```

2. Tokens expire after 7 days by default

3. Admin endpoints require admin privileges

## 📊 Database Schema

### Users Table

- `id` (Primary Key)
- `name`
- `email` (Unique)
- `password` (Hashed)
- `role` (user/admin)
- `createdAt`
- `updatedAt`

### Products Table

- `id` (Primary Key)
- `name`
- `description`
- `price`
- `stock`
- `category`
- `imageUrl`
- `createdAt`
- `updatedAt`

### Orders Table

- `id` (Primary Key)
- `userId` (Foreign Key)
- `totalAmount`
- `status`
- `shippingAddress`
- `paymentMethod`
- `paymentStatus`
- `createdAt`
- `updatedAt`

### Cart Table

- `id` (Primary Key)
- `userId` (Foreign Key)
- `createdAt`
- `updatedAt`

### CartItems Table

- `id` (Primary Key)
- `cartId` (Foreign Key)
- `productId` (Foreign Key)
- `quantity`
- `createdAt`
- `updatedAt`

## 🎯 Error Handling

The API provides comprehensive error handling with standardized error responses:

```json
{
  "message": "Error description",
  "error": "Detailed error message (development only)",
  "statusCode": 400
}
```

Common error codes:

- `400` - Bad Request (Validation errors)
- `401` - Unauthorized (Authentication required)
- `403` - Forbidden (Insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## 🔧 Development

### Project Structure

```
src/
├── config/          # Database configuration
├── controllers/     # Route controllers
├── middleware/      # Express middleware
├── models/          # Sequelize models
├── routes/          # API routes
├── services/        # External service integrations
├── validator/       # Input validation schemas
└── app.ts           # Express app configuration
```

### Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start production server

### Environment Variables

The application uses the following environment variables:

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode (development/production)
- Database credentials
- JWT secret
- Midtrans API keys

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 🙏 Acknowledgments

- [Express.js](https://expressjs.com/) - Web framework
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Sequelize](https://sequelize.org/) - ORM for Node.js
- [Midtrans](https://midtrans.com/) - Payment gateway
- [Zod](https://zod.dev/) - TypeScript-first schema validation

## 📞 Support

For support and questions, please open an issue in the GitHub repository.

---

**Project Link**: [https://roadmap.sh/projects/ecommerce-api](https://roadmap.sh/projects/ecommerce-api)
