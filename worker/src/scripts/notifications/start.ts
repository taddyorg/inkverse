import path from 'path';
import { mkdir, rm } from 'fs/promises';
import { getRecipients } from './get-recipients.js';
import { buildAndSendDigests } from './build-and-send-digests.js';

async function main() {
  try {
    // Time window: 7am PST yesterday → 7am PST today
    const now = new Date();
    const today7amPST = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
    today7amPST.setHours(7, 0, 0, 0);

    const yesterday7amPST = new Date(today7amPST);
    yesterday7amPST.setDate(yesterday7amPST.getDate() - 1);

    const timeWindow = {
      start: Math.floor(yesterday7amPST.getTime() / 1000),
      end: Math.floor(today7amPST.getTime() / 1000),
    };

    const outputDir = path.join(process.cwd(), 'output', 'digests');

    // Setup: clean output folder
    await rm(outputDir, { recursive: true, force: true });
    await mkdir(outputDir, { recursive: true });

    console.log(`[send-notification-digests] Time window: ${new Date(timeWindow.start * 1000).toISOString()} → ${new Date(timeWindow.end * 1000).toISOString()}`);

    // Step 1: Query notifications → output/digests/{user_id}.json
    await getRecipients(timeWindow, outputDir);

    // Step 2: Aggregate + send digests
    await buildAndSendDigests(outputDir);

    console.log('[send-notification-digests] Program finished.');
    process.exit(0);
  } catch (error) {
    console.error('[send-notification-digests] Error:', error);
    process.exit(1);
  }
}

main();
