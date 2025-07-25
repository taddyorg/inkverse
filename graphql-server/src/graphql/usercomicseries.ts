import { AuthenticationError } from './error.js';
import { UserSeriesSubscription, NotificationPreference } from '@inkverse/shared-server/models/index';
import { NotificationType, type MutationResolvers } from '@inkverse/shared-server/graphql/types';
import { purgeCacheOnCdn } from '@inkverse/shared-server/cache/index';

// GraphQL Type Definitions
export const UserComicSeriesDefinitions = `
  """
  User's relationship with a comic series, including subscription status and reading progress
  """
  type UserComicSeries {
    seriesUuid: ID!
    isSubscribed: Boolean!
    isRecommended: Boolean!
    hasNotificationEnabled: Boolean!
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

  """
  Enable notifications for a comic series
  """
  enableNotificationsForSeries(seriesUuid: ID!): UserComicSeries!
  
  """
  Disable notifications for a comic series
  """
  disableNotificationsForSeries(seriesUuid: ID!): UserComicSeries!
`;

// Resolvers
export const UserComicSeriesQueries = {
  getUserComicSeries: async (_parent: any, { seriesUuid }: { seriesUuid: string }, context: any) => {
    if (!context.user) {
      throw new AuthenticationError('You must be logged in to get user comic data');
    }

    try {
      // Get subscription status
      const [subscription, hasNotificationEnabled] = await Promise.all([
        UserSeriesSubscription.getSubscription(context.user.id, seriesUuid),
        NotificationPreference.hasNotificationEnabled(
          context.user.id,
          NotificationType.NEW_EPISODE_RELEASED,
          seriesUuid
        ),
      ]);
      
      return {
        seriesUuid,
        isSubscribed: !!subscription,
        isRecommended: false, // Future implementation
        hasNotificationEnabled,
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
    
    // Purge the ProfileComicSeries cache for this user
    await purgeCacheOnCdn({ type: 'profilecomicseries', id: String(context.user.id), shortUrl: context.user.username });
    
    // Get notification preference
    const hasNotificationEnabled = await NotificationPreference.hasNotificationEnabled(
      context.user.id,
      NotificationType.NEW_EPISODE_RELEASED,
      seriesUuid
    );
    
    return {
      seriesUuid,
      isSubscribed: true,
      isRecommended: false,
      hasNotificationEnabled,
    };
  },

  unsubscribeFromSeries: async (_parent: any, { seriesUuid }: { seriesUuid: string }, context: any) => {
    if (!context.user) {
      throw new AuthenticationError('You must be logged in to unsubscribe from a series');
    }

    await UserSeriesSubscription.unsubscribeFromComicSeries(context.user.id, seriesUuid);
    
    // Purge the ProfileComicSeries cache for this user
    await purgeCacheOnCdn({ type: 'profilecomicseries', id: String(context.user.id), shortUrl: context.user.username });
    
    // Get notification preference
    const hasNotificationEnabled = await NotificationPreference.hasNotificationEnabled(
      context.user.id,
      NotificationType.NEW_EPISODE_RELEASED,
      seriesUuid
    );
    
    return {
      seriesUuid,
      isSubscribed: false,
      isRecommended: false,
      hasNotificationEnabled,
    };
  },

  enableNotificationsForSeries: async (
    _parent: any, 
    { seriesUuid }: { seriesUuid: string }, 
    context: any
  ) => {
    if (!context.user) {
      throw new AuthenticationError('You must be logged in to enable notifications');
    }

    await NotificationPreference.enableNotification(
      context.user.id,
      NotificationType.NEW_EPISODE_RELEASED,
      seriesUuid
    );

    // Get updated subscription status
    const subscription = await UserSeriesSubscription.getSubscription(context.user.id, seriesUuid);

    return {
      seriesUuid,
      isSubscribed: !!subscription,
      isRecommended: false,
      hasNotificationEnabled: true,
    };
  },

  disableNotificationsForSeries: async (
    _parent: any, 
    { seriesUuid }: { seriesUuid: string }, 
    context: any
  ) => {
    if (!context.user) {
      throw new AuthenticationError('You must be logged in to disable notifications');
    }

    await NotificationPreference.disableNotification(
      context.user.id,
      NotificationType.NEW_EPISODE_RELEASED,
      seriesUuid
    );

    // Get updated subscription status
    const subscription = await UserSeriesSubscription.getSubscription(context.user.id, seriesUuid);

    return {
      seriesUuid,
      isSubscribed: !!subscription,
      isRecommended: false,
      hasNotificationEnabled: false,
    };
  },
};