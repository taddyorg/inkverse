import { AuthenticationError } from './error.js';
import { UserSeriesSubscription } from '@inkverse/shared-server/models/index';
import type { MutationResolvers } from '@inkverse/shared-server/graphql/types';

// GraphQL Type Definitions
export const UserComicSeriesDefinitions = `
  """
  User's relationship with a comic series, including subscription status and reading progress
  """
  type UserComicSeries {
    seriesUuid: ID!
    isSubscribed: Boolean!
    isRecommended: Boolean!
  }
`;

// Query Definitions
export const UserComicSeriesQueriesDefinitions = `
  """
  Get user's relationship data for a specific comic series
  """
  getUserComicSeries(seriesUuid: ID!): UserComicSeries
`;

// Mutation Definitions
export const UserComicSeriesMutationsDefinitions = `
  """
  Subscribe to a comic series
  """
  subscribeToSeries(seriesUuid: ID!): UserComicSeries!

  """
  Unsubscribe from a comic series
  """
  unsubscribeFromSeries(seriesUuid: ID!): UserComicSeries!
`;

// Resolvers
export const UserComicSeriesQueries = {
  getUserComicSeries: async (_parent: any, { seriesUuid }: { seriesUuid: string }, context: any) => {
    if (!context.user) {
      throw new AuthenticationError('You must be logged in to get user comic data');
    }

    try {
      // Get subscription status
      const subscription = await UserSeriesSubscription.getSubscription(context.user.id, seriesUuid);
      
      return {
        seriesUuid,
        isSubscribed: !!subscription,
        isRecommended: false, // Future implementation
      };
    } catch (error) {
      console.error('Error getting user comic data:', error);
      throw new Error('Failed to get user comic data');
    }
  },
};

export const UserComicSeriesMutations: MutationResolvers = {
  subscribeToSeries: async (_parent: any, { seriesUuid }: { seriesUuid: string }, context: any) => {
    if (!context.user) {
      throw new AuthenticationError('You must be logged in to subscribe to a series');
    }

    await UserSeriesSubscription.subscribeToComicSeries(context.user.id, seriesUuid);
    
    return {
      seriesUuid,
      isSubscribed: true,
      isRecommended: false,
    };
  },

  unsubscribeFromSeries: async (_parent: any, { seriesUuid }: { seriesUuid: string }, context: any) => {
    if (!context.user) {
      throw new AuthenticationError('You must be logged in to unsubscribe from a series');
    }

    await UserSeriesSubscription.unsubscribeFromComicSeries(context.user.id, seriesUuid);
    
    return {
      seriesUuid,
      isSubscribed: false,
      isRecommended: false,
    };
  },
};