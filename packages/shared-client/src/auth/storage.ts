/**
 * Authentication token storage for Inkverse
 * 
 * Provides simple storage abstraction for auth tokens
 * that works across platforms (web & mobile)
 */

// Storage keys
const ACCESS_TOKEN_KEY = 'inkverse_access_token';
const REFRESH_TOKEN_KEY = 'inkverse_refresh_token';

/**
 * Store access token
 */
export const setAccessToken = async (token: string): Promise<void> => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  }
  // Mobile implementation would use AsyncStorage or SecureStore
};

/**
 * Retrieve access token
 */
export const getAccessToken = async (): Promise<string | null> => {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }
  return null;
  // Mobile implementation would use AsyncStorage or SecureStore
};

/**
 * Store refresh token
 */
export const setRefreshToken = async (token: string): Promise<void> => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  }
  // Mobile implementation would use AsyncStorage or SecureStore
};

/**
 * Retrieve refresh token
 */
export const getRefreshToken = async (): Promise<string | null> => {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }
  return null;
  // Mobile implementation would use AsyncStorage or SecureStore
};

/**
 * Clear all authentication tokens
 */
export const clearTokens = async (): Promise<void> => {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
  // Mobile implementation would use AsyncStorage or SecureStore
};