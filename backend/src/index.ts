import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';

// Import routes
import authRoutes from './routes/auth';
import booksRoutes from './routes/books';
import categoriesRoutes from './routes/categories';
import cartRoutes from './routes/cart';
import ordersRoutes from './routes/orders';
import libraryRoutes from './routes/library';
import sellerRoutes from './routes/seller';

export interface Env {
  DB: D1Database;
  STORAGE: R2Bucket;
  JWT_SECRET: string;
  STRIPE_SECRET_KEY: string;
  FRONTEND_URL: string;
}

const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', cors({
  origin: (origin, c) => {
    // Get allowed origins from environment
    const frontendUrl = c.env?.FRONTEND_URL;
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://localhost:3000',
      'https://localhost:5173',
      frontendUrl,
      'https://2663018e.begins-ebook-guide.pages.dev'
    ].filter(Boolean);

    // Allow requests without origin (like mobile apps, Postman, etc.)
    if (!origin) return '*';
    
    // Check if origin is in allowed list
    if (allowedOrigins.some(allowed => origin === allowed || origin.includes('begins-guide'))) {
      return origin;
    }
    
    // For development, allow localhost
    if (origin.includes('localhost')) {
      return origin;
    }
    
    return false; // Reject other origins
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Health check
app.get('/', (c) => {
  return c.json({ 
    message: 'Begins.Guide API v1.0',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.route('/api/auth', authRoutes);
app.route('/api/books', booksRoutes);
app.route('/api/categories', categoriesRoutes);
app.route('/api/cart', cartRoutes);
app.route('/api/orders', ordersRoutes);
app.route('/api/library', libraryRoutes);
app.route('/api/seller', sellerRoutes);

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('API Error:', err);
  return c.json({ 
    error: 'Internal Server Error',
    message: err.message 
  }, 500);
});

export default app;