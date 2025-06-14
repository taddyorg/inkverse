import { Expo, type ExpoPushMessage, type ExpoPushTicket } from 'expo-server-sdk';
import { type UserDeviceModel } from '../database/index.js';
import { UserDevice } from '../models/user_device.js';
import { captureRemoteError } from '../utils/errors.js';

import path from 'path';
import { fileURLToPath } from "url";
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '..', '..', '.env');
dotenv.config({ path: envPath });

// Initialize Expo SDK
const expo = new Expo({ accessToken: process.env.EXPO_PUSH_ACCESS_TOKEN });

// Push notification types
export enum PushNotificationType {
  NEW_EPISODE_RELEASE = 'NEW_EPISODE_RELEASE',
  APP_UPDATE = 'APP_UPDATE',
}

// Push notification interfaces
export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  channelId?: string;
  priority?: 'default' | 'normal' | 'high';
  richContent?: {
    image: string;
  };
}

export interface BatchPushNotificationParams {
  targets: UserDeviceModel[];
  payload: PushNotificationPayload;
  type: PushNotificationType;
}

export interface SinglePushNotificationParams {
  target: UserDeviceModel;
  payload: PushNotificationPayload;
  type: PushNotificationType;
}

/**
 * Validates if a push token is a valid Expo push token
 */
export function validatePushToken(pushToken: string): boolean {
  return Expo.isExpoPushToken(pushToken);
}

function generatePushNotificationPayload(type: PushNotificationType, id: string): PushNotificationPayload {
  const title = generatePushNotificationTitle(type, id);
  const body = generatePushNotificationBody(type, id);
  const richContent = generatePushNotificationRichContent(type, id);
  const data = generatePushNotificationData(type, id);
  return {
    title,
    body,
    priority: 'high',
    ...(data ? { data } : {}),
    ...(richContent ? { richContent } : {}),
    channelId: 'default',
  };
}

function generatePushNotificationTitle(type: PushNotificationType, id: string): string {
  switch (type) {
    case PushNotificationType.NEW_EPISODE_RELEASE:
      return `A new episode just dropped!`;
    case PushNotificationType.APP_UPDATE:
      return 'A new app update is available!';
    default:
      throw new Error(`Unknown push notification type: ${type}`);
  }
}

function generatePushNotificationBody(type: PushNotificationType, name?: string, description?: string): string {
  switch (type) {
    case PushNotificationType.NEW_EPISODE_RELEASE:
      if (!name) { throw new Error('Name is required for new episode release'); }
      return `${name} just released a new episode!`;
    case PushNotificationType.APP_UPDATE:
      if (!description) { throw new Error('Description is required for app update'); }
      return description;
    default:
      throw new Error(`Unknown push notification type: ${type}`);
  }
}

function generatePushNotificationData(type: PushNotificationType, id: string): Record<string, any> | null {
  switch (type) {
    case PushNotificationType.NEW_EPISODE_RELEASE:
      return { type: PushNotificationType.NEW_EPISODE_RELEASE, id };
    default:
      return null;
  }
}

function generatePushNotificationRichContent(type: PushNotificationType, id: string): { image: string } | null {
  switch (type) {
    case PushNotificationType.NEW_EPISODE_RELEASE:
      return { image: `https://example.com/statics/some-image-here-if-you-want.jpg` };
    default:
      return null;
  }
}

// /**
//  * Send a push notification to a single target
//  */
// export async function sendPushNotification({
//   type,
//   target,
// }: SinglePushNotificationParams): Promise<ExpoPushTicket | null> {
//   if (process.env.NODE_ENV !== "production") {
//     console.log('LocalHost Sending push notification:', {
//       type,
//       target: target.userId,
//     });
//     return null;
//   }

//   try {
//     if (!validatePushToken(target.fcmToken)) {
//       console.warn('Invalid push token:', target.fcmToken);
//       return null;
//     }

