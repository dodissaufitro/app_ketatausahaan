import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'superadmin' | 'admin' | 'user';
  userRoleId?: string;
  userRoleName?: string;
  permissions: string[];
  isActive: boolean;
  avatar?: string;
  employee?: {
    name: string;
    position: string;
  } | null;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Get CSRF token from meta tag
const getCsrfToken = () => {
  const meta = document.querySelector('meta[name="csrf-token"]');
  return meta ? meta.getAttribute('content') : '';
};

// Setup axios defaults
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.withCredentials = true;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Check for existing session from backend
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await axios.get('/api/user');
      if (response.data.user) {
        setUser(response.data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.log('Not authenticated');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await axios.post('/login', {
        email,
        password,
      }, {
        headers: {
          'X-CSRF-TOKEN': getCsrfToken(),
          'Accept': 'application/json',
        },
      });

      if (response.data.user) {
        setUser(response.data.user);
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await axios.post('/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  const refreshUser = async () => {
    setIsRefreshing(true);
    try {
      const response = await axios.get('/api/user');
      if (response.data.user) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.log('Refresh failed');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, isRefreshing, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
