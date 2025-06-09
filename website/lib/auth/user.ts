import config from '@/config';
import { localStorageSet, localStorageGet, localStorageSetObject, localStorageGetObject, localStorageDeleteMultiple, localStorageDelete } from '../storage/local';
import type { StorageFunctions } from '@inkverse/shared-client/dispatch/utils';
import type { User } from '@inkverse/shared-client/graphql/operations';
import { dispatchRefreshAccessToken, dispatchRefreshRefreshToken } from '@inkverse/shared-client/dispatch/authentication';
import { isTokenExpired } from './utils';

// Key constants
const ACCESS_TOKEN_KEY = 'inkverse-access-token';
const USER_DETAILS_KEY = 'inkverse-user-details';

/**
 * Save the access token to localStorage
 */
export function saveAccessToken(token: string): void {
  localStorageSet(ACCESS_TOKEN_KEY, token);
}

/**
 * Save the refresh token to HTTP-only cookie
 * Note: This function is a placeholder since cookies must be set via server response headers
 * The actual cookie setting happens in the action/loader response
 */
export function saveRefreshToken(token: string): void {
  // HTTP-only cookies cannot be set from client-side JavaScript
  // This is handled by the server response
  console.warn('Refresh token will be set via HTTP-only cookie in server response');
}

/**
 * Retrieve the access token from localStorage
 */
export async function getAccessToken(): Promise<string | null> {
  try {
    const accessToken = localStorageGet(ACCESS_TOKEN_KEY);
    if (!accessToken) {
      console.log('Access token not found, attempting to refresh');
      return await refreshAccessToken();
    }

    if (isTokenExpired(accessToken)) {
      console.warn('Access token expired, attempting to refresh');
      return await refreshAccessToken();
    }

    return accessToken;
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
}

/**
 * Save user details to localStorage
 */
export function saveUserDetails(user: User): void {
  localStorageSetObject(USER_DETAILS_KEY, user);
}

/**
 * Retrieve user details from localStorage
 */
export function getUserDetails(): Partial<User> | null {
  return localStorageGetObject(USER_DETAILS_KEY);
}

/**
 * Clear all authentication data
 */
export function clearAuthData(): void {
  // Clear access token and user details from localStorage
  localStorageDeleteMultiple([ACCESS_TOKEN_KEY, USER_DETAILS_KEY]);

  // Note: Refresh token cookie must be cleared via server response
  // This is typically done by setting the cookie with maxAge: 0
}

/**
 * Check if user is authenticated (has access token)
 */
export function isAuthenticated(): boolean {
  return getUserDetails() !== null;
}

/**
 * Refresh the access token using the refresh token stored in HTTP-only cookie
 */
export async function refreshAccessToken(): Promise<string | null> {
  try {
    // Call the refresh endpoint with includeCredentials to send cookies
    const newAccessToken = await dispatchRefreshAccessToken({
      baseUrl: config.AUTH_URL,
      includeCredentials: true, // This will send the cookie
    });

    if (newAccessToken) {
      // Save the new access token to localStorage
      saveAccessToken(newAccessToken);
      return newAccessToken;
    }

    // Clear invalid token from storage
    clearAuthData();
    return null;
  } catch (error) {
    console.error('Failed to refresh access token:', error);
    return null;
  }
}

/**
 * Refresh the refresh token using the current refresh token stored in HTTP-only cookie
 */
export async function refreshRefreshToken(): Promise<string | null> {
  try {
    // Call the refresh endpoint with includeCredentials to send cookies
    const newRefreshToken = await dispatchRefreshRefreshToken({
      baseUrl: config.AUTH_URL,
      includeCredentials: true, // This will send the cookie
    });   

    if (newRefreshToken) {
      // Save the new refresh token via HTTP-only cookie (server-side)
      saveRefreshToken(newRefreshToken);
      return newRefreshToken;
    }

    // Only clear auth data when we get null response (likely 401/403)
    // Network errors will throw and be caught below
    return null;
  } catch (error) {
    console.error('Failed to refresh refresh token:', error);
    // Don't clear auth data on network errors - let the user retry
    return null;
  }
}

/**
 * Storage functions implementation for website
 * that follows the StorageFunctions interface
 */
export const webStorageFunctions: StorageFunctions = {
  saveAccessToken,
  saveRefreshToken,
  saveUserDetails
};