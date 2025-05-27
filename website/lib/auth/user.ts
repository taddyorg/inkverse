import config from '@/config';
import { localStorageSet, localStorageGet, localStorageSetObject, localStorageGetObject, localStorageDeleteMultiple, localStorageDelete } from '../storage/local';
import type { StorageFunctions } from '@inkverse/shared-client/dispatch/utils';
import { jwtDecode } from 'jwt-decode';
import type { User } from '@inkverse/shared-client/graphql/types';
import { dispatchRefreshAccessToken, dispatchRefreshRefreshToken } from '@inkverse/shared-client/dispatch/authentication';

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

    const decodedToken = jwtDecode(accessToken);
    if (!decodedToken || !decodedToken.exp) {
      console.warn('Invalid token format, attempting to refresh');
      // Clear invalid token from storage
      localStorageDelete(ACCESS_TOKEN_KEY);
      return await refreshAccessToken();
    }

    // Check if token is expired (exp time is LESS than current time)
    const isExpired = decodedToken.exp < (Date.now() / 1000);
    if (isExpired) {
      console.log('Access token expired, attempting to refresh');
      // Clear expired token from storage
      localStorageDelete(ACCESS_TOKEN_KEY);
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

    return null;
  } catch (error) {
    console.error('Failed to refresh access token:', error);
    return null;
  }
}

/**
 * Refresh the access token using the refresh token stored in HTTP-only cookie
 */
export async function refreshRefreshToken(): Promise<string | null> {
  try {
    // Call the refresh endpoint with includeCredentials to send cookies
    const newRefreshToken = await dispatchRefreshRefreshToken({
      baseUrl: config.AUTH_URL,
      includeCredentials: true, // This will send the cookie
    });   

    if (newRefreshToken) {
      // Save the new access token to localStorage
      saveRefreshToken(newRefreshToken);
      return newRefreshToken;
    }

    return null;
  } catch (error) {
    console.error('Failed to refresh access token:', error);
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