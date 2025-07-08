import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import type { NormalizedCacheObject } from '@apollo/client';

import config from '@/config';
import { typePolicies } from '@inkverse/public/apollo';
import { setContext } from '@apollo/client/link/context';
import { getAccessToken } from '../auth/user';
import { setupUserClientEventListeners } from '@inkverse/shared-client/pubsub/cache-listeners';

const cache = new InMemoryCache({ typePolicies });

// Create the HTTP link for GraphQL requests
const httpLink = createHttpLink({
  uri: config.SERVER_URL,
});

// Create the auth link to inject tokens into requests
const authLink = setContext(async (_, { headers }) => {
  // Get the authentication token from local storage
  const token = await getAccessToken();
  
  // Return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    }
  };
});

// Public client for unauthenticated requests (cached content)
const publicClient = new ApolloClient({
  cache,
  link: httpLink,
  headers: {
    'client-name': 'inkverse-website',
    'client-version': '3.0.0',
  }
});


// User client for authenticated requests
const userClient = new ApolloClient({
  cache,
  link: from([authLink, httpLink]),
  headers: {
    'client-name': 'inkverse-website',
    'client-version': '3.0.0',
  }
});

// Set up cache event listeners for the user client
setupUserClientEventListeners(userClient as any);

/**
 * Initialize the public Apollo client with state restoration
 */
export function initPublicApolloClient(apolloState: any): ApolloClient<NormalizedCacheObject> {
  // Restore cache state
  cache.restore(apolloState);
  
  // Return the public client
  return publicClient;
}

/**
 * Get the public client
 */
export function getPublicApolloClient(): ApolloClient<NormalizedCacheObject> {
  return publicClient;
}

/**
 * Get the user client
 */
export function getUserApolloClient(): ApolloClient<NormalizedCacheObject> {
  return userClient;
}