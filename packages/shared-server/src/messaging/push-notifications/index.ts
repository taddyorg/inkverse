import { Expo, type ExpoPushMessage, type ExpoPushTicket } from 'expo-server-sdk';
import { type UserDeviceModel } from '../../database/index.js';
import { ComicIssue, ComicSeries, NotificationPreference } from '../../models/index.js';
import { captureRemoteError } from '../../utils/errors.js';

import path from 'path';
import { fileURLToPath } from "url";
import dotenv from 'dotenv';
import { getBannerImageUrl } from '@inkverse/public/comicissue';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '..', '..', '.env');
dotenv.config({ path: envPath });

// Initialize Expo SDK
const expo = new Expo({ accessToken: process.env.EXPO_PUSH_ACCESS_TOKEN });

// Push notification types
export type PushNotificationType = 'NEW_EPISODE_RELEASED' | 'APP_UPDATE';

export type PushNotificationPayload = Omit<ExpoPushMessage, 'to'>;

export interface StreamingPushNotificationParams {
  getDevices: (limit: number, offset: number) => Promise<UserDeviceModel[]>;
  getTotalCount: () => Promise<number>;
  pushNotificationPayload: PushNotificationPayload;
  notificationType: PushNotificationType;
}

/**
 * Validates if a push token is a valid Expo push token
 */
function validatePushToken(pushToken: string): boolean {
  return Expo.isExpoPushToken(pushToken);
}

export type PushNotificationsPayloadParams = {
  type: PushNotificationType,
  seriesName?: string,
  issueName?: string,
  seriesUuid?: string,
  issueUuid?: string,
  imageUrl?: string,
}

/**
 * Helper function to generate push notification payload for common scenarios
 */
export function getPushNotificationPayload(params: PushNotificationsPayloadParams): PushNotificationPayload {
  switch (params.type) {
    case 'NEW_EPISODE_RELEASED':
      const { seriesName, issueName, seriesUuid, issueUuid, imageUrl } = params;
      if (!seriesName || !issueName || !seriesUuid || !issueUuid) {
        throw new Error('NEW_EPISODE_RELEASED - Series name, issue name, series UUID, and issue UUID are required');
      }

      return {
        title: `A new episode of ${seriesName} just dropped!`,
        body: `${issueName} is now available to read!`,
        data: {
          type: 'NEW_EPISODE_RELEASED',
          seriesUuid,
          issueUuid,
        },
        priority: 'high',
        channelId: 'NEW_EPISODE_RELEASED',
        mutableContent: true,
        sound: 'default',
        ...(imageUrl && {
          richContent: {
            image: imageUrl,
          },
        }),
      };
    default:
      throw new Error(`Unknown push notification type: ${params.type}`);
  }
}

export interface SendPushNotificationQueueMessage {
  pushNotificationType: PushNotificationType;
  issueUuid?: string;
  seriesUuid?: string;
}

/**
 * Send push notifications using a streaming approach to handle large numbers of subscribers
 */
export async function sendPushNotification({
  pushNotificationType,
  issueUuid,
  seriesUuid,
}: SendPushNotificationQueueMessage): Promise<ExpoPushTicket[]> {
  if (process.env.NODE_ENV !== "production") {
    console.log('LocalHost Sending push notification:', {
      pushNotificationType,
      issueUuid,
      seriesUuid,
    });
    return [];
  }

  try {
    switch (pushNotificationType) {
      case 'NEW_EPISODE_RELEASED':
        if (!issueUuid || !seriesUuid) {
          throw new Error('NEW_EPISODE_RELEASED - Issue UUID and series UUID are required');
        }

        // Fetch comic details once
        const [comicissue, comicseries] = await Promise.all([
          ComicIssue.getComicIssueByUuid(issueUuid),
          ComicSeries.getComicSeriesByUuid(seriesUuid),
        ]);

        if (!comicissue || !comicseries) {
          throw new Error('NEW_EPISODE_RELEASED - Comic issue or comic series not found');
        }

        // Prepare notification payload
        const pushNotificationPayload = getPushNotificationPayload({
          type: pushNotificationType,
          seriesName: comicseries.name || undefined,
          issueName: comicissue.name || undefined,
          seriesUuid: comicseries.uuid,
          issueUuid: comicissue.uuid,
          imageUrl: getBannerImageUrl({ bannerImageAsString: JSON.stringify(comicissue.bannerImage), variant: 'medium' }),
        });

        console.log('Sending push notification:', pushNotificationPayload);

        // Send notifications in batches
        return sendPushNotificationInBatches({
          getDevices: (limit, offset) => NotificationPreference.getDevicesForSeriesNotifications(seriesUuid, limit, offset),
          getTotalCount: () => NotificationPreference.getNotificationEnabledCount(seriesUuid),
          pushNotificationPayload,
          notificationType: pushNotificationType,
        });

      default:
        throw new Error(`Unknown push notification type: ${pushNotificationType}`);
    }
  } catch (error) {
    captureRemoteError(error as Error, `Error in streaming push notification - ${pushNotificationType}, issueUuid: ${issueUuid}, seriesUuid: ${seriesUuid}`);
    return [];
  }
}

/**
 * Send push notifications using a streaming approach to handle large numbers of users
 */
async function sendPushNotificationInBatches({
  getDevices,
  getTotalCount,
  pushNotificationPayload,
  notificationType,
}: StreamingPushNotificationParams): Promise<ExpoPushTicket[]> {
  try {
    // Get total count
    const totalCount = await getTotalCount();
    
    if (totalCount === 0) {
      return [];
    }

    // Process devices in pages
    const pageSize = 100; // Process 100 devices at a time
    let offset = 0;
    const allTickets: ExpoPushTicket[] = [];

    while (offset < totalCount) {
      // Get page of devices
      const devices = await getDevices(pageSize, offset);
      
      if (devices.length === 0) {
        break;
      }

      // Filter valid tokens
      const validDevices = devices.filter(device => validatePushToken(device.fcmToken));

      if (validDevices.length > 0) {
        // Create messages
        const messages: ExpoPushMessage[] = validDevices.map(device => ({
          to: device.fcmToken,
          ...pushNotificationPayload,
        }));

        // Send directly without additional chunking (we're already in batches of 100)
        try {
          const tickets = await expo.sendPushNotificationsAsync(messages);
          allTickets.push(...tickets);
        } catch (error) {
          captureRemoteError(error as Error, 'Error sending push notification batch');
        }
      }

      offset += pageSize;
    }

    return allTickets;
  } catch (error) {
    captureRemoteError(error as Error, `Error in batch push notification - ${notificationType}`);
    return [];
  }
}