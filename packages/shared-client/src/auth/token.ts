/**
 * Authentication token utilities for Inkverse
 * 
 * Handles token management and authentication headers for GraphQL requests
 */

import { setContext } from '@apollo/client/link/context';
import { ApolloLink } from '@apollo/client';
import * as tokenStorage from './storage';

/**
 * Store authentication tokens from login/signup
 */
export const storeTokens = async (accessToken: string, refreshToken: string): Promise<void> => {
  await tokenStorage.setAccessToken(accessToken);
  await tokenStorage.setRefreshToken(refreshToken);
};

/**
 * Check if user is authenticated (has access token)
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const token = await tokenStorage.getAccessToken();
  return !!token;
};

/**
 * Logout - clear all tokens
 */
export const logout = async (): Promise<void> => {
  await tokenStorage.clearTokens();
};

/**
 * Create an Apollo Link that adds auth token to requests
 */
export const createAuthLink = (): ApolloLink => {
  return setContext(async (_, { headers }) => {
    // Get the auth token from storage
    const token = await tokenStorage.getAccessToken();
    
    // Return the headers to the context so httpLink can read them
    return {
      headers: {
        ...headers,
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      }
    };
  });
};

/**
 * Gets the authorization header with current token
 */
export const getAuthHeader = async (): Promise<Record<string, string>> => {
  const token = await tokenStorage.getAccessToken();
  return token ? { authorization: `Bearer ${token}` } : {};
};