//     const message: ExpoPushMessage = {
//       to: target.fcmToken,
//       ...generatePushNotificationPayload(type, target.userId),
//     };

//     const tickets = await expo.sendPushNotificationsAsync([message]);
//     const ticket = tickets[0];

//     // Handle ticket errors
//     if (ticket.status === 'error') {
//       console.error('Push notification error:', ticket.message);
      
//       // Remove invalid tokens
//       if (ticket.details?.error === 'DeviceNotRegistered') {
//         await UserDevice.removePushTokenByToken(target.fcmToken);
//       }
//     }

//     return ticket;
//   } catch (error) {
//     console.error('Error sending push notification', error);
//     captureRemoteError(new Error('Error sending push notification'), 'Error sending push notification');
//     return null;
//   }
// }

// /**
//  * Send push notifications to multiple targets in batches
//  */
// export async function sendBatchPushNotifications({
//   targets,
//   payload,
//   type
// }: BatchPushNotificationParams): Promise<ExpoPushTicket[]> {
//   if (process.env.NODE_ENV !== "production") {
//     console.log('LocalHost Sending batch push notifications:', {
//       type,
//       targetCount: targets.length,
//       payload
//     });
//     return [];
//   }

//   try {
//     // Filter valid tokens
//     const validTargets = targets.filter(target => 
//       validatePushToken(target.fcmToken)
//     );

//     if (validTargets.length === 0) {
//       return [];
//     }

//     // Create messages
//     const messages: ExpoPushMessage[] = validTargets.map(target => ({
//       to: target.fcmToken,
//       ...generatePushNotificationPayload(type, target.userId),
//     }));

//     // Send in chunks (Expo recommends chunks of 100)
//     const chunks = expo.chunkPushNotifications(messages);
//     const allTickets: ExpoPushTicket[] = [];

//     for (const chunk of chunks) {
//       try {
//         const tickets = await expo.sendPushNotificationsAsync(chunk);
//         allTickets.push(...tickets);

//         // Handle individual ticket errors
//         tickets.forEach((ticket, index) => {
//           if (ticket.status === 'error') {
//             const target = validTargets[index];
//             console.error('Push notification error for user:', target.userId, ticket.message);
            
//             // Remove invalid tokens
//             if (ticket.details?.error === 'DeviceNotRegistered') {
//               UserDevice.removePushTokenByToken(target.fcmToken).catch(console.error);
//             }
//           }
//         });
//       } catch (error) {
//         captureRemoteError(error, 'Error sending push notification chunk');
//       }
//     }

//     return allTickets;
//   } catch (error) {
//     captureRemoteError(error, 'Error sending batch push notifications');
//     return [];
//   }
// }

// /**
//  * Handle push notification receipts
//  */
// export async function handlePushReceipts(ticketIds: string[]): Promise<void> {
//   if (process.env.NODE_ENV !== "production") {
//     console.log('LocalHost Handling push receipts for tickets:', ticketIds.length);
//     return;
//   }

//   try {
//     const receiptChunks = expo.chunkPushNotificationReceiptIds(ticketIds);

//     for (const chunk of receiptChunks) {
//       try {
//         const receipts = await expo.getPushNotificationReceiptsAsync(chunk);

//         Object.entries(receipts).forEach(([ticketId, receipt]) => {
//           if (receipt.status === 'error') {
//             console.error('Push notification receipt error:', {
//               ticketId,
//               error: receipt.message,
//               details: receipt.details
//             });

//             // Handle specific errors
//             if (receipt.details?.error === 'DeviceNotRegistered') {
//               // Token should be removed - this would require storing ticket->token mapping
//               console.warn('Device not registered for ticket:', ticketId);
//             }
//           }
//         });
//       } catch (error) {
//         captureRemoteError(error, 'Error fetching push notification receipts');
//       }
//     }
//   } catch (error) {
//     captureRemoteError(error, 'Error handling push receipts');
//   }
// }