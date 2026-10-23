import type { SearchQuery, User } from "../graphql/operations";
import { MAX_SEARCH_PAGE } from "@inkverse/public/search";

export function mergeItemsWithUuid<T extends { uuid: string }>(existingItems: T[], newItems: T[]): T[] {
  const existingUuids = new Set(existingItems.map(item => item.uuid));
  const uniqueNewItems = newItems.filter(item => !existingUuids.has(item.uuid));
  return [...existingItems, ...uniqueNewItems];
}

/**
 * Pagination details for comic series search results.
 * hasMore stops at Taddy's last page, and never goes past MAX_SEARCH_PAGE.
 */
export function getSearchPagination(data: SearchQuery, page: number): { hasMore: boolean; totalCount: number } {
  const responseDetails = data.search?.responseDetails?.find((details) => details?.type === 'COMICSERIES');
  const totalCount = responseDetails?.totalCount ?? 0;
  const pagesCount = responseDetails?.pagesCount ?? 0;
  return { hasMore: page < Math.min(pagesCount, MAX_SEARCH_PAGE), totalCount };
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
