import { z } from 'zod';

// Auth schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['user', 'seller']).default('user')
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

// Book schemas
export const createBookSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  author: z.string().min(1, 'Author is required'),
  categoryId: z.number().int().positive('Valid category is required'),
  price: z.number().positive('Price must be positive'),
  originalPrice: z.number().positive().optional(),
  fileType: z.enum(['ebook', 'audiobook']),
  fileFormat: z.string().min(1, 'File format is required'),
  duration: z.number().int().positive().optional() // for audiobooks
});

export const updateBookSchema = createBookSchema.partial();

// Cart schemas
export const addToCartSchema = z.object({
  bookId: z.number().int().positive('Valid book ID is required')
});

// Order schemas
export const createOrderSchema = z.object({
  paymentMethod: z.string().min(1, 'Payment method is required')
});

// Review schemas
export const createReviewSchema = z.object({
  bookId: z.number().int().positive('Valid book ID is required'),
  rating: z.number().int().min(1).max(5, 'Rating must be between 1 and 5'),
  comment: z.string().optional()
});

// Query schemas
export const paginationSchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1),
  limit: z.string().transform(val => Math.min(parseInt(val) || 10, 50))
});

export const searchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.string().transform(val => val ? parseFloat(val) : undefined).optional(),
  maxPrice: z.string().transform(val => val ? parseFloat(val) : undefined).optional(),
  sortBy: z.enum(['title', 'price', 'rating', 'created_at']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});