import { getNewAccessToken, getNewContentToken, getNewRefreshToken } from '@inkverse/public/hosting-providers';
import { localStorageSet, localStorageGet, localStorageDeleteMultiple, localStorageDelete } from '../storage/local';
import { jwtDecode } from 'jwt-decode';

// Key constants
const HOSTING_PROVIDER_ACCESS_TOKEN_ENDING = 'access-token';
const HOSTING_PROVIDER_REFRESH_TOKEN_ENDING = 'refresh-token';
const HOSTING_PROVIDER_UUIDS_KEY = 'hosting-provider-uuids';
const contentTokenForProviderAndSeries: Record<string, string> = {};

/**
 * Get all connected hosting provider UUIDs
 */
export function getConnectedHostingProviderUuids(): string[] {
  return Array.from(getHostingProviderUuids());
}

/**
 * Get the set of hosting provider UUIDs from localStorage
 */
function getHostingProviderUuids(): Set<string> {
  const uuids = localStorageGet(HOSTING_PROVIDER_UUIDS_KEY);
  if (!uuids) return new Set();
  try {
    const uuidArray = JSON.parse(uuids);
    return new Set(uuidArray);
  } catch {
    return new Set();
  }
}

/**
 * Save the set of hosting provider UUIDs to localStorage
 */
function saveHostingProviderUuids(uuidSet: Set<string>): void {
  localStorageSet(HOSTING_PROVIDER_UUIDS_KEY, JSON.stringify(Array.from(uuidSet)));
}

/**
 * Add a hosting provider UUID to the set in localStorage
 */
function addHostingProviderUuid(hostingProviderUuid: string): void {
  const currentUuids = getHostingProviderUuids();
  currentUuids.add(hostingProviderUuid);
  saveHostingProviderUuids(currentUuids);
}

/**
 * Remove a hosting provider UUID from the set in localStorage
 */
function removeHostingProviderUuid(hostingProviderUuid: string): void {
  const currentUuids = getHostingProviderUuids();
  if (currentUuids.delete(hostingProviderUuid)) {
    saveHostingProviderUuids(currentUuids);
  }
}

/**
 * Save the hosting provider access token to localStorage
 */
export function saveHostingProviderAccessToken(token: string, hostingProviderUuid: string): void {
  console.log('saveHostingProviderAccessToken', token, hostingProviderUuid);
  localStorageSet(`${hostingProviderUuid}:${HOSTING_PROVIDER_ACCESS_TOKEN_ENDING}`, token);
}

/**
 * Save the hosting provider refresh token to localStorage and track the UUID
 */
export function saveHostingProviderRefreshToken(token: string, hostingProviderUuid: string): void {
  console.log('saveHostingProviderRefreshToken', token, hostingProviderUuid);
  localStorageSet(`${hostingProviderUuid}:${HOSTING_PROVIDER_REFRESH_TOKEN_ENDING}`, token);
  addHostingProviderUuid(hostingProviderUuid);
}

export function saveContentTokenForProviderAndSeries(token: string, hostingProviderUuid: string, seriesUuid: string): void {
  contentTokenForProviderAndSeries[`${hostingProviderUuid}:${seriesUuid}`] = token;
}

/**
 * Retrieve the hosting provider access token from localStorage
 */
export async function getHostingProviderAccessToken(hostingProviderUuid: string): Promise<string | null> {
  const accessToken = localStorageGet(`${hostingProviderUuid}:${HOSTING_PROVIDER_ACCESS_TOKEN_ENDING}`);
  if (!accessToken) {
    return await refreshHostingProviderAccessToken(hostingProviderUuid);
  }

  const decodedToken = jwtDecode(accessToken);
  if (!decodedToken || !decodedToken.exp){
    localStorageDelete(`${hostingProviderUuid}:${HOSTING_PROVIDER_ACCESS_TOKEN_ENDING}`);
    return await refreshHostingProviderAccessToken(hostingProviderUuid);
  }

  const isExpired = decodedToken.exp < (Date.now() / 1000);
  if (isExpired) {
    localStorageDelete(`${hostingProviderUuid}:${HOSTING_PROVIDER_ACCESS_TOKEN_ENDING}`);
    await refreshHostingProviderAccessToken(hostingProviderUuid);
  }

  return accessToken;
}

