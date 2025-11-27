import { ApolloClient, HttpLink, InMemoryCache, ApolloLink } from '@apollo/client';
import { SetContextLink } from '@apollo/client/link/context';
import type { SetContextLink as SetContextLinkType } from '@apollo/client/link/context';
import { ErrorLink } from '@apollo/client/link/error';
import type { ErrorLink as ErrorLinkType } from '@apollo/client/link/error';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import type { GraphQLFormattedError } from 'graphql';
import { typePolicies } from '@inkverse/public/apollo';
import { setupUserClientEventListeners } from '@inkverse/shared-client/pubsub';
import config from '@/config';
import { getValidToken } from '@/lib/auth/user';

const cache = new InMemoryCache({ typePolicies });

const httpLink = new HttpLink({
  uri: `${config.SERVER_URL}`,
  headers: {
    'client-name': 'Inkverse RN App',
    'client-version': '3.0.0',
  },
});

const authLink = new SetContextLink(async (
  prevContext: Readonly<ApolloLink.OperationContext>,
  operation: SetContextLinkType.SetContextOperation
): Promise<Partial<ApolloLink.OperationContext>> => {
  // Get token from secure storage
  const token = await getValidToken();
  if (!token) { throw new Error('SetContextLink - No refresh or access token found'); }
  
  return {
    headers: {
      ...prevContext.headers,
      ...(!!token && { authorization: `Bearer ${token}`})
    }
  }
});

const errorLink = new ErrorLink(({ error }: ErrorLinkType.ErrorHandlerOptions): void => {
  if (CombinedGraphQLErrors.is(error)) {
    error.errors.forEach((graphQLError: GraphQLFormattedError) => {
      const { message, path, locations } = graphQLError;
      __DEV__ && console.log(`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`);
    });
  } else if (error) {
    __DEV__ && console.log(`[Network error]: ${error}`);
  }
});

const publicClient = new ApolloClient({
  link: ApolloLink.from([errorLink, httpLink]),
  cache,
  assumeImmutableResults: true
});

const userClient = new ApolloClient({
  link: ApolloLink.from([errorLink, authLink, httpLink]),
  cache,
  assumeImmutableResults: true
});

// Set up cache event listeners for the user client
setupUserClientEventListeners(userClient);

/**
 * Get the public client
 */
export function getPublicApolloClient() {
  return publicClient;
}

/**
 * Get the user client
 */
export function getUserApolloClient() {
  return userClient;
}