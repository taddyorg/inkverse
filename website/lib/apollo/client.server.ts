import { ApolloClient, InMemoryCache, HttpLink, ApolloLink } from '@apollo/client';
import { SetContextLink } from '@apollo/client/link/context';
import { ErrorLink } from '@apollo/client/link/error';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import type { GraphQLFormattedError } from 'graphql';
import { typePolicies } from '@inkverse/public/apollo';
import config from '@/config';
import { getRefreshToken } from '../auth/cookie';

const cache = new InMemoryCache({ typePolicies });

// Create the HTTP link for GraphQL requests
const httpLink = new HttpLink({
  uri: config.SERVER_URL,
  headers: {
    'client-name': 'inkverse-website',
    'client-version': '3.0.0',
  }
});

// Create error link for better error handling (server-side)
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

// Create auth link factory that forwards cookies
const createAuthLink = (request: Request) => {
  return new SetContextLink(async (prevContext, operation) => {
    // Get the refresh token from cookies
    const refreshToken = await getRefreshToken(request);
    
    return {
      headers: {
        ...prevContext.headers,
        ...(refreshToken && { Authorization: `Bearer ${refreshToken}` }),
      },
    };
  });
};

export function getPublicApolloClient(request: Request) {
  const client = new ApolloClient({
    ssrMode: true,
    cache,
    link: ApolloLink.from([errorLink, httpLink]),
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
    link: ApolloLink.from([errorLink, authLink, httpLink]),
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