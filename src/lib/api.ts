import { QueryClient } from '@tanstack/react-query';
import { withRetry, createAppError, ErrorType } from './errorHandler';

// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://begins-guide-api.alphaxmar.workers.dev/api';

// Create Query Client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on certain error types
        if (error?.message?.includes('401') || error?.message?.includes('403')) {
          return false;
        }
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: false, // Don't retry mutations by default
    },
  },
});

// Auth token management
export const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem('auth_token', token);
};

export const removeAuthToken = (): void => {
  localStorage.removeItem('auth_token');
};

// API Client class
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    useRetry: boolean = false
  ): Promise<T> {
    const makeRequest = async (): Promise<T> => {
      const url = `${this.baseURL}${endpoint}`;
      const token = getAuthToken();

      const config: RequestInit = {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
        ...options,
      };

      let response: Response;
      
      try {
        response = await fetch(url, config);
      } catch (error) {
        // Network error
        throw createAppError(
          ErrorType.NETWORK,
          'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้',
          error as Error
        );
      }

      // Handle different status codes
      if (!response.ok) {
        let errorData: any = {};
        
        try {
          errorData = await response.json();
        } catch {
          // If response is not JSON, create a generic error
          errorData = { error: `HTTP error! status: ${response.status}` };
        }

        // Create detailed error based on status code
        const error = new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
        
        // Add status code to error message for parsing
        error.message = `${error.message} (status: ${response.status})`;
        
        // Add details for validation errors
        if (response.status === 400 && errorData.details) {
          (error as any).details = errorData.details;
        }

        throw error;
      }

      try {
        return await response.json();
      } catch (error) {
        throw createAppError(
          ErrorType.SERVER,
          'ไม่สามารถประมวลผลข้อมูลจากเซิร์ฟเวอร์ได้',
          error as Error
        );
      }
    };

    if (useRetry) {
      return withRetry(makeRequest, 3, 1000);
    }

    return makeRequest();
  }

  // Auth endpoints
  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: 'user' | 'seller';
  }) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: { email: string; password: string }) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getProfile() {
    return this.request('/auth/profile');
  }

  async updateProfile(data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  }) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Books endpoints
  async getBooks(params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.category) searchParams.append('category', params.category);

    const query = searchParams.toString();
    return this.request(`/books${query ? `?${query}` : ''}`);
  }

  async getFeaturedBooks() {
    return this.request('/books/featured');
  }

  async getBook(id: string) {
    return this.request(`/books/${id}`);
  }

  // Categories endpoints
  async getCategories() {
    return this.request('/categories');
  }

  async getCategory(id: string) {
    return this.request(`/categories/${id}`);
  }

  // Cart endpoints
  async getCart() {
    return this.request('/cart');
  }

  async addToCart(bookId: number) {
    return this.request('/cart', {
      method: 'POST',
      body: JSON.stringify({ bookId }),
    });
  }

  async removeFromCart(bookId: number) {
    return this.request(`/cart/${bookId}`, {
      method: 'DELETE',
    });
  }

  async clearCart() {
    return this.request('/cart', {
      method: 'DELETE',
    });
  }

  // Orders endpoints
  async getOrders(params?: { page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const query = searchParams.toString();
    return this.request(`/orders${query ? `?${query}` : ''}`);
  }

  async getOrder(id: string) {
    return this.request(`/orders/${id}`);
  }

  async checkout() {
    return this.request('/orders/checkout', {
      method: 'POST',
    });
  }

  // Library endpoints
  async getLibrary(params?: { page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const query = searchParams.toString();
    return this.request(`/library${query ? `?${query}` : ''}`);
  }

  async getDownloadLink(bookId: string) {
    return this.request(`/library/${bookId}/download`);
  }

  // Seller endpoints
  async getSellerDashboard() {
    return this.request('/seller/dashboard');
  }

  async getSellerBooks(params?: { page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const query = searchParams.toString();
    return this.request(`/seller/books${query ? `?${query}` : ''}`);
  }

  async createBook(data: {
    title: string;
    description?: string;
    author: string;
    categoryId: number;
    price: number;
    originalPrice?: number;
    fileType: 'ebook' | 'audiobook';
    fileFormat: string;
    duration?: number;
  }) {
    return this.request('/seller/books', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBook(id: string, data: {
    title?: string;
    description?: string;
    author?: string;
    categoryId?: number;
    price?: number;
    originalPrice?: number;
  }) {
    return this.request(`/seller/books/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateBookStatus(id: string, status: 'draft' | 'published') {
    return this.request(`/seller/books/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async deleteBook(id: string) {
    return this.request(`/seller/books/${id}`, {
      method: 'DELETE',
    });
  }
}

// Create API client instance
export const api = new ApiClient(API_BASE_URL);
export const apiClient = api;

// Types
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'user' | 'seller' | 'admin';
  createdAt: string;
}

export interface Book {
  id: number;
  title: string;
  description?: string;
  author: string;
  categoryId: number;
  categoryName: string;
  price: number;
  originalPrice?: number;
  coverImageUrl: string;
  fileUrl: string;
  fileType: 'ebook' | 'audiobook';
  fileFormat: string;
  duration?: number;
  status: 'draft' | 'published';
  isFeatured: boolean;
  downloadsCount: number;
  rating: number;
  reviewsCount: number;
  sellerId: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: number;
  name: string;
  icon: string;
  gradient: string;
  bookCount: number;
}

export interface CartItem {
  id: number;
  bookId: number;
  book: Book;
  addedAt: string;
}

export interface Order {
  id: number;
  userId: number;
  totalAmount: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: number;
  orderId: number;
  bookId: number;
  book: Book;
  price: number;
}

export interface LibraryItem {
  id: number;
  userId: number;
  bookId: number;
  book: Book;
  purchasedAt: string;
}

export interface PaginationResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}