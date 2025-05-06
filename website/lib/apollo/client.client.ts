import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import type { NormalizedCacheObject } from '@apollo/client';

import config from '@/config';
import { typePolicies } from '@inkverse/public/apollo';

let client: ApolloClient<NormalizedCacheObject> | null = null;

export function initClient(apolloState: any): ApolloClient<NormalizedCacheObject> {
  client = new ApolloClient({
    cache: new InMemoryCache({ typePolicies }).restore(apolloState),
    link: createHttpLink({
      uri: config.SERVER_URL,
    }),
  });
  return client;
}

export function getApolloClient() {
  return client;
}