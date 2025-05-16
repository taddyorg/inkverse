/**
 * Authentication-aware Apollo clients for Inkverse
 * 
 * Configures Apollo clients with authentication support for GraphQL requests
 */

import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { createAuthLink } from './token';

/**
 * Create Apollo Client for unauthenticated (public) requests
 */
export const createPublicClient = (uri: string) => {
  return new ApolloClient({
    link: new HttpLink({ uri }),
    cache: new InMemoryCache(),
    name: 'inkverse-public-client',
    version: '1.0',
  });
};

/**
 * Create Apollo Client for authenticated (user) requests
 */
export const createUserClient = (uri: string) => {
  // Create links
  const httpLink = new HttpLink({ uri });
  const authLink = createAuthLink();
  
  // Error link for handling auth errors
  const errorLink = onError(({ graphQLErrors, networkError }) => {
    if (graphQLErrors) {
      graphQLErrors.forEach(({ message, locations, path, extensions }) => {
        // Log errors
        console.error(
          `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
        );
        
        // Handle authentication errors (token expired, etc.)
        if (extensions?.code === 'UNAUTHENTICATED') {
          // TODO: Implement token refresh logic
          console.warn('Authentication token expired or invalid');
        }
      });
    }
    
    if (networkError) {
      console.error(`[Network error]: ${networkError}`);
    }
  });
  
  // Create client with auth link
  return new ApolloClient({
    link: from([errorLink, authLink, httpLink]),
    cache: new InMemoryCache(),
    name: 'inkverse-user-client',
    version: '1.0',
  });
};