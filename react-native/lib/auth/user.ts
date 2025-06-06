import { secureSet, secureGet, secureDeleteMultiple } from '../storage/secure';
import { asyncSetObject, asyncGetObject, asyncDeleteMultiple } from '../storage/async';
import type { StorageFunctions } from '@inkverse/shared-client/dispatch/utils';
import { syncStorageGet, syncStorageSet, syncStorageDelete } from '../storage/sync';
import { User } from '@inkverse/shared-client/graphql/operations';
import { jwtDecode } from 'jwt-decode';

// Key constants
export const ACCESS_TOKEN_KEY = 'inkverse-access-token';
export const USER_DETAILS_KEY = 'inkverse-user-details';
export const REFRESH_TOKEN_KEY = 'inkverse-refresh-token';

/**
 * Save the access token to secure storage
 */
export async function saveAccessToken(token: string): Promise<void> {
  await secureSet(ACCESS_TOKEN_KEY, token);
}

/**
 * Retrieve the access token from secure storage, if you can't get it, try to get the refresh token and use that
 */
export async function getAccessToken(): Promise<string | null> {
  const token = await secureGet(ACCESS_TOKEN_KEY);
  if (!token) { return await getRefreshToken(); }

  const decoded = jwtDecode(token);
  if (decoded.exp && decoded.exp < Date.now() / 1000) {
    return await getRefreshToken();
  }

  return token;
}

/**
 * Save the refresh token to secure storage
 */
export async function saveRefreshToken(token: string): Promise<void> {
  await secureSet(REFRESH_TOKEN_KEY, token);
}

/**
 * Retrieve the refresh token from secure storage
 */
export async function getRefreshToken(): Promise<string | null> {
  const token = await secureGet(REFRESH_TOKEN_KEY);
  if (!token) { return null; }

  const decoded = jwtDecode(token);
  if (decoded.exp && decoded.exp < Date.now() / 1000) {
    return null;
  }

  return token;
}

/**
 * Save user details
 */
export async function saveUserDetails(user: any): Promise<void> {
  await asyncSetObject(USER_DETAILS_KEY, user);
  syncStorageSet(USER_DETAILS_KEY, user);
}

/**
 * Retrieve user details from AsyncStorage
 */
export async function getAsyncUserDetails(): Promise<Partial<User> | null> {
  return asyncGetObject<Partial<User>>(USER_DETAILS_KEY);
}

/**
 * Retrieve user details from SyncStorage
 */
export function getUserDetails(): Partial<User> | null {
  return syncStorageGet(USER_DETAILS_KEY);  
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getUserDetails() !== null;
}

/**
 * Clear all authentication data
 */
export async function clearUserData(): Promise<void> {
  // Clear tokens from secure storage
  await secureDeleteMultiple([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
  
  // Clear user details from AsyncStorage
  await asyncDeleteMultiple([USER_DETAILS_KEY]);

  // Clear user details from SyncStorage
  syncStorageDelete(USER_DETAILS_KEY);
}

/**
 * Storage functions implementation for React Native 
 * that follows the StorageFunctions interface
 */
export const mobileStorageFunctions: StorageFunctions = {
  saveAccessToken,
  saveRefreshToken,
  saveUserDetails
};