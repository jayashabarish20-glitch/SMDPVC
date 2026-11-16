/**
 * React hook for authentication state management
 *
 * Provides authentication state, methods for login/logout,
 * and auto-verification of auth status on mount
 *
 * Usage:
 * const { isAuthenticated, user, isLoading, error, login, logout } = useAuth();
 */

import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { adminApi } from '../services/adminApi';
import { getToken, clearToken } from '../utils/storage';

export interface AuthState {
  isAuthenticated: boolean;
  user: { id: string; email: string } | null;
  isLoading: boolean;
  error: string | null;
}

export interface UseAuthReturn extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

/**
 * useAuth hook for authentication state and methods
 */
export function useAuth(): UseAuthReturn {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

/**
 * Standalone authentication functions for non-hook usage
 */

export async function loginUser(email: string, password: string): Promise<void> {
  try {
    await adminApi.login(email, password);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Login failed');
    }
    throw new Error('Login failed');
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await adminApi.logout();
  } catch (error) {
    console.warn('Logout error:', error);
    clearToken();
  }
}

export async function verifyAuth(): Promise<boolean> {
  if (!getToken()) {
    return false;
  }

  try {
    return await adminApi.checkAuth();
  } catch (error) {
    return false;
  }
}
