/**
 * Admin API client for authentication and user management
 *
 * Handles all admin-related API calls with proper error handling
 * and authorization header management
 */

import { getToken, setToken, clearToken } from '../utils/storage';

const API_BASE = '/api'; // Adjust based on your backend URL

interface LoginResponse {
  access_token: string;
  token_type: string;
}

interface UserInfo {
  id: string;
  email: string;
}

class AdminApiClient {
  /**
   * Make authenticated API request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...Object.fromEntries(
        Object.entries(options.headers || {}).map(([key, value]) => [key, String(value)])
      ),
    };

    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle 401 Unauthorized - clear auth state
      if (response.status === 401 || response.status === 403) {
        clearToken();
        throw new Error('Unauthorized - please log in again');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.detail || errorData.message || `Request failed with status ${response.status}`;
        throw new Error(errorMessage);
      }

      if (response.status === 204) {
        return undefined as T;
      }

      return await response.json();
    } catch (error) {
      // Preserve network errors and auth errors
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred');
    }
  }

  /**
   * Login with email and password
   * Returns JWT token for authenticated requests
   */
  async login(email: string, password: string): Promise<{ token: string }> {
    try {
      const response = await this.request<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (response.access_token) {
        setToken(response.access_token);
      }

      return { token: response.access_token };
    } catch (error) {
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        throw new Error('Invalid credentials');
      }
      throw error;
    }
  }

  /**
   * Logout and clear authentication token
   */
  async logout(): Promise<void> {
    try {
      await this.request<void>('/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      // Even if logout fails, clear local token
      console.warn('Logout request failed:', error);
    } finally {
      clearToken();
    }
  }

  /**
   * Get current authenticated user info
   */
  async getCurrentUser(): Promise<UserInfo> {
    return await this.request<UserInfo>('/auth/me', {
      method: 'GET',
    });
  }

  /**
   * Check if user is authenticated
   * Makes a request to verify token validity
   */
  async checkAuth(): Promise<boolean> {
    if (!getToken()) {
      return false;
    }

    try {
      await this.getCurrentUser();
      return true;
    } catch (error) {
      clearToken();
      return false;
    }
  }
}

export const adminApi = new AdminApiClient();
