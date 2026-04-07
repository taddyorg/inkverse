import { AuthenticationError } from './error.js';
import { purgeCacheOnCdn } from '@inkverse/shared-server/cache/index';
import { UserNotification, NotificationSetting, NotificationTimeBucket, getBucketBoundaries, type AggregatedNotificationRow, User, ComicIssue, ComicSeries, UserComment } from '@inkverse/shared-server/models/index';
import { NOTIFICATION_DEFAULTS } from '@inkverse/public/notifications';
import { NotificationEventType, NotificationChannel, InkverseType } from '@inkverse/public/graphql/types';
import type { MutationResolvers } from '@inkverse/shared-server/graphql/types';
import type { UserNotificationModel } from '@inkverse/shared-server/database/types';

// GraphQL Type Definitions
export const NotificationDefinitions = `
  """
  Notification event types
  """
  enum NotificationEventType {
    NEW_EPISODE_RELEASED
    COMMENT_REPLY
    COMMENT_LIKED
    CREATOR_EPISODE_LIKED
    CREATOR_EPISODE_COMMENTED
  }

  """
  Notification delivery channels
  """
  enum NotificationChannel {
    PUSH
    EMAIL
  }

  """
  Time buckets for grouping notifications
  """
  enum NotificationTimeBucket {
    TODAY
    THIS_WEEK
    THIS_MONTH
    EARLIER
  }

  """
  A notification for a user
  """
  type Notification {
    id: ID!
    createdAt: Int!
    eventType: NotificationEventType!
    actor: User
    targetItem: NotificationItem
    parentItem: NotificationItem
  }

  """
  An aggregated notification (multiple events collapsed into one)
  """
  type AggregatedNotification {
    id: ID!
    eventType: NotificationEventType!
    latestCreatedAt: Int!
    count: Int!
    targetItem: NotificationItem
    parentItem: NotificationItem
  }

  """
  A notification feed item (individual or aggregated)
  """
  union NotificationFeedItem = Notification | AggregatedNotification

  """
  An item referenced by a notification
  """
  type NotificationItem {
    uuid: ID!
    type: InkverseType!
    comicIssue: ComicIssue
    comment: Comment
    comicSeries: ComicSeries
  }

  """
  A section of notifications grouped by time bucket
  """
  type NotificationSection {
    bucket: NotificationTimeBucket!
    items: [NotificationFeedItem!]!
  }

  """
  Notification feed with time-bucketed sections
  """
  type NotificationFeed {
    userId: ID!
    sections: [NotificationSection!]! @costFactor(value: 1)
  }

  """
  A single notification setting item
  """
  type NotificationSettingItem {
    id: ID!
    eventType: NotificationEventType!
    channel: NotificationChannel!
    isEnabled: Boolean!
  }

  """
  Notification settings for a user
  """
  type NotificationSettingStatus {
    userId: ID!
    settings: [NotificationSettingItem!]!
  }
`;

// Query Definitions
export const NotificationQueriesDefinitions = `
  """
  Get notification feed for the authenticated user
  """
  getNotificationsForUser(buckets: [NotificationTimeBucket!]!, limit: Int, offset: Int): NotificationFeed

  """
  Get notification settings for the authenticated user
  """
  getNotificationSettings: NotificationSettingStatus!
`;

// Mutation Definitions
export const NotificationMutationsDefinitions = `
  """
  Add or update a notification setting override
  """
  addOrUpdateNotificationSetting(eventType: NotificationEventType!, channel: NotificationChannel!, isEnabled: Boolean!): NotificationSettingItem!
`;

