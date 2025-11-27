import { ApolloClient, InMemoryCache, HttpLink, ApolloLink } from '@apollo/client';
import { SetContextLink } from '@apollo/client/link/context';
import { ErrorLink } from '@apollo/client/link/error';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import type { GraphQLFormattedError } from 'graphql';

import config from '@/config';
import { typePolicies } from '@inkverse/public/apollo';
import { getAccessToken } from '../auth/user';
import { setupUserClientEventListeners } from '@inkverse/shared-client/pubsub/index';

const cache = new InMemoryCache({ typePolicies });

// Create the HTTP link for GraphQL requests
const httpLink = new HttpLink({
  uri: config.SERVER_URL,
  headers: {
    'client-name': 'inkverse-website',
    'client-version': '3.0.0',
  }
});

// Create the auth link to inject tokens into requests
const authLink = new SetContextLink(async (prevContext, operation) => {
  // Get the authentication token from local storage
  const token = await getAccessToken();
  
  // Return the headers to the context so httpLink can read them
  return {
    headers: {
      ...prevContext.headers,
      authorization: token ? `Bearer ${token}` : '',
    }
  };
});

// Create error link for better error handling
const errorLink = new ErrorLink(({ error }) => {
  if (CombinedGraphQLErrors.is(error)) {
    error.errors.forEach((graphQLError: GraphQLFormattedError) => {
      const { message, path, locations } = graphQLError;
      console.error(`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`);
    });
  } else if (error) {
    console.error(`[Network error]: ${error}`);
  }
});

// Public client for unauthenticated requests (cached content)
const publicClient = new ApolloClient({
  cache,
  link: ApolloLink.from([errorLink, httpLink]),
  assumeImmutableResults: true
});

// User client for authenticated requests
const userClient = new ApolloClient({
  cache,
  link: ApolloLink.from([errorLink, authLink, httpLink]),
  assumeImmutableResults: true
});

// Set up cache event listeners for the user client
setupUserClientEventListeners(userClient);

/**
 * Initialize the public Apollo client with state restoration
 */
export function initPublicApolloClient(apolloState: any): ApolloClient {
  // Restore cache state
  cache.restore(apolloState);
  
  // Return the public client
  return publicClient;
}

/**
 * Get the public client
 */
export function getPublicApolloClient(): ApolloClient {
  return publicClient;
}

/**
 * Get the user client
 */
export function getUserApolloClient(): ApolloClient {
  return userClient;
}