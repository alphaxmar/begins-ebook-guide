import { toast } from 'sonner';

// Error types
export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN',
}

export interface AppError {
  type: ErrorType;
  message: string;
  originalError?: Error;
  statusCode?: number;
  details?: any;
}

// Error messages in Thai
const ERROR_MESSAGES: Record<ErrorType, string> = {
  [ErrorType.NETWORK]: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต',
  [ErrorType.VALIDATION]: 'ข้อมูลที่กรอกไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่',
  [ErrorType.AUTHENTICATION]: 'กรุณาเข้าสู่ระบบก่อนใช้งาน',
  [ErrorType.AUTHORIZATION]: 'คุณไม่มีสิทธิ์ในการเข้าถึงข้อมูลนี้',
  [ErrorType.NOT_FOUND]: 'ไม่พบข้อมูลที่ต้องการ',
  [ErrorType.SERVER]: 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่ในภายหลัง',
  [ErrorType.UNKNOWN]: 'เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง',
};

// Create standardized error
export const createAppError = (
  type: ErrorType,
  message?: string,
  originalError?: Error,
  statusCode?: number,
  details?: any
): AppError => ({
  type,
  message: message || ERROR_MESSAGES[type],
  originalError,
  statusCode,
  details,
});

// Parse API error response
export const parseApiError = (error: any): AppError => {
  // Network error
  if (!navigator.onLine) {
    return createAppError(ErrorType.NETWORK, 'ไม่มีการเชื่อมต่ออินเทอร์เน็ต');
  }

  // Fetch error (network issues)
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return createAppError(ErrorType.NETWORK, undefined, error);
  }

  // HTTP errors
  if (error.message) {
    const message = error.message.toLowerCase();
    
    // Parse status code from error message
    const statusMatch = message.match(/status:\s*(\d+)/);
    const statusCode = statusMatch ? parseInt(statusMatch[1]) : undefined;

    switch (statusCode) {
      case 400:
        return createAppError(ErrorType.VALIDATION, error.message, error, 400);
      case 401:
        return createAppError(ErrorType.AUTHENTICATION, 'กรุณาเข้าสู่ระบบใหม่', error, 401);
      case 403:
        return createAppError(ErrorType.AUTHORIZATION, undefined, error, 403);
      case 404:
        return createAppError(ErrorType.NOT_FOUND, undefined, error, 404);
      case 422:
        return createAppError(ErrorType.VALIDATION, error.message, error, 422);
      case 500:
      case 502:
      case 503:
      case 504:
        return createAppError(ErrorType.SERVER, undefined, error, statusCode);
      default:
        // Try to extract meaningful message
        if (message.includes('validation')) {
          return createAppError(ErrorType.VALIDATION, error.message, error);
        }
        if (message.includes('unauthorized') || message.includes('authentication')) {
          return createAppError(ErrorType.AUTHENTICATION, error.message, error);
        }
        if (message.includes('forbidden') || message.includes('permission')) {
          return createAppError(ErrorType.AUTHORIZATION, error.message, error);
        }
        if (message.includes('not found')) {
          return createAppError(ErrorType.NOT_FOUND, error.message, error);
        }
    }
  }

  return createAppError(ErrorType.UNKNOWN, error.message, error);
};

// Handle error with toast notification
export const handleError = (error: any, customMessage?: string): AppError => {
  const appError = parseApiError(error);
  
  // Show toast notification
  const message = customMessage || appError.message;
  
  switch (appError.type) {
    case ErrorType.VALIDATION:
      toast.error(message, {
        description: 'กรุณาตรวจสอบข้อมูลและลองใหม่',
      });
      break;
    case ErrorType.AUTHENTICATION:
      toast.error(message, {
        description: 'คุณจะถูกนำไปยังหน้าเข้าสู่ระบบ',
        action: {
          label: 'เข้าสู่ระบบ',
          onClick: () => window.location.href = '/login',
        },
      });
      break;
    case ErrorType.NETWORK:
      toast.error(message, {
        description: 'กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต',
      });
      break;
    case ErrorType.SERVER:
      toast.error(message, {
        description: 'ทีมงานได้รับแจ้งแล้ว กรุณาลองใหม่ในภายหลัง',
      });
      break;
    default:
      toast.error(message);
  }

  // Log error for debugging
  console.error('Error handled:', {
    type: appError.type,
    message: appError.message,
    originalError: appError.originalError,
    statusCode: appError.statusCode,
    details: appError.details,
  });

  // Log to external service in production
  if (process.env.NODE_ENV === 'production') {
    // Example: Sentry.captureException(appError.originalError || new Error(appError.message), {
    //   tags: { errorType: appError.type },
    //   extra: { statusCode: appError.statusCode, details: appError.details },
    // });
  }

  return appError;
};

// Async error handler for promises
export const handleAsyncError = async <T>(
  promise: Promise<T>,
  customMessage?: string
): Promise<T | null> => {
  try {
    return await promise;
  } catch (error) {
    handleError(error, customMessage);
    return null;
  }
};

// Retry mechanism
export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on certain error types
      const appError = parseApiError(error);
      if ([ErrorType.AUTHENTICATION, ErrorType.AUTHORIZATION, ErrorType.VALIDATION].includes(appError.type)) {
        throw error;
      }

      // Wait before retry (exponential backoff)
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }

  throw lastError;
};

// Form validation error handler
export const handleFormError = (error: any, setFieldError?: (field: string, message: string) => void) => {
  const appError = parseApiError(error);
  
  // If it's a validation error with field details
  if (appError.type === ErrorType.VALIDATION && appError.details && setFieldError) {
    // Handle Zod validation errors
    if (Array.isArray(appError.details)) {
      appError.details.forEach((detail: any) => {
        if (detail.path && detail.message) {
          setFieldError(detail.path[0], detail.message);
        }
      });
      return appError;
    }
  }

  // Show general error
  handleError(error);
  return appError;
};