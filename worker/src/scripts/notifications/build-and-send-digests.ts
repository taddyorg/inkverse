import { readdir, readFile } from 'fs/promises';
import path from 'path';
import { NotificationSetting } from '@inkverse/shared-server/models/index';
import { NOTIFICATION_DEFAULTS } from '@inkverse/public/notifications';
import type { NotificationEventType } from '@inkverse/shared-server/graphql/types';
import { sendPushToUser, buildDigestPushPayload } from '@inkverse/shared-server/messaging/push-notifications/index';
import { sendDigestEmail } from '@inkverse/shared-server/messaging/email/index';
import { computeDigestTotals } from '@inkverse/shared-server/messaging/notifications/digest';

type NotificationRow = {
  eventType: string;
  targetUuid: string;
  targetType: string;
  senderId: number | null;
  parentUuid: string | null;
  parentType: string | null;
  createdAt: number;
};

type AggregatedDigestItem = {
  eventType: string;
  targetUuid: string;
  count: number;
  senderIds: number[];
};

export async function buildAndSendDigests(outputDir: string): Promise<void> {
  console.log('[build-and-send-digests] Processing digest files...');

  let files: string[];
  try {
    files = await readdir(outputDir);
  } catch {
    console.log('[build-and-send-digests] No digest directory found.');
    return;
  }

  const jsonFiles = files.filter(f => f.endsWith('.json'));
  console.log(`[build-and-send-digests] Found ${jsonFiles.length} recipient files.`);

  let sentCount = 0;

  for (const file of jsonFiles) {
    try {
      const userId = parseInt(path.basename(file, '.json'), 10);
      if (isNaN(userId)) continue;

      const content = await readFile(path.join(outputDir, file), 'utf-8');
      const notifications: NotificationRow[] = JSON.parse(content);

      if (notifications.length === 0) continue;

      // Aggregate by (event_type, target_uuid)
      const aggregated = new Map<string, AggregatedDigestItem>();
      for (const n of notifications) {
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

      // Check user's notification settings
      const overrides = await NotificationSetting.getOverridesForUser(userId);
      const eventTypes = new Set(digestItems.map(d => d.eventType));

      let pushEnabled = false;
      let emailEnabled = false;
      for (const et of eventTypes) {
        const defaults = NOTIFICATION_DEFAULTS[et as NotificationEventType];
        if (!defaults) continue;
        const pushOn = overrides[et]?.PUSH ?? defaults.PUSH;
        const emailOn = overrides[et]?.EMAIL ?? defaults.EMAIL;
        if (pushOn) pushEnabled = true;
        if (emailOn) emailEnabled = true;
      }

      if (!pushEnabled && !emailEnabled) continue;

      // Compute per-category totals
      const totals = computeDigestTotals(digestItems);

      // Send digest push
      if (pushEnabled) {
        await sendPushToUser(userId, buildDigestPushPayload(totals)).catch(err =>
          console.error(`[build-and-send-digests] Push error for user ${userId}:`, err)
        );
      }

      // Send digest email
      if (emailEnabled) {
        await sendDigestEmail(userId, totals).catch(err =>
          console.error(`[build-and-send-digests] Email error for user ${userId}:`, err)
        );
      }

      sentCount++;
    } catch (error) {
      console.error(`[build-and-send-digests] Error processing file ${file}:`, error);
    }
  }

  console.log(`[build-and-send-digests] Sent digests to ${sentCount} users.`);
}
