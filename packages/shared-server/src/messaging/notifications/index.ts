import { NotificationEventType } from '../../graphql/types.js';
import { type UserModel, type ComicSeriesModel, type ComicIssueModel, type UserCommentModel } from '../../database/types.js';
import { UserNotification, NotificationSetting, User, UserSeriesSubscription, ComicIssue, ComicSeries, UserComment, CreatorContent } from '../../models/index.js';
import { DIGEST_EVENT_TYPES } from '../../models/notification_setting.js';
import { type PushNotificationPayload, type SendPushNotificationQueueMessage } from '../push-notifications/index.js';
import { sendPushToUser, sendBatchPushToUsers, buildPushNotificationPayload } from '../push-notifications/index.js';
import { sendNotificationEmail, sendBatchNotificationEmail, buildNotificationEmailContent } from '../email/index.js';
import { getBannerImageUrl } from '@inkverse/public/comicissue';
import { NOTIFICATION_DEFAULTS } from '@inkverse/public/notifications';
import { purgeCacheOnCdn, purgeMultipleCacheOnCdn } from '../../cache/index.js';

import path from 'path';
import { fileURLToPath } from "url";
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '..', '..', '..', '.env');
dotenv.config({ path: envPath });

export type NotificationParams = {
  eventType: NotificationEventType;
  recipientId: number;
  senderId: number | null;
  targetUuid: string;
  targetType: string;
  parentUuid?: string;
  parentType?: string;
  contextUuid?: string;
  contextType?: string;
};

export type NotificationData = {
  actor?: UserModel | null;
  recipient?: UserModel | null;
  comicSeries?: ComicSeriesModel | null;
  comicIssue?: ComicIssueModel | null;
  comment?: UserCommentModel | null;
  imageUrl?: string;
};

export async function getNotificationData({ eventType, recipientId, senderId, targetUuid, targetType, parentUuid, parentType }: NotificationParams): Promise<NotificationData> {
  switch (eventType) {
    case NotificationEventType.COMMENT_REPLY:
    case NotificationEventType.COMMENT_LIKED: {
      const [actor, recipient, comment, comicIssue, comicSeries] = await Promise.all([
        senderId ? User.getUserById(senderId) : null,
        User.getUserById(recipientId),
        UserComment.getCommentByUuid(targetUuid),
        parentUuid ? ComicIssue.getComicIssueByUuid(parentUuid) : null,
        parentUuid ? ComicSeries.getComicSeriesByIssueUuid(parentUuid) : null,
      ]);

      const imageUrl = comicIssue
        ? getBannerImageUrl({ bannerImageAsString: JSON.stringify(comicIssue.bannerImage), variant: 'medium' })
        : undefined;

      return { actor, recipient, comment, comicIssue, comicSeries, imageUrl };
    }
    case NotificationEventType.NEW_EPISODE_RELEASED: {
      const [comicIssue, comicSeries] = await Promise.all([
        ComicIssue.getComicIssueByUuid(targetUuid),
        parentUuid ? ComicSeries.getComicSeriesByUuid(parentUuid) : null,
      ]);

      const imageUrl = comicIssue
        ? getBannerImageUrl({ bannerImageAsString: JSON.stringify(comicIssue.bannerImage), variant: 'medium' })
        : undefined;
      
      return { comicIssue, comicSeries, imageUrl };
    }
    case NotificationEventType.CREATOR_EPISODE_LIKED:
    case NotificationEventType.CREATOR_EPISODE_COMMENTED:
      throw new Error(`getNotificationData called with digest event type: ${eventType}. These should be handled by the digest job.`);
    default:
      throw new Error(`Unknown event type: ${eventType}`);
  }
}

export async function createNotification({ recipientId, senderId, eventType, targetUuid, targetType, parentUuid, parentType, contextUuid, contextType }: NotificationParams): Promise<void> {
  try {
    // Skip self-notifications
    if (senderId && recipientId === senderId) return;

    // Resolve effective settings
    const overrides = await NotificationSetting.getOverridesForUser(recipientId);
    const defaults = NOTIFICATION_DEFAULTS[eventType];
    const pushEnabled = overrides[eventType]?.PUSH ?? defaults?.PUSH ?? false;
    const emailEnabled = overrides[eventType]?.EMAIL ?? defaults?.EMAIL ?? false;

    // If both disabled, skip entirely (no in-app row either)
    if (!pushEnabled && !emailEnabled) return;

    // Create in-app notification row
    await UserNotification.createNotification({ recipientId, senderId, eventType, targetUuid, targetType, parentUuid, parentType, contextUuid, contextType });

    // Purge the recipient's notification feed cache (fire-and-forget)
    purgeCacheOnCdn({ type: 'notificationfeed', id: String(recipientId) });

    // For real-time events (NOT digest-batched): send push + email immediately
    if (!DIGEST_EVENT_TYPES.has(eventType)) {
      const data = await getNotificationData({ eventType, recipientId, senderId, targetUuid, targetType, parentUuid, parentType });
      const pushPayload = buildPushNotificationPayload(eventType, data);
      const emailContent = buildNotificationEmailContent(eventType, data);

      if (pushEnabled && pushPayload) {
        await sendPushToUser(recipientId, pushPayload);
      }
      if (emailEnabled && emailContent && data.recipient?.email) {
        await sendNotificationEmail(data.recipient.email, emailContent);
      }
    }
    // Digest events: no immediate push/email — handled by digest batch job
  } catch (error) {
    console.error(error as Error, `Error in createNotification for recipient ${recipientId}, event ${eventType}`);
  }
}

