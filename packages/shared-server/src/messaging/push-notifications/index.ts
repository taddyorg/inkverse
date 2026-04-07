import { Expo, type ExpoPushMessage } from 'expo-server-sdk';
import { UserDevice } from '../../models/index.js';
import { NotificationEventType } from '../../graphql/types.js';
import type { NotificationData } from '../../messaging/notifications/index.js';
import { type DigestTotals, getDigestText } from '../notifications/digest.js';
import path from 'path';
import { fileURLToPath } from "url";
import dotenv from 'dotenv';
import type { INKVERSE_HIGH_PRIORITY_TYPE } from 'src/queues/utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '..', '..', '.env');
dotenv.config({ path: envPath });

// Initialize Expo SDK
const expo = new Expo({ accessToken: process.env.EXPO_PUSH_ACCESS_TOKEN });

export type PushNotificationPayload = Omit<ExpoPushMessage, 'to'>;

/**
 * Validates if a push token is a valid Expo push token
 */
function validatePushToken(pushToken: string): boolean {
  return Expo.isExpoPushToken(pushToken);
}

export function buildPushNotificationPayload(
  eventType: NotificationEventType,
  data: NotificationData
): PushNotificationPayload | null {
  const actorName = data.actor?.name || data.actor?.username || 'Someone';
  const seriesName = data.comicSeries?.name || 'a comic';

  switch (eventType) {
    case NotificationEventType.COMMENT_REPLY:
      return {
        title: 'Yay! Someone replied to your comment',
        body: `${actorName} replied to your comment`,
        data: {
          type: eventType,
          targetUuid: data.comment?.uuid,
          targetType: 'COMMENT',
          parentUuid: data.comicIssue?.uuid,
          parentType: 'COMICISSUE',
          seriesUuid: data.comicSeries?.uuid,
        },
        priority: 'high' as const,
        channelId: 'COMMENT_REPLY',
        sound: 'default' as const,
        ...(data.imageUrl && {
          richContent: {
            image: data.imageUrl,
          },
        }),
      };
    case NotificationEventType.COMMENT_LIKED:
      return {
        title: 'Yay! Someone liked your comment',
        body: `${actorName} liked your comment`,
        data: {
          type: eventType,
          targetUuid: data.comment?.uuid,
          targetType: 'COMMENT',
          parentUuid: data.comicIssue?.uuid,
          parentType: 'COMICISSUE',
          seriesUuid: data.comicSeries?.uuid,
        },
        priority: 'high' as const,
        channelId: 'COMMENT_LIKED',
        mutableContent: true,
        sound: 'default' as const,
        ...(data.imageUrl && {
          richContent: {
            image: data.imageUrl,
          },
        }),
      };
    case NotificationEventType.NEW_EPISODE_RELEASED:
      return {
        title: 'New Episode Released',
        body: `A new episode of ${seriesName} just got released!`,
        data: {
          type: eventType,
          seriesUuid: data.comicSeries?.uuid,
          issueUuid: data.comicIssue?.uuid,
        },
        priority: 'high' as const,
        channelId: 'NEW_EPISODE_RELEASED',
        mutableContent: true,
        sound: 'default' as const,
        ...(data.imageUrl && {
          richContent: {
            image: data.imageUrl,
          },
        }),
      };
    case NotificationEventType.CREATOR_EPISODE_LIKED:
    case NotificationEventType.CREATOR_EPISODE_COMMENTED:
      console.error(`buildPushNotificationPayload called with digest event type: ${eventType}. These should be handled by the digest job.`);
      return null;
    default:
      return null;
  }
}

export function buildDigestPushPayload(
  totals: DigestTotals
): PushNotificationPayload {
  const { title, body } = getDigestText(totals);
  return {
    title,
    body,
    data: { type: 'DIGEST' },
    priority: 'high' as const,
    channelId: 'DIGEST',
    sound: 'default' as const,
    richContent: {
      image: 'https://ink0.inkverse.co/general/creator-digest.png',
    },
  };
}

export interface SendPushNotificationQueueMessage {
  type: INKVERSE_HIGH_PRIORITY_TYPE;
  pushNotificationType: NotificationEventType;
  issueUuid?: string;
  seriesUuid?: string;
}

export async function sendPushToUser(
  userId: number,
  pushPayload: PushNotificationPayload
): Promise<void> {
  if (process.env.NODE_ENV !== 'production') {
    console.log('LocalHost sendPushToUser:', { userId, pushPayload });
    return;
  }

  const devices = await UserDevice.getPushTokensForUser(String(userId));
  const validDevices = devices.filter(d => validatePushToken(d.fcmToken));

  if (validDevices.length === 0) return;

  const messages: ExpoPushMessage[] = validDevices.map(device => ({
    to: device.fcmToken,
    ...pushPayload,
  }));

  try {
    await expo.sendPushNotificationsAsync(messages);
  } catch (error) {
    console.error(error as Error, `Error sending push to user ${userId}`, error);
  }
}

export async function sendBatchPushToUsers(
  userIds: number[],
  pushPayload: PushNotificationPayload
): Promise<void> {
  if (process.env.NODE_ENV !== 'production') {
    console.log('LocalHost sendBatchPushToUsers:', { userCount: userIds.length, pushPayload });
    return;
  }

  // Process in batches of 100 users at a time
  const batchSize = 100;
  for (let i = 0; i < userIds.length; i += batchSize) {
    const batch = userIds.slice(i, i + batchSize);

    const allMessages: ExpoPushMessage[] = [];
    for (const userId of batch) {
      const devices = await UserDevice.getPushTokensForUser(String(userId));
      const validDevices = devices.filter(d => validatePushToken(d.fcmToken));

      for (const device of validDevices) {
        allMessages.push({
          to: device.fcmToken,
          ...pushPayload,
        });
      }
    }

    if (allMessages.length > 0) {
      try {
        await expo.sendPushNotificationsAsync(allMessages);
      } catch (error) {
        console.error(error as Error, 'Error sending batch push notifications', error);
      }
    }
  }
}
