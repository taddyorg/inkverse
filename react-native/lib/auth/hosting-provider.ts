import { getNewAccessToken, getNewContentToken, getNewRefreshToken } from '@inkverse/public/hosting-providers';
import { asyncSet, asyncGet, asyncDeleteMultiple, asyncDelete } from '../storage/async';
import { secureSet, secureGet, secureDeleteMultiple, secureDelete } from '../storage/secure';
import { doesTokenContainPaidItems, isTokenExpired } from './utils';
import { syncStorageGet, syncStorageSet } from '../storage/sync';

// Key constants
const HOSTING_PROVIDER_ACCESS_TOKEN_ENDING = 'access-token';
const HOSTING_PROVIDER_REFRESH_TOKEN_ENDING = 'refresh-token';
export const HOSTING_PROVIDER_UUIDS_KEY = 'hosting-provider-uuids';
const contentTokenForProviderAndSeries: Record<string, string> = {};

/**
 * Get all connected hosting provider UUIDs
 */
export function getConnectedHostingProviderUuids(): string[] {
  const uuids = syncStorageGet(HOSTING_PROVIDER_UUIDS_KEY);
  if (!uuids) return [];
  try {
    const uuidArray = JSON.parse(uuids);
    return uuidArray;
  } catch {
    return [];
  }
}

/**
 * Get the set of hosting provider UUIDs from AsyncStorage
 */
async function getHostingProviderUuids(): Promise<Set<string>> {
  const uuids = await asyncGet(HOSTING_PROVIDER_UUIDS_KEY);
  if (!uuids) return new Set();
  try {
    const uuidArray = JSON.parse(uuids);
    return new Set(uuidArray);
  } catch {
    return new Set();
  }
}

/**
 * Save the set of hosting provider UUIDs to AsyncStorage
 */
async function saveHostingProviderUuids(uuidSet: Set<string>): Promise<void> {
  syncStorageSet(HOSTING_PROVIDER_UUIDS_KEY, JSON.stringify(Array.from(uuidSet)));
  await asyncSet(HOSTING_PROVIDER_UUIDS_KEY, JSON.stringify(Array.from(uuidSet)));
}

/**
 * Add a hosting provider UUID to the set in AsyncStorage
 */
async function addHostingProviderUuid(hostingProviderUuid: string): Promise<void> {
  const currentUuids = await getHostingProviderUuids();
  currentUuids.add(hostingProviderUuid);
  await saveHostingProviderUuids(currentUuids);
}

/**
 * Remove a hosting provider UUID from the set in AsyncStorage
 */
async function removeHostingProviderUuid(hostingProviderUuid: string): Promise<void> {
  const currentUuids = await getHostingProviderUuids();
  if (currentUuids.delete(hostingProviderUuid)) {
    await saveHostingProviderUuids(currentUuids);
  }
}

/**
 * Save the hosting provider access token to SecureStore
 */
export async function saveHostingProviderAccessToken(token: string, hostingProviderUuid: string): Promise<void> {
  await secureSet(`${hostingProviderUuid}_${HOSTING_PROVIDER_ACCESS_TOKEN_ENDING}`, token);
}

/**
 * Save the hosting provider refresh token to SecureStore and track the UUID
 */
export async function saveHostingProviderRefreshToken(token: string, hostingProviderUuid: string): Promise<void> {
  await secureSet(`${hostingProviderUuid}_${HOSTING_PROVIDER_REFRESH_TOKEN_ENDING}`, token);
  await addHostingProviderUuid(hostingProviderUuid);
}

export function saveContentTokenForProviderAndSeries(token: string, hostingProviderUuid: string, seriesUuid: string): void {
  if (!doesTokenContainPaidItems(token)) return;

  contentTokenForProviderAndSeries[`${hostingProviderUuid}_${seriesUuid}`] = token;
}

/**
 * Retrieve the hosting provider access token from SecureStore
 */
export async function getHostingProviderAccessToken(hostingProviderUuid: string): Promise<string | null> {
  const accessToken = await secureGet(`${hostingProviderUuid}_${HOSTING_PROVIDER_ACCESS_TOKEN_ENDING}`);
  if (!accessToken) {
    return await refreshHostingProviderAccessToken(hostingProviderUuid);
  }

  if (isTokenExpired(accessToken)) {
    await secureDelete(`${hostingProviderUuid}_${HOSTING_PROVIDER_ACCESS_TOKEN_ENDING}`);
    return await refreshHostingProviderAccessToken(hostingProviderUuid);
  }

  return accessToken;
}

