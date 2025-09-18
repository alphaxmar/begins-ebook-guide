import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, getAuthToken, setAuthToken, removeAuthToken, User } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  login: (emailOrToken: string, password?: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Load user profile on mount if token exists
  useEffect(() => {
    const loadUser = async () => {
      const token = getAuthToken();
      if (token) {
        try {
          const response = await api.getProfile();
          setUser(response.user);
        } catch (error) {
          console.error('Failed to load user profile:', error);
          removeAuthToken();
        }
      }
      setIsLoading(false);
    };

    loadUser();
  }, []);

  const login = async (emailOrToken: string, password?: string) => {
    try {
      // If password is provided, it's email/password login
      if (password) {
        const response = await api.login({ email: emailOrToken, password });
        setAuthToken(response.token);
        setUser(response.user);
      } else {
        // If no password, it's token-based login (from social/phone login)
        const token = emailOrToken;
        setAuthToken(token);
        const response = await api.getProfile();
        setUser(response.user);
      }
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: 'user' | 'seller';
  }) => {
    try {
      const response = await api.register(data);
      setAuthToken(response.token);
      setUser(response.user);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    removeAuthToken();
    setUser(null);
  };

  const updateProfile = async (data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  }) => {
    try {
      const response = await api.updateProfile(data);
      setUser(response.user);
    } catch (error) {
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};