export async function getHostingProviderRefreshToken(hostingProviderUuid: string): Promise<string | null> {
  const refreshToken = localStorageGet(`${hostingProviderUuid}:${HOSTING_PROVIDER_REFRESH_TOKEN_ENDING}`);
  if (!refreshToken) {
    return await getNewHostingProviderRefreshToken(hostingProviderUuid);
  }

  const decodedToken = jwtDecode(refreshToken);
  if (!decodedToken || !decodedToken.exp) {
    localStorageDelete(`${hostingProviderUuid}:${HOSTING_PROVIDER_REFRESH_TOKEN_ENDING}`);
    return await getNewHostingProviderRefreshToken(hostingProviderUuid);
  }

  const isExpired = decodedToken.exp < (Date.now() / 1000);
  if (isExpired) {
    clearHostingProviderAuthData(hostingProviderUuid);
    throw new Error('hosting provider refresh token expired!!!');
  }
  return refreshToken;
}

export async function getContentTokenForProviderAndSeries(hostingProviderUuid: string, seriesUuid: string): Promise<string | null> {
  const contentToken = contentTokenForProviderAndSeries[`${hostingProviderUuid}:${seriesUuid}`];
  if (!contentToken) {
    return await refreshContentTokenForProviderAndSeries(hostingProviderUuid, seriesUuid);
  }

  const decodedToken = jwtDecode(contentToken);
  if (!decodedToken || !decodedToken.exp) return null;

  const isExpired = decodedToken.exp < (Date.now() / 1000);
  if (isExpired) {
    localStorageDelete(`${hostingProviderUuid}:${HOSTING_PROVIDER_REFRESH_TOKEN_ENDING}`);
    await refreshContentTokenForProviderAndSeries(hostingProviderUuid, seriesUuid);
  }

  return contentToken;
}

export async function getNewHostingProviderRefreshToken(hostingProviderUuid: string): Promise<string | null> {
  const refreshToken = await getHostingProviderRefreshToken(hostingProviderUuid);
  if (!refreshToken) return null;

  const newRefreshToken = await getNewRefreshToken({
    hostingProviderUuid,
    refreshToken,
  });

  if (!newRefreshToken) return null;

  saveHostingProviderRefreshToken(newRefreshToken, hostingProviderUuid);
  return newRefreshToken as string;
}

export async function refreshHostingProviderAccessToken(hostingProviderUuid: string): Promise<string | null> {
  const refreshToken = await getHostingProviderRefreshToken(hostingProviderUuid);
  if (!refreshToken) return null;

  const newAccessToken = await getNewAccessToken({
    hostingProviderUuid,
    refreshToken,
  });

  if (!newAccessToken) return null;

  saveHostingProviderAccessToken(newAccessToken, hostingProviderUuid);
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

  if (!contentToken) return null;

  saveContentTokenForProviderAndSeries(contentToken, hostingProviderUuid, seriesUuid);
  return contentToken as string;
}


/**
 * Clear all hosting provider authentication data
 */
export function clearHostingProviderAuthData(hostingProviderUuid: string): void {
  // Clear access token and hosting provider details from localStorage
  localStorageDeleteMultiple([`${hostingProviderUuid}:${HOSTING_PROVIDER_ACCESS_TOKEN_ENDING}`, `${hostingProviderUuid}:${HOSTING_PROVIDER_REFRESH_TOKEN_ENDING}`]);
  // Remove the UUID from the tracked list
  removeHostingProviderUuid(hostingProviderUuid);
}

/**
 * Storage functions implementation for hosting provider authentication
 * that follows the StorageFunctions interface
 */
export const hostingProviderStorageFunctions = {
  saveHostingProviderRefreshToken,
};
