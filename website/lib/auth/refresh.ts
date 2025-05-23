import { dispatchRefreshAccessToken, dispatchRefreshRefreshToken } from '@inkverse/shared-client/dispatch/authentication';
import config from '@/config';
import { saveAccessToken, saveRefreshToken } from './user';

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