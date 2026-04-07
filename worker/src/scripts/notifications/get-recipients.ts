import { writeFile } from 'fs/promises';
import path from 'path';
import { UserNotification } from '@inkverse/shared-server/models/index';
import { DIGEST_EVENT_TYPES } from '@inkverse/shared-server/models/notification_setting';

export async function getRecipients(
  timeWindow: { start: number; end: number },
  outputDir: string
): Promise<void> {
  console.log('[get-recipients] Querying notifications...');

  const digestTypes = Array.from(DIGEST_EVENT_TYPES) as string[];

  let offset = 0;
  const batchSize = 1000;
  const userNotifications = new Map<number, any[]>();

  // Stream through notifications in batches
  while (true) {
    const notifications = await UserNotification.getNotificationsInWindow(
      digestTypes,
      timeWindow.start,
      timeWindow.end,
      batchSize,
      offset
    );

    if (notifications.length === 0) break;

    for (const n of notifications) {
      if (!userNotifications.has(n.recipientId)) {
        userNotifications.set(n.recipientId, []);
      }
      userNotifications.get(n.recipientId)!.push({
        eventType: n.eventType,
        targetUuid: n.targetUuid,
        targetType: n.targetType,
        senderId: n.senderId,
        parentUuid: n.parentUuid,
        parentType: n.parentType,
        createdAt: n.createdAt,
      });
    }

    offset += batchSize;

    // Write files in chunks to avoid memory buildup
    if (userNotifications.size >= 500) {
      await writeUserFiles(userNotifications, outputDir);
      userNotifications.clear();
    }
  }

  // Write remaining files
  if (userNotifications.size > 0) {
    await writeUserFiles(userNotifications, outputDir);
  }

  console.log(`[get-recipients] Done. Wrote files to ${outputDir}`);
}

async function writeUserFiles(
  userNotifications: Map<number, any[]>,
  outputDir: string
): Promise<void> {
  for (const [userId, notifications] of userNotifications) {
    const filePath = path.join(outputDir, `${userId}.json`);
    await writeFile(filePath, JSON.stringify(notifications));
  }
}
