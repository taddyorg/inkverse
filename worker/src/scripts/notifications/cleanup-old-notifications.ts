import { UserNotification } from '@inkverse/shared-server/models/index';

async function main() {
  try {
    console.log('[cleanup-old-notifications] Starting cleanup...');

    // 6 months ago in epoch seconds
    const sixMonthsAgo = Math.floor(Date.now() / 1000) - (6 * 30 * 24 * 60 * 60);

    const deletedCount = await UserNotification.deleteOldNotifications(sixMonthsAgo);

    console.log(`[cleanup-old-notifications] Deleted ${deletedCount} old notifications.`);
    console.log('[cleanup-old-notifications] Program finished.');
    process.exit(0);
  } catch (error) {
    console.error('[cleanup-old-notifications] Error:', error);
    process.exit(1);
  }
}

main();
