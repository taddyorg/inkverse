import { database } from '@inkverse/shared-server/database/index';
import { UserNotification } from '@inkverse/shared-server/models/index';

const APRIL_10_EPOCH = 1744243200; // April 10, 2026 00:00 UTC
const BATCH_SIZE = 1000;
const DRY_RUN = process.argv.includes('--dry-run');

type MissingNotification = {
  sender_id: number;
  issue_uuid: string;
  series_uuid: string;
  recipient_id: number;
};

async function getMissingNotifications(): Promise<MissingNotification[]> {
  const { rows } = await database.raw(`
    SELECT ul.user_id AS sender_id,
           ul.likeable_uuid AS issue_uuid,
           ul.parent_uuid AS series_uuid,
           u.id AS recipient_id
    FROM user_likes ul
    JOIN creatorcontent cc ON cc.content_uuid = ul.parent_uuid
                           AND cc.content_type = 'COMICSERIES'
    JOIN users u ON u.creator_uuid = cc.creator_uuid
    WHERE ul.likeable_type = 'COMICISSUE'
      AND ul.created_at >= ?
      AND ul.user_id != u.id
      AND NOT EXISTS (
        SELECT 1 FROM user_notifications un
        WHERE un.event_type = 'CREATOR_EPISODE_LIKED'
          AND un.sender_id = ul.user_id
          AND un.target_uuid = ul.likeable_uuid::text
          AND un.recipient_id = u.id
      )
  `, [APRIL_10_EPOCH]);

  return rows;
}

async function main() {
  try {
    console.log(`[backfill-superlike-notifications] Starting${DRY_RUN ? ' (DRY RUN)' : ''}...`);

    const missing = await getMissingNotifications();
    console.log(`[backfill-superlike-notifications] Found ${missing.length} missing notifications.`);

    if (missing.length === 0) {
      console.log('[backfill-superlike-notifications] Nothing to backfill.');
      process.exit(0);
    }

    if (DRY_RUN) {
      console.log('[backfill-superlike-notifications] Sample rows:');
      for (const row of missing.slice(0, 10)) {
        console.log(`  sender=${row.sender_id} recipient=${row.recipient_id} series=${row.series_uuid} issue=${row.issue_uuid}`);
      }
      process.exit(0);
    }

    // Insert in batches
    let inserted = 0;
    for (let i = 0; i < missing.length; i += BATCH_SIZE) {
      const batch = missing.slice(i, i + BATCH_SIZE);

      await UserNotification.createBatchNotifications(
        batch.map(row => ({
          recipientId: row.recipient_id,
          senderId: row.sender_id,
          eventType: 'CREATOR_EPISODE_LIKED',
          targetUuid: row.issue_uuid,
          targetType: 'COMICISSUE',
          parentUuid: row.series_uuid,
          parentType: 'COMICSERIES',
        }))
      );

      inserted += batch.length;
      console.log(`[backfill-superlike-notifications] Inserted ${inserted}/${missing.length}`);
    }

    console.log(`[backfill-superlike-notifications] Done. Inserted ${inserted} notifications.`);
    process.exit(0);
  } catch (error) {
    console.error('[backfill-superlike-notifications] Error:', error);
    process.exit(1);
  }
}

main();
