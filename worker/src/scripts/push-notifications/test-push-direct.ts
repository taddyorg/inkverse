import { Expo, type ExpoPushMessage } from 'expo-server-sdk';
import { UserDevice } from '@inkverse/shared-server/models/index';
import type { UserDeviceModel } from '@inkverse/shared-server/database/types';

import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '..', '..', '..', '.env');
dotenv.config({ path: envPath });

console.log('process.env.EXPO_PUSH_ACCESS_TOKEN', process.env.EXPO_PUSH_ACCESS_TOKEN);

// Initialize Expo SDK
const expo = new Expo({ accessToken: process.env.EXPO_PUSH_ACCESS_TOKEN });

async function run() {
  const userId = process.argv[2];

  if (!userId) {
    console.error('Usage: npx tsx src/scripts/push-notifications/test-push-direct.ts <user_id>');
    console.error('');
    console.error('Example:');
    console.error('  npx tsx src/scripts/push-notifications/test-push-direct.ts 123');
    process.exit(1);
  }

  console.log(`Looking up push tokens for user ${userId}...`);

  const devices = await UserDevice.getPushTokensForUser(userId);

  if (devices.length === 0) {
    console.error(`No push tokens found for user ${userId}`);
    process.exit(1);
  }

  console.log(`Found ${devices.length} device(s):`);
  devices.forEach((device: UserDeviceModel, i: number) => {
    console.log(`  ${i + 1}. ${device.platform}: ${device.fcmToken.substring(0, 30)}...`);
  });

  // Filter to valid Expo tokens
  const validDevices = devices.filter((device: UserDeviceModel) => Expo.isExpoPushToken(device.fcmToken));

  if (validDevices.length === 0) {
    console.error('No valid Expo push tokens found');
    process.exit(1);
  }

  console.log(`\nSending test notification to ${validDevices.length} valid token(s)...`);

  // Build messages
  const messages: ExpoPushMessage[] = validDevices.map((device: UserDeviceModel) => ({
    to: device.fcmToken,
    title: 'Test Notification',
    body: 'This is a test push notification from Inkverse!',
    data: {
      type: 'NEW_EPISODE_RELEASED',
      seriesUuid: 'test-series-uuid',
      issueUuid: 'test-issue-uuid',
    },
    priority: 'high',
    channelId: 'NEW_EPISODE_RELEASED',
    sound: 'default',
  }));

  try {
    const tickets = await expo.sendPushNotificationsAsync(messages);
    console.log('\nPush tickets received:');
    tickets.forEach((ticket, i) => {
      console.log(`  ${i + 1}. ${JSON.stringify(ticket)}`);
    });
    console.log('\nDone!');
  } catch (error) {
    console.error('Error sending push notification:', error);
    process.exit(1);
  }

  process.exit(0);
}

run();
