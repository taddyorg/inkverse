import { secureSet, secureGet, secureDeleteMultiple } from '../storage/secure';
import { asyncSetObject, asyncGetObject, asyncDeleteMultiple } from '../storage/async';
import type { StorageFunctions } from '@inkverse/shared-client/dispatch/authentication';
import { syncStorageGet, syncStorageSet, syncStorageDelete } from '../storage/sync';
import { User } from '@inkverse/shared-client/graphql/types';

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
 * Retrieve the access token from secure storage
 */
export async function getAccessToken(): Promise<string | null> {
  return secureGet(ACCESS_TOKEN_KEY);
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
  return secureGet(REFRESH_TOKEN_KEY);
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