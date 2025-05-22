import pkg from '@apollo/client';
const { ApolloClient, InMemoryCache, createHttpLink, from } = pkg;
import { typePolicies } from '@inkverse/public/apollo';
import config from '@/config';
import { setContext } from '@apollo/client/link/context';

const cache = new InMemoryCache({ typePolicies });

// Create the HTTP link for GraphQL requests
const httpLink = createHttpLink({
  uri: config.SERVER_URL,
});

// Create the auth link to inject tokens into requests
const authLink = setContext((_, { headers }) => {
  // Get the authentication token from cookies
  // const token = getAccessToken();
  
  // Return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

export function getPublicApolloClient(request: Request) {
  const client = new ApolloClient({
    ssrMode: true,
    cache,
    link: httpLink,
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