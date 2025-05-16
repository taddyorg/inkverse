import type { User } from '@inkverse/public/graphql/types';

/**
 * GraphQL context type for authentication
 */
export type GraphQLContext = {
  user?: User | null;
}