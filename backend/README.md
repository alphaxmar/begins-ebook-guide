# Ebook Haven Backend API

Backend API for Ebook Haven marketplace built with Cloudflare Workers, Hono framework, and D1 database.

## Features

- 🔐 JWT Authentication & Authorization
- 📚 Book Management (CRUD operations)
- 🛒 Shopping Cart functionality
- 💳 Order processing & checkout
- 📖 User library management
- 👤 User profile management
- 🏪 Seller dashboard & book management
- 🔍 Search & filtering
- 📊 Pagination support

## Tech Stack

- **Runtime**: Cloudflare Workers
- **Framework**: Hono
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2
- **Authentication**: JWT
- **Validation**: Zod
- **Password Hashing**: bcrypt

## Setup

### Prerequisites

- Node.js 18+
- Cloudflare account
- Wrangler CLI

### Installation

1. Install dependencies:
```bash
npm install
```

2. Install Wrangler CLI globally:
```bash
npm install -g wrangler
```

3. Login to Cloudflare:
```bash
wrangler login
```

4. Create D1 database:
```bash
wrangler d1 create ebook-haven-db
```

5. Create R2 bucket:
```bash
wrangler r2 bucket create ebook-haven-storage
```

6. Update `wrangler.toml` with your database and bucket IDs.

7. Run database migrations:
```bash
wrangler d1 execute ebook-haven-db --file=./migrations/0001_initial_schema.sql
```

8. Set environment variables:
```bash
# Generate a secure JWT secret
wrangler secret put JWT_SECRET

# Add your Stripe secret key (for payment processing)
wrangler secret put STRIPE_SECRET_KEY

# Set frontend URL for CORS
wrangler secret put FRONTEND_URL
```

### Development

Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:8787`

### Deployment

Deploy to Cloudflare Workers:
```bash
npm run deploy
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Books
- `GET /api/books` - Get all books (with search & pagination)
- `GET /api/books/featured` - Get featured books
- `GET /api/books/:id` - Get book by ID

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get category by ID

### Cart
- `GET /api/cart` - Get user's cart
- `POST /api/cart` - Add item to cart
- `DELETE /api/cart/:bookId` - Remove item from cart
- `DELETE /api/cart` - Clear cart

### Orders
- `GET /api/orders` - Get user's orders
- `GET /api/orders/:id` - Get order details
- `POST /api/orders/checkout` - Process checkout

### Library
- `GET /api/library` - Get user's purchased books
- `GET /api/library/:bookId/download` - Get download link

### Seller (Requires seller role)
- `GET /api/seller/dashboard` - Get seller dashboard stats
- `GET /api/seller/books` - Get seller's books
- `POST /api/seller/books` - Create new book
- `PUT /api/seller/books/:id` - Update book
- `PATCH /api/seller/books/:id/status` - Publish/unpublish book
- `DELETE /api/seller/books/:id` - Delete book

## Database Schema

### Users
- User authentication and profile information
- Roles: buyer, seller, admin

### Categories
- Book categories with icons and gradients

### Books
- Book metadata, pricing, and file information
- Status: draft, published
- File types: ebook, audiobook

### Orders & Order Items
- Order processing and item details

### User Library
- Purchased books for each user

### Cart Items
- Shopping cart functionality

### Reviews
- Book reviews and ratings

## Environment Variables

- `JWT_SECRET` - Secret key for JWT token signing
- `STRIPE_SECRET_KEY` - Stripe API key for payment processing
- `FRONTEND_URL` - Frontend URL for CORS configuration

## File Structure

```
backend/
├── src/
│   ├── index.ts              # Main application entry point
│   ├── middleware/
│   │   └── auth.ts           # Authentication middleware
│   ├── routes/
│   │   ├── auth.ts           # Authentication routes
│   │   ├── books.ts          # Book routes
│   │   ├── categories.ts     # Category routes
│   │   ├── cart.ts           # Cart routes
│   │   ├── orders.ts         # Order routes
│   │   ├── library.ts        # Library routes
│   │   └── seller.ts         # Seller routes
│   └── utils/
│       ├── auth.ts           # Auth utilities
│       └── validation.ts     # Zod schemas
├── migrations/
│   └── 0001_initial_schema.sql
├── package.json
├── tsconfig.json
└── wrangler.toml
```

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Input validation with Zod
- CORS protection
- SQL injection prevention with prepared statements

## Development Notes

- All API responses follow consistent JSON format
- Error handling with appropriate HTTP status codes
- Pagination support for list endpoints
- Search functionality for books
- File upload placeholders (implement R2 integration)
- Payment processing placeholders (implement Stripe integration)

## Next Steps

1. Implement file upload to R2 storage
2. Integrate Stripe payment processing
3. Add email notifications
4. Implement advanced search with filters
5. Add analytics and reporting
6. Implement rate limiting
7. Add API documentation with OpenAPI/Swagger