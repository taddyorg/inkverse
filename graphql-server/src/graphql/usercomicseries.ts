import { AuthenticationError } from './error.js';
import { UserSeriesSubscription, NotificationPreference, UserLike, ComicIssue } from '@inkverse/shared-server/models/index';
import { NotificationType, SortOrder, type MutationResolvers } from '@inkverse/shared-server/graphql/types';
import { LikeableType, ParentType } from '@inkverse/shared-server/database/types';
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
    likedComicIssueUuids: [String]!
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

  """
  Like a comic issue
  """
  likeComicIssue(issueUuid: ID!, seriesUuid: ID!): UserComicSeries!

  """
  Unlike a comic issue
  """
  unlikeComicIssue(issueUuid: ID!, seriesUuid: ID!): UserComicSeries!

  """
  Super-like all episodes in a series (creates individual like records)
  """
  superLikeAllEpisodes(seriesUuid: ID!): UserComicSeries!
`;

// Helper function to build UserComicSeries response
async function buildUserComicSeriesResponse(userId: number, seriesUuid: string) {
  const [subscription, hasNotificationEnabled, userLikes] = await Promise.all([
    UserSeriesSubscription.getSubscription(userId, seriesUuid),
    NotificationPreference.hasNotificationEnabled(
      userId,
      NotificationType.NEW_EPISODE_RELEASED,
      seriesUuid
    ),
    UserLike.getUserLikesForParent(userId, seriesUuid, ParentType.COMICSERIES),
  ]);

  return {
    seriesUuid,
    isSubscribed: !!subscription,
    isRecommended: false, // Future implementation
    hasNotificationEnabled,
    likedComicIssueUuids: userLikes.map(like => like.likeableUuid),
  };
}

// Resolvers
export const UserComicSeriesQueries = {
  getUserComicSeries: async (_parent: any, { seriesUuid }: { seriesUuid: string }, context: any) => {
    if (!context.user) {
      throw new AuthenticationError('You must be logged in to get user comic data');
    }

    try {
      return await buildUserComicSeriesResponse(context.user.id, seriesUuid);
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

    return await buildUserComicSeriesResponse(context.user.id, seriesUuid);
  },

  unsubscribeFromSeries: async (_parent: any, { seriesUuid }: { seriesUuid: string }, context: any) => {
    if (!context.user) {
      throw new AuthenticationError('You must be logged in to unsubscribe from a series');
    }

    await UserSeriesSubscription.unsubscribeFromComicSeries(context.user.id, seriesUuid);

    // Purge the ProfileComicSeries cache for this user
    await purgeCacheOnCdn({ type: 'profilecomicseries', id: String(context.user.id), shortUrl: context.user.username });

    return await buildUserComicSeriesResponse(context.user.id, seriesUuid);
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

    return await buildUserComicSeriesResponse(context.user.id, seriesUuid);
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

    return await buildUserComicSeriesResponse(context.user.id, seriesUuid);
  },

  likeComicIssue: async (
    _parent: any,
    { issueUuid, seriesUuid }: { issueUuid: string; seriesUuid: string },
    context: any
  ) => {
    if (!context.user) {
      throw new AuthenticationError('You must be logged in to like a comic issue');
    }

    await UserLike.likeItem(
      context.user.id,
      issueUuid,
      LikeableType.COMICISSUE,
      seriesUuid,
      ParentType.COMICSERIES
    );

    await purgeCacheOnCdn({ type: 'comicissuestats', id: seriesUuid, issueUuid });

    return await buildUserComicSeriesResponse(context.user.id, seriesUuid);
  },

  unlikeComicIssue: async (
    _parent: any,
    { issueUuid, seriesUuid }: { issueUuid: string; seriesUuid: string },
    context: any
  ) => {
    if (!context.user) {
      throw new AuthenticationError('You must be logged in to unlike a comic issue');
    }

    await UserLike.unlikeItem(
      context.user.id,
      issueUuid,
      LikeableType.COMICISSUE
    );

    await purgeCacheOnCdn({ type: 'comicissuestats', id: seriesUuid, issueUuid });

    return await buildUserComicSeriesResponse(context.user.id, seriesUuid);
  },

  superLikeAllEpisodes: async (
    _parent: any,
    { seriesUuid }: { seriesUuid: string },
    context: any
  ) => {
    if (!context.user) {
      throw new AuthenticationError('You must be logged in to super-like episodes');
    }

    // Get all episodes for the series
    const issues = await ComicIssue.getComicIssuesForSeries(seriesUuid, SortOrder.LATEST, 10000);
    const issueUuids = issues.map(issue => issue.uuid);

    if (issueUuids.length > 0) {
      await UserLike.likeMultipleItems(
        context.user.id,
        issueUuids,
        LikeableType.COMICISSUE,
        seriesUuid,
        ParentType.COMICSERIES
      );
    }

    await purgeCacheOnCdn({ type: 'comicissuestats', id: seriesUuid });

    return await buildUserComicSeriesResponse(context.user.id, seriesUuid);
  },
};