import pkg from '@apollo/client';
const { ApolloClient, InMemoryCache, createHttpLink, from } = pkg;
import { typePolicies } from '@inkverse/public/apollo';
import config from '@/config';
import { setContext } from '@apollo/client/link/context';
import { getRefreshToken } from '../auth/cookie';

const cache = new InMemoryCache({ typePolicies });

// Create the HTTP link for GraphQL requests
const httpLink = createHttpLink({
  uri: config.SERVER_URL,
});

// Create auth link factory that forwards cookies
const createAuthLink = (request: Request) => {
  return setContext(async (_, { headers }) => {
    // Get the refresh token from cookies
    const refreshToken = await getRefreshToken(request);
    
    return {
      headers: {
        ...headers,
        ...(refreshToken && { Authorization: `Bearer ${refreshToken}` }),
      },
    };
  });
};

export function getPublicApolloClient(request: Request) {
  const client = new ApolloClient({
    ssrMode: true,
    cache,
    link: from([httpLink]),
    headers: {
      'client-name': 'inkverse-website',
      'client-version': '3.0.0',
    },
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'no-cache',
      },
      query: {
        fetchPolicy: 'no-cache',
      },
      mutate: {
        fetchPolicy: 'no-cache',
      },
    },
  });
  return client;
}

export function getUserApolloClient(request: Request) {
  const cache = new InMemoryCache({ typePolicies });
  const authLink = createAuthLink(request);
  
  const client = new ApolloClient({
    ssrMode: true,
    cache,
    link: from([authLink, httpLink]),
    headers: {
      'client-name': 'inkverse-website',
      'client-version': '3.0.0',
    },
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'no-cache',
      },
      query: {
        fetchPolicy: 'no-cache',
      },
      mutate: {
        fetchPolicy: 'no-cache',
      },
    },
  });
  return client;
}