import { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';

export interface ApiError {
  error: string;
  message?: string;
  details?: any;
  code?: string;
  timestamp: string;
}

export class AppError extends Error {
  public statusCode: number;
  public code?: string;
  public details?: any;

  constructor(message: string, statusCode: number = 500, code?: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = 'AppError';
  }
}

export function createApiError(
  error: string,
  message?: string,
  details?: any,
  code?: string
): ApiError {
  return {
    error,
    message,
    details,
    code,
    timestamp: new Date().toISOString()
  };
}

export function handleError(err: Error, c: Context): Response {
  console.error('API Error:', {
    name: err.name,
    message: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString()
  });

  // Handle Zod validation errors
  if (err.name === 'ZodError') {
    const zodError = err as any;
    return c.json(createApiError(
      'Validation failed',
      'The request data is invalid',
      zodError.errors,
      'VALIDATION_ERROR'
    ), 400);
  }

  // Handle HTTP exceptions from Hono
  if (err instanceof HTTPException) {
    return c.json(createApiError(
      'HTTP Error',
      err.message,
      undefined,
      'HTTP_ERROR'
    ), err.status);
  }

  // Handle custom app errors
  if (err instanceof AppError) {
    return c.json(createApiError(
      err.message,
      undefined,
      err.details,
      err.code
    ), err.statusCode);
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return c.json(createApiError(
      'Invalid token',
      'The provided token is invalid',
      undefined,
      'INVALID_TOKEN'
    ), 401);
  }

  if (err.name === 'TokenExpiredError') {
    return c.json(createApiError(
      'Token expired',
      'The provided token has expired',
      undefined,
      'TOKEN_EXPIRED'
    ), 401);
  }

  // Handle database errors
  if (err.message.includes('UNIQUE constraint failed')) {
    return c.json(createApiError(
      'Duplicate entry',
      'The resource already exists',
      undefined,
      'DUPLICATE_ENTRY'
    ), 409);
  }

  if (err.message.includes('FOREIGN KEY constraint failed')) {
    return c.json(createApiError(
      'Invalid reference',
      'Referenced resource does not exist',
      undefined,
      'INVALID_REFERENCE'
    ), 400);
  }

  // Handle network/fetch errors
  if (err.name === 'TypeError' && err.message.includes('fetch')) {
    return c.json(createApiError(
      'Network error',
      'Failed to connect to external service',
      undefined,
      'NETWORK_ERROR'
    ), 503);
  }

  // Default server error
  return c.json(createApiError(
    'Internal server error',
    'An unexpected error occurred',
    process.env.NODE_ENV === 'development' ? err.stack : undefined,
    'INTERNAL_ERROR'
  ), 500);
}

// Async error wrapper
export function asyncHandler(fn: Function) {
  return (c: Context, next?: Function) => {
    return Promise.resolve(fn(c, next)).catch((err) => {
      return handleError(err, c);
    });
  };
}

// Common error creators
export const errors = {
  notFound: (resource: string = 'Resource') => 
    new AppError(`${resource} not found`, 404, 'NOT_FOUND'),
  
  unauthorized: (message: string = 'Unauthorized access') => 
    new AppError(message, 401, 'UNAUTHORIZED'),
  
  forbidden: (message: string = 'Insufficient permissions') => 
    new AppError(message, 403, 'FORBIDDEN'),
  
  badRequest: (message: string = 'Bad request', details?: any) => 
    new AppError(message, 400, 'BAD_REQUEST', details),
  
  conflict: (message: string = 'Resource conflict') => 
    new AppError(message, 409, 'CONFLICT'),
  
  tooManyRequests: (message: string = 'Too many requests') => 
    new AppError(message, 429, 'TOO_MANY_REQUESTS'),
  
  serviceUnavailable: (message: string = 'Service temporarily unavailable') => 
    new AppError(message, 503, 'SERVICE_UNAVAILABLE')
};