export async function getHostingProviderRefreshToken(hostingProviderUuid: string): Promise<string | null> {
  const refreshToken = await secureGet(`${hostingProviderUuid}_${HOSTING_PROVIDER_REFRESH_TOKEN_ENDING}`);
  if (!refreshToken) {
    return null;
  }

  if (isTokenExpired(refreshToken)) {
    await clearHostingProviderAuthData(hostingProviderUuid);
    return null;
  }

  return refreshToken;
}

export async function getContentTokenForProviderAndSeries(hostingProviderUuid: string, seriesUuid: string): Promise<string | null> {
  const contentToken = contentTokenForProviderAndSeries[`${hostingProviderUuid}_${seriesUuid}`];
  if (!contentToken) {
    return await refreshContentTokenForProviderAndSeries(hostingProviderUuid, seriesUuid);
  }

  if (isTokenExpired(contentToken)) {
    delete contentTokenForProviderAndSeries[`${hostingProviderUuid}_${seriesUuid}`];
    return await refreshContentTokenForProviderAndSeries(hostingProviderUuid, seriesUuid);
  }

  return contentToken;
}

export async function getNewHostingProviderRefreshToken(hostingProviderUuid: string): Promise<string | null> {
  const refreshToken = await secureGet(`${hostingProviderUuid}_${HOSTING_PROVIDER_REFRESH_TOKEN_ENDING}`);
  if (!refreshToken) return null;

  if (isTokenExpired(refreshToken)) {
    await clearHostingProviderAuthData(hostingProviderUuid);
    return null;
  }

  const newRefreshToken = await getNewRefreshToken({
    hostingProviderUuid,
    refreshToken,
  });

  if (!newRefreshToken) {
    await clearHostingProviderAuthData(hostingProviderUuid);
    return null;
  }

  await saveHostingProviderRefreshToken(newRefreshToken, hostingProviderUuid);
  return newRefreshToken as string;
}

export async function refreshHostingProviderAccessToken(hostingProviderUuid: string): Promise<string | null> {
  const refreshToken = await getHostingProviderRefreshToken(hostingProviderUuid);
  if (!refreshToken) return null;

  const newAccessToken = await getNewAccessToken({
    hostingProviderUuid,
    refreshToken,
  });

  if (!newAccessToken) {
    await secureDelete(`${hostingProviderUuid}_${HOSTING_PROVIDER_ACCESS_TOKEN_ENDING}`);
    return null;
  }

  await saveHostingProviderAccessToken(newAccessToken, hostingProviderUuid);
  return newAccessToken as string;
}

async function refreshContentTokenForProviderAndSeries(hostingProviderUuid: string, seriesUuid: string): Promise<string | null> {
  const accessToken = await getHostingProviderAccessToken(hostingProviderUuid);
  if (!accessToken) return null;

  const contentToken = await getNewContentToken({
    hostingProviderUuid,
    accessToken,
    seriesUuid,
  });

  if (!contentToken) {
    delete contentTokenForProviderAndSeries[`${hostingProviderUuid}_${seriesUuid}`];
    return null;
  }

  saveContentTokenForProviderAndSeries(contentToken, hostingProviderUuid, seriesUuid);
  return contentToken as string;
}

/**
 * Clear all hosting provider authentication data
 */
export async function clearHostingProviderAuthData(hostingProviderUuid: string): Promise<void> {
  // Clear access token and refresh token from SecureStore
  await secureDeleteMultiple([
    `${hostingProviderUuid}_${HOSTING_PROVIDER_ACCESS_TOKEN_ENDING}`, 
    `${hostingProviderUuid}_${HOSTING_PROVIDER_REFRESH_TOKEN_ENDING}`
  ]);
  // Remove the UUID from the tracked list
  await removeHostingProviderUuid(hostingProviderUuid);
}

export function flushContentTokenForProviderAndSeries(): void {
  Object.keys(contentTokenForProviderAndSeries).forEach(key => {
    delete contentTokenForProviderAndSeries[key];
  });
}

/**
 * Storage functions implementation for hosting provider authentication
 * that follows the StorageFunctions interface
 */
export const hostingProviderStorageFunctions = {
  saveHostingProviderRefreshToken,
};