import { localStorageSet, localStorageGet, localStorageSetObject, localStorageGetObject, localStorageDeleteMultiple, localStorageDelete } from '../storage/local';
import type { StorageFunctions } from '@inkverse/shared-client/dispatch/authentication';
import { jwtDecode } from 'jwt-decode';
import type { User } from '@inkverse/shared-client/graphql/types';

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
export function getAccessToken(): string | null {
  const accessToken = localStorageGet(ACCESS_TOKEN_KEY);
  if (!accessToken) return null;

  const decodedToken = jwtDecode(accessToken);
  if (!decodedToken || !decodedToken.exp) return null;

  const isNotExpired = decodedToken.exp > Date.now() / 1000;
  if (!isNotExpired) {
    console.log('access token expired!!!');
  }
  return accessToken;
}

/**
 * Save user details to localStorage
 */
export function saveUserDetails(user: any): void {
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
 * Storage functions implementation for website
 * that follows the StorageFunctions interface
 */
export const webStorageFunctions: StorageFunctions = {
  saveAccessToken,
  saveRefreshToken,
  saveUserDetails
};