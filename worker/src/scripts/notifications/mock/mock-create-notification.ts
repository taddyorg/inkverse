import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '..', '..', '..', '..', '.env');
dotenv.config({ path: envPath });

import { NotificationEventType } from '@inkverse/shared-server/graphql/types';
import { NotificationSetting, UserNotification } from '@inkverse/shared-server/models/index';
import { DIGEST_EVENT_TYPES } from '@inkverse/shared-server/models/notification_setting';
import { NOTIFICATION_DEFAULTS } from '@inkverse/public/notifications';
import { buildPushNotificationPayload } from '@inkverse/shared-server/messaging/push-notifications/index';
import { buildNotificationEmailContent } from '@inkverse/shared-server/messaging/email/index';
import { getNotificationData } from '@inkverse/shared-server/messaging/notifications/index';
import { purgeCacheOnCdn } from '@inkverse/shared-server/cache/index';

function parseArgs(): {
  eventType: NotificationEventType;
  recipientId: number;
  senderId: number | null;
  targetUuid: string;
  targetType: string;
  parentUuid?: string;
  parentType?: string;
} {
  const args = process.argv.slice(2);
  const parsed: Record<string, string> = {};

  for (const arg of args) {
    const match = arg.match(/^--(\w+)=(.+)$/);
    if (match) {
      parsed[match[1]!] = match[2]!;
    }
  }

  if (!parsed.eventType || !parsed.recipientId || !parsed.targetUuid || !parsed.targetType) {
    console.error('Usage: npx tsx mock-create-notification.ts \\');
    console.error('  --eventType=COMMENT_REPLY \\');
    console.error('  --recipientId=42 \\');
    console.error('  --senderId=99 \\');
    console.error('  --targetUuid=abc123 \\');
    console.error('  --targetType=COMMENT \\');
    console.error('  --parentUuid=def456 \\');
    console.error('  --parentType=COMICISSUE');
    console.error('');
    console.error('Event types:', Object.values(NotificationEventType).join(', '));
    process.exit(1);
  }

  const eventType = parsed.eventType as NotificationEventType;
  if (!Object.values(NotificationEventType).includes(eventType)) {
    console.error(`Invalid eventType: ${parsed.eventType}`);
    console.error('Valid types:', Object.values(NotificationEventType).join(', '));
    process.exit(1);
  }

  return {
    eventType,
    recipientId: parseInt(parsed.recipientId!, 10),
    senderId: parsed.senderId ? parseInt(parsed.senderId, 10) : null,
    targetUuid: parsed.targetUuid!,
    targetType: parsed.targetType!,
    parentUuid: parsed.parentUuid,
    parentType: parsed.parentType,
  };
}

async function run() {
  const params = parseArgs();
  const { eventType, recipientId, senderId, targetUuid, targetType, parentUuid, parentType } = params;

  console.log(`\n${'='.repeat(60)}`);
  console.log(`MOCK CREATE NOTIFICATION`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Event Type:    ${eventType}`);
  console.log(`Recipient ID:  ${recipientId}`);
  console.log(`Sender ID:     ${senderId ?? 'none'}`);
  console.log(`Target:        ${targetType}/${targetUuid}`);
  if (parentUuid) console.log(`Parent:        ${parentType}/${parentUuid}`);
  console.log(`Delivery:      ${DIGEST_EVENT_TYPES.has(eventType) ? 'DIGEST (batched)' : 'IMMEDIATE'}`);

  // Self-notification check
  if (senderId && recipientId === senderId) {
    console.log('SKIPPED: senderId === recipientId (self-notification)');
    process.exit(0);
  }

  // Resolve effective settings
  const overrides = await NotificationSetting.getOverridesForUser(recipientId);
  const defaults = NOTIFICATION_DEFAULTS[eventType];
  const pushEnabled = overrides[eventType]?.PUSH ?? defaults?.PUSH ?? false;
  const emailEnabled = overrides[eventType]?.EMAIL ?? defaults?.EMAIL ?? false;

  const pushOverridden = overrides[eventType]?.PUSH !== undefined;
  const emailOverridden = overrides[eventType]?.EMAIL !== undefined;

  console.log(`Settings:`);
  console.log(`  PUSH:  ${pushEnabled ? 'ON' : 'OFF'} ${pushOverridden ? '(user override)' : '(default)'}`);
  console.log(`  EMAIL: ${emailEnabled ? 'ON' : 'OFF'} ${emailOverridden ? '(user override)' : '(default)'}`);

  // Both disabled check
  if (!pushEnabled && !emailEnabled) {
    console.log('SKIPPED: Both push and email disabled — no in-app row will be created either.');
    console.log('(This is the current behavior in createNotification line 96)');
    process.exit(0);
  }

  // Create in-app notification row
  console.log('Creating in-app notification row...');
  const row = await UserNotification.createNotification({
    recipientId, senderId, eventType, targetUuid, targetType, parentUuid, parentType,
  });
  console.log(`Created notification row: id=${row.id}, createdAt=${row.createdAt}`);

  // Purge cache
  purgeCacheOnCdn({ type: 'notificationfeed', id: String(recipientId) });
  console.log(`Purged notification feed cache for recipient ${recipientId}`);

  // Show what would be sent
  if (DIGEST_EVENT_TYPES.has(eventType)) {
    console.log('This is an AGGREGATED event type.');
    console.log('Push/email will NOT be sent immediately.');
    console.log('Run mock-send-digest.ts to process the digest for this user.');
  } else {
    console.log('This is an IMMEDIATE event type. Previewing payloads:');

    const data = await getNotificationData({ eventType, recipientId, senderId, targetUuid, targetType, parentUuid, parentType });
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

    if (emailEnabled && emailContent && data.recipient?.email) {
      console.log('  EMAIL payload:');
      console.log(`    to:      ${data.recipient.email}`);
      console.log(`    subject: ${emailContent.subject}`);
    } else if (!emailEnabled) {
      console.log('  EMAIL: SUPPRESSED (toggle off)');
    } else if (!data.recipient?.email) {
      console.log('  EMAIL: No email address on recipient');
    } else {
      console.log('  EMAIL: No email content generated');
    }

    console.log('To actually send, run mock-send-notification.ts with the same args.');
  }

  console.log(`\n${'='.repeat(60)}\n`);
  process.exit(0);
}

run();
