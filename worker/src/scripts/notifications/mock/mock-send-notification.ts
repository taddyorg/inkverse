import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '..', '..', '..', '..', '.env');
dotenv.config({ path: envPath });

import { NotificationEventType } from '@inkverse/shared-server/graphql/types';
import { NotificationSetting } from '@inkverse/shared-server/models/index';
import { DIGEST_EVENT_TYPES } from '@inkverse/shared-server/models/notification_setting';
import { NOTIFICATION_DEFAULTS } from '@inkverse/public/notifications';
import { buildPushNotificationPayload, sendPushToUser } from '@inkverse/shared-server/messaging/push-notifications/index';
import { buildNotificationEmailContent, sendNotificationEmail } from '@inkverse/shared-server/messaging/email/index';
import { getNotificationData } from '@inkverse/shared-server/messaging/notifications/index';

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
    console.error('Usage: npx tsx mock-send-notification.ts \\');
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
  const { eventType, recipientId, senderId, targetUuid, parentUuid } = params;

  console.log(`\n${'='.repeat(60)}`);
  console.log(`MOCK SEND NOTIFICATION`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Event Type:    ${eventType}`);
  console.log(`Recipient ID:  ${recipientId}`);
  console.log(`Sender ID:     ${senderId ?? 'none'}`);
  console.log(`Target:        ${params.targetType}/${targetUuid}`);
  if (parentUuid) console.log(`Parent:        ${params.parentType}/${parentUuid}`);
  console.log(`Delivery:      ${DIGEST_EVENT_TYPES.has(eventType) ? 'DIGEST (batched)' : 'IMMEDIATE'}`);
  console.log('');

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
  console.log('');

  if (!pushEnabled && !emailEnabled) {
    console.log('Both push and email disabled. Nothing to send.');
    process.exit(0);
  }

  // Fetch notification data
  console.log('Fetching notification data...');
  const { targetType, parentType } = params;
  const data = await getNotificationData({ eventType, recipientId, senderId, targetUuid, targetType, parentUuid, parentType });

  // Build payloads
  const pushPayload = buildPushNotificationPayload(eventType, data);
  const emailContent = buildNotificationEmailContent(eventType, data);

  // Send push
  console.log('\n--- PUSH ---');
  if (pushEnabled && pushPayload) {
    console.log(`Payload:`);
    console.log(`  title: ${pushPayload.title}`);
    console.log(`  body:  ${pushPayload.body}`);
    console.log(`  data:  ${JSON.stringify(pushPayload.data)}`);
    console.log(`Sending push to recipient ${recipientId}...`);
    await sendPushToUser(recipientId, pushPayload);
    console.log('Push sent (or logged in non-prod).');
  } else if (!pushEnabled) {
    console.log('SUPPRESSED (toggle off)');
  } else {
    console.log('No push payload generated for this event type.');
  }

  // Send email
  console.log('\n--- EMAIL ---');
  if (emailEnabled && emailContent && data.recipient?.email) {
    console.log(`Payload:`);
    console.log(`  to:      ${data.recipient.email}`);
    console.log(`  subject: ${emailContent.subject}`);
    console.log(`Sending email...`);
    await sendNotificationEmail(data.recipient.email, emailContent);
    console.log('Email sent (or logged in non-prod).');
  } else if (!emailEnabled) {
    console.log('SUPPRESSED (toggle off)');
  } else if (!data.recipient?.email) {
    console.log('No email address found for recipient.');
  } else {
    console.log('No email content generated for this event type.');
  }

  console.log(`\n${'='.repeat(60)}\n`);
  process.exit(0);
}

run();