export async function createNotificationBatch(message: SendPushNotificationQueueMessage): Promise<void> {
  switch (message.pushNotificationType) {
    case NotificationEventType.NEW_EPISODE_RELEASED: {
      const { issueUuid, seriesUuid } = message;
      if (!issueUuid || !seriesUuid) throw new Error('issueUuid and seriesUuid required');

      // Fetch data once using shared function
      const data = await getNotificationData({
        eventType: message.pushNotificationType,
        recipientId: 0,
        senderId: null,
        targetUuid: issueUuid,
        targetType: 'COMICISSUE',
        parentUuid: seriesUuid,
        parentType: 'COMICSERIES',
      });

      if (!data.comicIssue || !data.comicSeries) {
        throw new Error('NEW_EPISODE_RELEASED - Comic issue or comic series not found');
      }

      // Build payloads once
      const pushPayload = buildPushNotificationPayload(NotificationEventType.NEW_EPISODE_RELEASED, data);
      const emailContent = buildNotificationEmailContent(NotificationEventType.NEW_EPISODE_RELEASED, data);

      // Paginate through subscribers by ID range
      const batchSize = 1000;
      const maxId = await User.getMaxId();
      let currentMinId = 0;

      while (currentMinId < maxId) {
        const currentMaxId = currentMinId + batchSize;

        const userIds = await UserSeriesSubscription.getSubscribedUserIdsInRange(
          seriesUuid, currentMinId, currentMaxId
        );

        if (userIds.length > 0) {
          // Check overrides
          const overridesMap = await NotificationSetting.getOverridesForUsers(
            userIds, message.pushNotificationType
          );
          const defaults = NOTIFICATION_DEFAULTS[message.pushNotificationType];

          const activeIds: number[] = [];
          const pushEnabledUserIds: number[] = [];
          const emailEnabledUserIds: number[] = [];

          for (const id of userIds) {
            const o = overridesMap.get(id);
            const pushOn = o?.PUSH ?? defaults?.PUSH ?? false;
            const emailOn = o?.EMAIL ?? defaults?.EMAIL ?? false;
            if (!pushOn && !emailOn) continue;
            activeIds.push(id);
            if (pushOn) pushEnabledUserIds.push(id);
            if (emailOn) emailEnabledUserIds.push(id);
          }

          // Batch-insert in-app notification rows
          if (activeIds.length > 0) {
            await UserNotification.createBatchNotifications(
              activeIds.map(id => ({
                recipientId: id,
                senderId: null,
                eventType: message.pushNotificationType,
                targetUuid: issueUuid,
                targetType: 'COMICISSUE',
                parentUuid: seriesUuid,
                parentType: 'COMICSERIES',
              }))
            );

            // Purge notification feed cache for all affected users (fire-and-forget)
            purgeMultipleCacheOnCdn({ type: 'notificationfeed', ids: activeIds.map(id => String(id)) });
          }

          // Send push to enabled users
          if (pushEnabledUserIds.length > 0 && pushPayload) {
            await sendBatchPushToUsers(pushEnabledUserIds, pushPayload);
          }

          // Send email to enabled users
          if (emailEnabledUserIds.length > 0 && emailContent) {
            await sendBatchNotificationEmail(emailEnabledUserIds, emailContent);
          }
        }

        currentMinId = currentMaxId;
      }
      return;
    }
    default:
      throw new Error(`Unknown pushNotificationType: ${message.pushNotificationType}`);
  }
}

type NotifySeriesCreatorInput = {
  seriesUuid: string;
  issueUuid: string;
  senderId: number;
  eventType: NotificationEventType;
  skipForUserId?: number | null;
  commentUuid?: string;
};

export async function notifySeriesCreator({ seriesUuid, issueUuid, senderId, eventType, skipForUserId, commentUuid }: NotifySeriesCreatorInput) {
  try {
    const creatorUuid = await CreatorContent.getCreatorUuidForContent(seriesUuid);
    if (!creatorUuid) return;

    const creatorUser = await User.getUserByCreatorUuid(creatorUuid);
    if (!creatorUser || Number(creatorUser.id) === senderId) return;

    // Skip if the creator already received a different notification (e.g. COMMENT_REPLY) for this action
    if (skipForUserId && Number(creatorUser.id) === skipForUserId) return;

    await createNotification({
      recipientId: Number(creatorUser.id),
      senderId: senderId,
      eventType: eventType,
      targetUuid: issueUuid,
      targetType: 'COMICISSUE',
      parentUuid: seriesUuid,
      parentType: 'COMICSERIES',
      contextUuid: commentUuid,
      contextType: commentUuid ? 'COMMENT' : undefined,
    });
  } catch (err) {
    console.error(err as Error, `Error in notifySeriesCreator for series ${seriesUuid}, issue ${issueUuid}, sender ${senderId}, event ${eventType}`, err);
  }
}
