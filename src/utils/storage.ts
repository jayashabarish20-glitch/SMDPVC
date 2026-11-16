/**
 * Secure storage utilities for authentication tokens
 * Uses in-memory storage with optional HttpOnly cookie support
 *
 * IMPORTANT: Never use localStorage for sensitive auth tokens
 * This module stores tokens in memory during the session
 */

let authToken: string | null = null;

/**
 * Get the stored authentication token
 */
export function getToken(): string | null {
  return authToken;
}

/**
 * Store the authentication token in memory
 * In production, coordinate with backend for HttpOnly cookie support
 */
export function setToken(token: string): void {
  authToken = token;
}

/**
 * Clear the stored authentication token
 */
export function clearToken(): void {
  authToken = null;
}

/**
 * Check if a valid token exists
 */
export function hasToken(): boolean {
  return authToken !== null && authToken.length > 0;
}