// Resolvers
export const NotificationQueries = {
  getNotificationsForUser: async (_parent: any, args: { buckets: NotificationTimeBucket[]; limit?: number | null; offset?: number | null }, context: any) => {
    if (!context.user) {
      throw new AuthenticationError('You must be logged in to view notifications');
    }

    const limit = Math.min(args.limit || 50, 100);
    const offset = Math.max(args.offset || 0, 0);
    const userId = context.user.id;

    const sections = await Promise.all(
      args.buckets.map(async (bucket) => {
        const { start, end } = getBucketBoundaries(bucket);

        const [aggregated, individual] = await Promise.all([
          UserNotification.getAggregatedNotificationsForBucket(userId, start, end, limit, offset),
          UserNotification.getIndividualNotificationsForBucket(userId, start, end, limit, offset),
        ]);

        // Merge and sort by recency
        const items = [
          ...aggregated.map((a: AggregatedNotificationRow) => ({
            __typename: 'AggregatedNotification' as const,
            id: `${a.eventType}:${a.targetUuid}:${bucket}`,
            eventType: a.eventType,
            latestCreatedAt: a.latestCreatedAt,
            count: a.count,
            targetUuid: a.targetUuid,
            targetType: a.targetType,
            parentUuid: a.parentUuid,
            parentType: a.parentType,
            _sortTime: a.latestCreatedAt,
          })),
          ...individual.map((n: UserNotificationModel) => ({
            __typename: 'Notification' as const,
            id: String(n.id),
            createdAt: n.createdAt,
            eventType: n.eventType,
            senderId: n.senderId,
            targetUuid: n.targetUuid,
            targetType: n.targetType,
            parentUuid: n.parentUuid,
            parentType: n.parentType,
            _sortTime: n.createdAt,
          })),
        ].sort((a, b) => b._sortTime - a._sortTime);

        return { bucket, items };
      })
    );

    return {
      userId: String(userId),
      sections: sections.filter(s => s.items.length > 0),
    };
  },

  getNotificationSettings: async (_parent: any, _args: any, context: any) => {
    if (!context.user) {
      throw new AuthenticationError('You must be logged in to view notification settings');
    }

    const userId = context.user.id;
    const overrides = await NotificationSetting.getOverridesForUser(userId);
    const settings: any[] = [];

    for (const eventType of Object.values(NotificationEventType)) {
      for (const channel of Object.values(NotificationChannel)) {
        const defaults = NOTIFICATION_DEFAULTS[eventType];
        const isEnabled = overrides[eventType]?.[channel] ?? defaults[channel];

        settings.push({
          id: `${userId}:${eventType}:${channel}`,
          eventType,
          channel,
          isEnabled,
        });
      }
    }

    return { userId, settings };
  },
};

export const NotificationMutations: MutationResolvers = {
  addOrUpdateNotificationSetting: async (_parent, args, context) => {
    if (!context.user) {
      throw new AuthenticationError('You must be logged in to update notification settings');
    }

    await NotificationSetting.updateSetting(
      context.user.id,
      args.eventType,
      args.channel,
      args.isEnabled
    );

    // Purge notification settings cache for this user
    purgeCacheOnCdn({ type: 'notificationsettings', id: String(context.user.id) });

    return {
      id: `${context.user.id}:${args.eventType}:${args.channel}`,
      eventType: args.eventType,
      channel: args.channel,
      isEnabled: args.isEnabled,
    };
  },
};

// Field Resolvers
type NotificationParent = Record<string, unknown> & {
  senderId?: number;
  targetUuid?: string;
  targetType?: InkverseType;
  parentUuid?: string;
  parentType?: InkverseType;
};

export const NotificationFieldResolvers = {
  NotificationFeedItem: {
    __resolveType(obj: Record<string, unknown>) {
      return obj.count ? 'AggregatedNotification' : 'Notification';
    },
  },
  Notification: {
    actor: async (parent: NotificationParent) => {
      if (!parent.senderId) return null;
      return await User.getUserById(parent.senderId);
    },
    targetItem: async (parent: NotificationParent) => {
      if (!parent.targetUuid || !parent.targetType) return null;
      return resolveNotificationItem(parent.targetUuid, parent.targetType);
    },
    parentItem: async (parent: NotificationParent) => {
      if (!parent.parentUuid || !parent.parentType) return null;
      return resolveNotificationItem(parent.parentUuid, parent.parentType);
    },
  },
  AggregatedNotification: {
    targetItem: async (parent: NotificationParent) => {
      if (!parent.targetUuid || !parent.targetType) return null;
      return resolveNotificationItem(parent.targetUuid, parent.targetType);
    },
    parentItem: async (parent: NotificationParent) => {
      if (!parent.parentUuid || !parent.parentType) return null;
      return resolveNotificationItem(parent.parentUuid, parent.parentType);
    },
  },
};

async function resolveNotificationItem(uuid: string, type: InkverseType) {
  const simpleItem = { uuid, type };

  switch (type) {
    case 'COMICISSUE':
      return { ...simpleItem, comicIssue: await ComicIssue.getComicIssueByUuid(uuid) };
    case 'COMICSERIES':
      return { ...simpleItem, comicSeries: await ComicSeries.getComicSeriesByUuid(uuid) };
    case 'COMMENT':
      return { ...simpleItem, comment: await UserComment.getCommentByUuid(uuid) };
    default:
      throw new Error(`Invalid notification item type: ${type}`);
  }
}
