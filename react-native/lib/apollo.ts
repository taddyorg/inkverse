import { HttpLink, InMemoryCache, NormalizedCacheObject } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { ApolloClient, from } from '@apollo/client';
import * as Sentry from '@sentry/react-native';
import { typePolicies } from '@inkverse/public/apollo';
import config from '@/config';
import { getValidToken } from '@/lib/auth/user';

const cache = new InMemoryCache({ typePolicies });

const httpLink = new HttpLink({
  uri: `${config.SERVER_URL}`,
});

const authLink = setContext(async (_, { headers }) => {
  // Get token from secure storage
  const token = await getValidToken();
  if (!token) { throw new Error('setContext - No refresh or access token found'); }
  
  return {
    headers: {
      ...headers,
      ...(!!token && { authorization: `Bearer ${token}`})
    }
  }
});

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors)
    graphQLErrors.map((error) => {
      const graphQLError = new Error(error.message)
      try {
        Sentry.captureException(graphQLError);
      }
      catch(err) {
        console.log('sentry isnt loaded yet');
      }
      const { message, path, locations } = error
      __DEV__ && console.log(`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`);
    });

  if (networkError) {
    __DEV__ && console.log(`[Network error]: ${networkError}`);
  }
});

const publicClient = new ApolloClient({
  link: from([errorLink, httpLink]),
  cache,
  connectToDevTools: __DEV__,
  headers: {
    'client-name': 'Inkverse RN App (Public)',
    'client-version': '3.0.0',
  },
});

const userClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache,
  connectToDevTools: __DEV__,
  headers: {
    'client-name': 'Inkverse RN App (User)',
    'client-version': '3.0.0',
  },
});

/**
 * Get the public client
 */
export function getPublicApolloClient(): any {
  return publicClient;
}

/**
 * Get the user client
 */
export function getUserApolloClient(): any {
  return userClient;
}