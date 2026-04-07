import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '..', '..', '..', '..', '.env');
dotenv.config({ path: envPath });

import { NotificationSetting, UserNotification } from '@inkverse/shared-server/models/index';
import { DIGEST_EVENT_TYPES } from '@inkverse/shared-server/models/notification_setting';
import { NOTIFICATION_DEFAULTS } from '@inkverse/public/notifications';
import type { NotificationEventType } from '@inkverse/shared-server/graphql/types';
import { sendPushToUser, buildDigestPushPayload } from '@inkverse/shared-server/messaging/push-notifications/index';
import { sendDigestEmail } from '@inkverse/shared-server/messaging/email/index';
import { computeDigestTotals, getDigestText } from '@inkverse/shared-server/messaging/notifications/digest';

type AggregatedDigestItem = {
  eventType: string;
  targetUuid: string;
  count: number;
  senderIds: number[];
};

function parseArgs(): { userId: number } {
  const args = process.argv.slice(2);
  const parsed: Record<string, string> = {};

  for (const arg of args) {
    const match = arg.match(/^--(\w+)=(.+)$/);
    if (match) {
      parsed[match[1]!] = match[2]!;
    }
  }

  if (!parsed.userId) {
    console.error('Usage: npx tsx mock-send-digest.ts --userId=99');
    process.exit(1);
  }

  return { userId: parseInt(parsed.userId!, 10) };
}

async function run() {
  const { userId } = parseArgs();

  console.log(`\n${'='.repeat(60)}`);
  console.log(`MOCK SEND DIGEST`);
  console.log(`${'='.repeat(60)}`);
  console.log(`User ID: ${userId}`);
  console.log('');

  // Time window: last 24h (same approach as start.ts)
  const now = new Date();
  const today9amPST = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
  today9amPST.setHours(9, 0, 0, 0);

  const yesterday9amPST = new Date(today9amPST);
  yesterday9amPST.setDate(yesterday9amPST.getDate() - 1);

  const windowStart = Math.floor(yesterday9amPST.getTime() / 1000);
  const windowEnd = Math.floor(now.getTime() / 1000);

  console.log(`Time window: ${new Date(windowStart * 1000).toISOString()} -> ${new Date(windowEnd * 1000).toISOString()}`);
  console.log('');

  // Query aggregated notifications for this user
  const digestTypes = Array.from(DIGEST_EVENT_TYPES) as string[];
  let offset = 0;
  const batchSize = 1000;
  const userNotifications: Array<{
    eventType: string;
    targetUuid: string;
    senderId: number | null;
  }> = [];

  console.log('Querying aggregated notifications...');

  while (true) {
    const notifications = await UserNotification.getNotificationsInWindow(
      digestTypes, windowStart, windowEnd, batchSize, offset
    );

    if (notifications.length === 0) break;

    for (const n of notifications) {
      if (Number(n.recipientId) === userId) {
        userNotifications.push({
          eventType: n.eventType,
          targetUuid: n.targetUuid,
          senderId: n.senderId,
        });
      }
    }

    offset += batchSize;
  }

  console.log(`Found ${userNotifications.length} aggregated notifications for user ${userId}.`);

  if (userNotifications.length === 0) {
    console.log('No aggregated notifications to digest. Seed some first with mock-create-notification.ts.');
    process.exit(0);
  }

  // Aggregate by {eventType}:{targetUuid}
  const aggregated = new Map<string, AggregatedDigestItem>();
  for (const n of userNotifications) {
    const key = `${n.eventType}:${n.targetUuid}`;
    if (!aggregated.has(key)) {
      aggregated.set(key, {
        eventType: n.eventType,
        targetUuid: n.targetUuid,
        count: 0,
        senderIds: [],
      });
    }
    const item = aggregated.get(key)!;
    item.count++;
    if (n.senderId) item.senderIds.push(n.senderId);
  }

  const digestItems = Array.from(aggregated.values());

  console.log(`\nAggregated into ${digestItems.length} digest items:`);
  for (const item of digestItems) {
    console.log(`  ${item.eventType} / ${item.targetUuid}: ${item.count} event(s), ${item.senderIds.length} sender(s)`);
  }
  console.log('');

  // Check notification settings
  const overrides = await NotificationSetting.getOverridesForUser(userId);
  const eventTypes = new Set(digestItems.map(d => d.eventType));

  let pushEnabled = false;
  let emailEnabled = false;

  console.log('Settings per event type:');
  for (const et of eventTypes) {
    const defaults = NOTIFICATION_DEFAULTS[et as NotificationEventType];
    if (!defaults) {
      console.log(`  ${et}: No defaults found, skipping.`);
      continue;
    }
    const pushOn = overrides[et]?.PUSH ?? defaults.PUSH;
    const emailOn = overrides[et]?.EMAIL ?? defaults.EMAIL;
    const pushOverridden = overrides[et]?.PUSH !== undefined;
    const emailOverridden = overrides[et]?.EMAIL !== undefined;

    console.log(`  ${et}:`);
    console.log(`    PUSH:  ${pushOn ? 'ON' : 'OFF'} ${pushOverridden ? '(user override)' : '(default)'}`);
    console.log(`    EMAIL: ${emailOn ? 'ON' : 'OFF'} ${emailOverridden ? '(user override)' : '(default)'}`);

    if (pushOn) pushEnabled = true;
    if (emailOn) emailEnabled = true;
  }

  console.log('');
  console.log(`Digest channels (OR across event types):`);
  console.log(`  PUSH:  ${pushEnabled ? 'ON' : 'OFF'}`);
  console.log(`  EMAIL: ${emailEnabled ? 'ON' : 'OFF'}`);
  console.log('');

  if (!pushEnabled && !emailEnabled) {
    console.log('Both channels disabled across all event types. Skipping digest.');
    process.exit(0);
  }

  // Compute digest totals and text
  const totals = computeDigestTotals(digestItems);
  const { title, body } = getDigestText(totals);

  console.log(`Digest totals: ${JSON.stringify(totals)}`);
  console.log(`Digest title:  ${title}`);
  console.log(`Digest body:   ${body}`);
  console.log('');

  // Send digest push
  console.log('--- PUSH ---');
  if (pushEnabled) {
    const pushPayload = buildDigestPushPayload(totals);
    console.log(`Payload: ${JSON.stringify(pushPayload, null, 2)}`);
    console.log(`Sending digest push to user ${userId}...`);
    await sendPushToUser(userId, pushPayload).catch(err =>
      console.error(`Push error:`, err)
    );
    console.log('Push sent (or logged in non-prod).');
  } else {
    console.log('SUPPRESSED (all event types have push off)');
  }

  // Send digest email
  console.log('\n--- EMAIL ---');
  if (emailEnabled) {
    console.log(`Sending digest email to user ${userId}...`);
    await sendDigestEmail(userId, totals).catch(err =>
      console.error(`Email error:`, err)
    );
    console.log('Email sent (or logged in non-prod).');
  } else {
    console.log('SUPPRESSED (all event types have email off)');
  }

  console.log(`\n${'='.repeat(60)}\n`);
  process.exit(0);
}

run();
