import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '..', '..', '..', '..', '.env');
dotenv.config({ path: envPath });

import { NotificationEventType } from '@inkverse/shared-server/graphql/types';
import { NotificationSetting, UserNotification, User, CreatorContent } from '@inkverse/shared-server/models/index';
import { DIGEST_EVENT_TYPES } from '@inkverse/shared-server/models/notification_setting';
import { NOTIFICATION_DEFAULTS } from '@inkverse/public/notifications';
import { buildPushNotificationPayload } from '@inkverse/shared-server/messaging/push-notifications/index';
import { buildNotificationEmailContent } from '@inkverse/shared-server/messaging/email/index';
import { getNotificationData } from '@inkverse/shared-server/messaging/notifications/index';
import { purgeCacheOnCdn } from '@inkverse/shared-server/cache/index';

const CREATOR_EVENT_TYPES = [
  NotificationEventType.CREATOR_EPISODE_LIKED,
  NotificationEventType.CREATOR_EPISODE_COMMENTED,
];

function parseArgs(): {
  eventType: NotificationEventType;
  seriesUuid: string;
  issueUuid: string;
  senderId: number;
} {
  const args = process.argv.slice(2);
  const parsed: Record<string, string> = {};

  for (const arg of args) {
    const match = arg.match(/^--(\w+)=(.+)$/);
    if (match) {
      parsed[match[1]!] = match[2]!;
    }
  }

  if (!parsed.eventType || !parsed.seriesUuid || !parsed.issueUuid || !parsed.senderId) {
    console.error('Usage: npx tsx mock-create-creator-notification.ts \\');
    console.error('  --eventType=CREATOR_EPISODE_LIKED \\');
    console.error('  --seriesUuid=abc123 \\');
    console.error('  --issueUuid=def456 \\');
    console.error('  --senderId=20');
    console.error('');
    console.error('Creator event types:', CREATOR_EVENT_TYPES.join(', '));
    process.exit(1);
  }

  const eventType = parsed.eventType as NotificationEventType;
  if (!CREATOR_EVENT_TYPES.includes(eventType)) {
    console.error(`Invalid eventType: ${parsed.eventType}`);
    console.error('Creator event types:', CREATOR_EVENT_TYPES.join(', '));
    process.exit(1);
  }

  return {
    eventType,
    seriesUuid: parsed.seriesUuid!,
    issueUuid: parsed.issueUuid!,
    senderId: parseInt(parsed.senderId!, 10),
  };
}

