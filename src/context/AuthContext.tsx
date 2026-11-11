/**
 * Authentication Context
 *
 * Provides authentication state to the entire app
 * Handles login, logout, and auto-verification on mount
 */

import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { adminApi } from '../services/adminApi';
import { clearToken, hasToken } from '../utils/storage';

export interface AuthContextType {
  isAuthenticated: boolean;
  user: { id: string; email: string } | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Verify authentication status on component mount
   */
  const verifyAuth = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    if (!hasToken()) {
      setIsAuthenticated(false);
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const userInfo = await adminApi.getCurrentUser();
      setUser(userInfo);
      setIsAuthenticated(true);
    } catch (err) {
      setIsAuthenticated(false);
      setUser(null);
      clearToken();
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Auto-check auth on mount
   */
  useEffect(() => {
    verifyAuth();
  }, [verifyAuth]);

  /**
   * Handle login
   */
  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await adminApi.login(email, password);
      const userInfo = await adminApi.getCurrentUser();
      setUser(userInfo);
      setIsAuthenticated(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      setIsAuthenticated(false);
      setUser(null);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Handle logout
   */
  const logout = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await adminApi.logout();
    } catch (err) {
      console.warn('Logout error:', err);
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: AuthContextType = {
    isAuthenticated,
    user,
    isLoading,
    error,
    login,
    logout,
    checkAuth: verifyAuth,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
