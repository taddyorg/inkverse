import { database } from '@inkverse/shared-server/database/index';
import { addFeedByUuid } from './add-new-feed-by-uuid.js';

function hasPositionGaps(positions: (number | null)[]): boolean {
  const validPositions = positions.filter((p): p is number => p !== null);
  return validPositions.some((pos, i) => i > 0 && pos !== (validPositions[i - 1] ?? 0) + 1);
}

async function checkSeriesForGaps(seriesUuid: string): Promise<boolean> {
  const issues = await database('comicissue')
    .select('position')
    .where('series_uuid', seriesUuid)
    .orderBy('position', 'asc');

  return hasPositionGaps(issues.map(issue => issue.position));
}

async function fixSeries(seriesUuid: string): Promise<boolean> {
  console.log(`\nChecking series: ${seriesUuid}`);

  const hasGaps = await checkSeriesForGaps(seriesUuid);

  if (!hasGaps) {
    console.log(`  No gaps found`);
    return false;
  }

  console.log(`  Gap(s) detected, triggering re-sync from Taddy API...`);
  try {
    await addFeedByUuid('comicseries', seriesUuid, 'created');
    console.log(`  Re-sync complete`);
    return true;
  } catch (error) {
    console.error(`  Re-sync failed:`, error);
    return false;
  }
}

async function getAllSeriesUuids(): Promise<string[]> {
  const results = await database('comicseries')
    .select('uuid')

  return results.map(result => result.uuid);
}

async function run() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage:');
    console.error('  yarn run fix-comic-positions <series-uuid>  - Fix a specific series');
    console.error('  yarn run fix-comic-positions all            - Fix all series with gaps');
    process.exit(1);
  }

  const isAllMode = args[0] === 'all';

  let seriesUuids: string[];

  if (isAllMode) {
    console.log('Fetching all series...');
    seriesUuids = await getAllSeriesUuids();
    console.log(`Found ${seriesUuids.length} series to check`);
  } else {
    seriesUuids = [args[0] ?? ''];
  }

  let totalChecked = 0;
  let totalWithGaps = 0;
  let totalFixed = 0;

  for (const seriesUuid of seriesUuids) {
    totalChecked++;
    const hadGaps = await fixSeries(seriesUuid);
    if (hadGaps) {
      totalWithGaps++;
      totalFixed++;
    }
  }

  console.log('\n--- Summary ---');
  console.log(`Total series checked: ${totalChecked}`);
  console.log(`Series with gaps: ${totalWithGaps}`);
  console.log(`Series re-synced: ${totalFixed}`);

  process.exit(0);
}

run();