async function run() {
  const { eventType, seriesUuid, issueUuid, senderId } = parseArgs();

  console.log(`\n${'='.repeat(60)}`);
  console.log(`MOCK CREATE CREATOR NOTIFICATION`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Event Type:   ${eventType}`);
  console.log(`Series UUID:  ${seriesUuid}`);
  console.log(`Issue UUID:   ${issueUuid}`);
  console.log(`Sender ID:    ${senderId}`);
  console.log(`Delivery:     ${DIGEST_EVENT_TYPES.has(eventType) ? 'DIGEST (batched)' : 'IMMEDIATE'}`);
  console.log('');

  // Resolve creator from series (mirrors notifySeriesCreator)
  console.log('Resolving series creator...');
  const creatorUuid = await CreatorContent.getCreatorUuidForContent(seriesUuid);
  if (!creatorUuid) {
    console.error(`No creator found for series ${seriesUuid}`);
    process.exit(1);
  }
  console.log(`  Creator UUID: ${creatorUuid}`);

  const creatorUser = await User.getUserByCreatorUuid(creatorUuid);
  if (!creatorUser) {
    console.error(`No user account found for creator ${creatorUuid}`);
    process.exit(1);
  }

  const recipientId = Number(creatorUser.id);
  console.log(`  Creator User ID: ${recipientId}`);
  console.log(`  Creator Name: ${creatorUser.name || 'N/A'}`);
  console.log(`  Creator Email: ${creatorUser.email || 'N/A'}`);
  console.log('');

  // Self-notification check
  if (recipientId === senderId) {
    console.log('SKIPPED: sender is the series creator (self-notification)');
    process.exit(0);
  }

  // Resolve effective settings
  const overrides = await NotificationSetting.getOverridesForUser(recipientId);
  const defaults = NOTIFICATION_DEFAULTS[eventType];
  const pushEnabled = overrides[eventType]?.PUSH ?? defaults?.PUSH ?? false;
  const emailEnabled = overrides[eventType]?.EMAIL ?? defaults?.EMAIL ?? false;

  const pushOverridden = overrides[eventType]?.PUSH !== undefined;
  const emailOverridden = overrides[eventType]?.EMAIL !== undefined;

  console.log(`Settings for creator (recipientId=${recipientId}):`);
  console.log(`  PUSH:  ${pushEnabled ? 'ON' : 'OFF'} ${pushOverridden ? '(user override)' : '(default)'}`);
  console.log(`  EMAIL: ${emailEnabled ? 'ON' : 'OFF'} ${emailOverridden ? '(user override)' : '(default)'}`);
  console.log('');

  // Both disabled check
  if (!pushEnabled && !emailEnabled) {
    console.log('SKIPPED: Both push and email disabled — no in-app row will be created either.');
    process.exit(0);
  }

  // Create in-app notification row
  console.log('Creating in-app notification row...');
  const row = await UserNotification.createNotification({
    recipientId,
    senderId,
    eventType,
    targetUuid: issueUuid,
    targetType: 'COMICISSUE',
    parentUuid: seriesUuid,
    parentType: 'COMICSERIES',
  });
  console.log(`Created notification row: id=${row.id}, createdAt=${row.createdAt}`);

  // Purge cache
  purgeCacheOnCdn({ type: 'notificationfeed', id: String(recipientId) });
  console.log(`Purged notification feed cache for recipient ${recipientId}`);
  console.log('');

  // Show what would be sent
  if (DIGEST_EVENT_TYPES.has(eventType)) {
    console.log('This is an AGGREGATED event type.');
    console.log('Push/email will NOT be sent immediately.');
    console.log(`Run: mock-send-digest.ts --userId=${recipientId}`);
    console.log(`Or send directly: mock-send-notification.ts --recipientId=${recipientId} --senderId=${senderId} --eventType=${eventType} --targetUuid=${issueUuid} --targetType=COMICISSUE --parentUuid=${seriesUuid} --parentType=COMICSERIES`);
  } else {
    console.log('This is an IMMEDIATE event type. Previewing payloads:');
    console.log('');

    const data = await getNotificationData({
      eventType, recipientId, senderId,
      targetUuid: issueUuid, targetType: 'COMICISSUE',
      parentUuid: seriesUuid, parentType: 'COMICSERIES',
    });
    const pushPayload = buildPushNotificationPayload(eventType, data);
    const emailContent = buildNotificationEmailContent(eventType, data);

    if (pushEnabled && pushPayload) {
      console.log('  PUSH payload:');
      console.log(`    title: ${pushPayload.title}`);
      console.log(`    body:  ${pushPayload.body}`);
      console.log(`    data:  ${JSON.stringify(pushPayload.data)}`);
    } else if (!pushEnabled) {
      console.log('  PUSH: SUPPRESSED (toggle off)');
    } else {
      console.log('  PUSH: No payload generated');
    }

    console.log('');

    if (emailEnabled && emailContent && creatorUser.email) {
      console.log('  EMAIL payload:');
      console.log(`    to:      ${creatorUser.email}`);
      console.log(`    subject: ${emailContent.subject}`);
    } else if (!emailEnabled) {
      console.log('  EMAIL: SUPPRESSED (toggle off)');
    } else if (!creatorUser.email) {
      console.log('  EMAIL: No email address on creator');
    } else {
      console.log('  EMAIL: No email content generated');
    }

    console.log('');
    console.log(`To actually send: mock-send-notification.ts --recipientId=${recipientId} --senderId=${senderId} --eventType=${eventType} --targetUuid=${issueUuid} --targetType=COMICISSUE --parentUuid=${seriesUuid} --parentType=COMICSERIES`);
  }

  console.log(`\n${'='.repeat(60)}\n`);
  process.exit(0);
}

run();
