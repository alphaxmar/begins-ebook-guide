import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, CartItem } from '@/lib/api';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface CartContextType {
  items: CartItem[];
  isLoading: boolean;
  totalItems: number;
  totalAmount: number;
  addToCart: (bookId: number) => Promise<void>;
  removeFromCart: (bookId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: React.ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  const totalItems = items.length;
  const totalAmount = items.reduce((sum, item) => sum + item.book.price, 0);

  // Load cart when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      refreshCart();
    } else {
      setItems([]);
    }
  }, [isAuthenticated]);

  const refreshCart = async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    try {
      const response = await api.getCart();
      setItems(response.items || []);
    } catch (error) {
      console.error('Failed to load cart:', error);
      toast.error('ไม่สามารถโหลดตะกร้าสินค้าได้');
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = async (bookId: number) => {
    if (!isAuthenticated) {
      toast.error('กรุณาเข้าสู่ระบบก่อนเพิ่มสินค้าลงตะกร้า');
      return;
    }

    try {
      await api.addToCart(bookId);
      await refreshCart();
      toast.success('เพิ่มสินค้าลงตะกร้าแล้ว');
    } catch (error: any) {
      console.error('Failed to add to cart:', error);
      toast.error(error.message || 'ไม่สามารถเพิ่มสินค้าลงตะกร้าได้');
    }
  };

  const removeFromCart = async (bookId: number) => {
    try {
      await api.removeFromCart(bookId);
      await refreshCart();
      toast.success('ลบสินค้าออกจากตะกร้าแล้ว');
    } catch (error: any) {
      console.error('Failed to remove from cart:', error);
      toast.error(error.message || 'ไม่สามารถลบสินค้าออกจากตะกร้าได้');
    }
  };

  const clearCart = async () => {
    try {
      await api.clearCart();
      setItems([]);
      toast.success('ล้างตะกร้าสินค้าแล้ว');
    } catch (error: any) {
      console.error('Failed to clear cart:', error);
      toast.error(error.message || 'ไม่สามารถล้างตะกร้าสินค้าได้');
    }
  };

  const value: CartContextType = {
    items,
    isLoading,
    totalItems,
    totalAmount,
    addToCart,
    removeFromCart,
    clearCart,
    refreshCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};