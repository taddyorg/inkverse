import { getNewAccessToken, getNewContentToken, getNewRefreshToken } from '@inkverse/public/hosting-providers';
import { asyncSet, asyncGet, asyncDeleteMultiple, asyncDelete } from '../storage/async';
import { secureSet, secureGet, secureDeleteMultiple, secureDelete } from '../storage/secure';
import { isTokenExpired } from './utils';

// Key constants
const HOSTING_PROVIDER_ACCESS_TOKEN_ENDING = 'access-token';
const HOSTING_PROVIDER_REFRESH_TOKEN_ENDING = 'refresh-token';
const HOSTING_PROVIDER_UUIDS_KEY = 'hosting-provider-uuids';
const contentTokenForProviderAndSeries: Record<string, string> = {};

/**
 * Get all connected hosting provider UUIDs
 */
export async function getConnectedHostingProviderUuids(): Promise<string[]> {
  return Array.from(await getHostingProviderUuids());
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
  await secureSet(`${hostingProviderUuid}:${HOSTING_PROVIDER_ACCESS_TOKEN_ENDING}`, token);
}

/**
 * Save the hosting provider refresh token to SecureStore and track the UUID
 */
export async function saveHostingProviderRefreshToken(token: string, hostingProviderUuid: string): Promise<void> {
  await secureSet(`${hostingProviderUuid}:${HOSTING_PROVIDER_REFRESH_TOKEN_ENDING}`, token);
  await addHostingProviderUuid(hostingProviderUuid);
}

export function saveContentTokenForProviderAndSeries(token: string, hostingProviderUuid: string, seriesUuid: string): void {
  contentTokenForProviderAndSeries[`${hostingProviderUuid}:${seriesUuid}`] = token;
}

/**
 * Retrieve the hosting provider access token from SecureStore
 */
export async function getHostingProviderAccessToken(hostingProviderUuid: string): Promise<string | null> {
  const accessToken = await secureGet(`${hostingProviderUuid}:${HOSTING_PROVIDER_ACCESS_TOKEN_ENDING}`);
  if (!accessToken) {
    return await refreshHostingProviderAccessToken(hostingProviderUuid);
  }

  if (isTokenExpired(accessToken)) {
    await secureDelete(`${hostingProviderUuid}:${HOSTING_PROVIDER_ACCESS_TOKEN_ENDING}`);
    return await refreshHostingProviderAccessToken(hostingProviderUuid);
  }

  return accessToken;
}

export async function getHostingProviderRefreshToken(hostingProviderUuid: string): Promise<string | null> {
  const refreshToken = await secureGet(`${hostingProviderUuid}:${HOSTING_PROVIDER_REFRESH_TOKEN_ENDING}`);
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
  const contentToken = contentTokenForProviderAndSeries[`${hostingProviderUuid}:${seriesUuid}`];
  if (!contentToken) {
    return await refreshContentTokenForProviderAndSeries(hostingProviderUuid, seriesUuid);
  }

  if (isTokenExpired(contentToken)) {
    delete contentTokenForProviderAndSeries[`${hostingProviderUuid}:${seriesUuid}`];
    return await refreshContentTokenForProviderAndSeries(hostingProviderUuid, seriesUuid);
  }

  return contentToken;
}

export async function getNewHostingProviderRefreshToken(hostingProviderUuid: string): Promise<string | null> {
  const refreshToken = await secureGet(`${hostingProviderUuid}:${HOSTING_PROVIDER_REFRESH_TOKEN_ENDING}`);
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
    await secureDelete(`${hostingProviderUuid}:${HOSTING_PROVIDER_ACCESS_TOKEN_ENDING}`);
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
    delete contentTokenForProviderAndSeries[`${hostingProviderUuid}:${seriesUuid}`];
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
    `${hostingProviderUuid}:${HOSTING_PROVIDER_ACCESS_TOKEN_ENDING}`, 
    `${hostingProviderUuid}:${HOSTING_PROVIDER_REFRESH_TOKEN_ENDING}`
  ]);
  // Remove the UUID from the tracked list
  await removeHostingProviderUuid(hostingProviderUuid);
}

/**
 * Storage functions implementation for hosting provider authentication
 * that follows the StorageFunctions interface
 */
export const hostingProviderStorageFunctions = {
  saveHostingProviderRefreshToken,
};