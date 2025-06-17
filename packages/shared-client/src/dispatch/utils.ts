import type { User } from "../graphql/operations";

export function mergeItemsWithUuid<T extends { uuid: string }>(existingItems: T[], newItems: T[]): T[] {
  const existingUuids = new Set(existingItems.map(item => item.uuid));
  const uniqueNewItems = newItems.filter(item => !existingUuids.has(item.uuid));
  return [...existingItems, ...uniqueNewItems];
}

/**
 * Interface for token storage functions that will be passed to authentication methods
 * Each client (web, mobile) can implement these differently based on their storage mechanism
 */
export interface StorageFunctions {
  /** Function to save the access token (e.g., to localStorage, SecureStore, etc.) */
  saveAccessToken: (token: string) => Promise<void> | void;
  /** Function to save the refresh token */
  saveRefreshToken: (token: string) => Promise<void> | void;
  /** Function to save only essential user details */
  saveUserDetails: (user: Pick<User, 'id' | 'isEmailVerified' | 'username'>) => Promise<void> | void;
}
