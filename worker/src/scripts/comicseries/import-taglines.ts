/**
 * Import taglines from a CSV produced by export-taglines (after editing the
 * `tagline` column). Only the `uuid` and `tagline` columns are read, so the
 * other columns can be reordered or dropped.
 *
 *   yarn workspace worker import-taglines [input.csv]
 *   NODE_ENV=production yarn workspace worker import-taglines [input.csv]   # purges CDN caches
 *
 * Defaults to worker/input/comicseries-taglines.csv. A relative path may be
 * taken from the repo root or from worker/.
 * Rows whose tagline matches the database are skipped. An empty cell clears
 * the tagline. If any row fails tagline validation, nothing is written.
 */

import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

import { database, type ComicSeriesModel } from '@inkverse/shared-server/database/index';
import { ComicSeries } from '@inkverse/shared-server/models/index';
import { purgeCacheOnCdn } from '@inkverse/shared-server/cache/index';
import { MAX_TAGLINE_LENGTH, TAGLINE_REGEX, TAGLINE_INVALID_MESSAGE, normalizeTagline } from '@inkverse/public/comicseries';
import { resolveInputPath } from './paths.js';

type CsvRow = { uuid?: string; tagline?: string };
type CurrentRow = Pick<ComicSeriesModel, 'uuid' | 'name' | 'shortUrl' | 'tagline'>;
type Change = { current: CurrentRow; next: string | null };

function validateTagline(tagline: string | null): string | null {
  if (tagline === null) { return null; }
  if (tagline.length > MAX_TAGLINE_LENGTH) { return `Tagline cannot exceed ${MAX_TAGLINE_LENGTH} characters`; }
  if (!TAGLINE_REGEX.test(tagline)) { return TAGLINE_INVALID_MESSAGE; }
  return null;
}

async function run() {
  const inputPath = resolveInputPath(process.argv[2]);
  if (!fs.existsSync(inputPath)) {
    console.error(`No CSV found at ${inputPath}\nUsage: yarn workspace worker import-taglines [input.csv]`);
    process.exit(1);
  }

  const rows: CsvRow[] = parse(fs.readFileSync(inputPath), { columns: true, bom: true, trim: true, skip_empty_lines: true });
  console.log(`Read ${rows.length} rows from ${inputPath}`);

  const csvUuids = rows.map((row) => row.uuid).filter((uuid): uuid is string => !!uuid);
  const currentRows: CurrentRow[] = await database('comicseries')
    .select('uuid', 'name', 'shortUrl', 'tagline')
    .whereIn('uuid', csvUuids);
  const currentByUuid = new Map(currentRows.map((row) => [row.uuid, row]));

  const changes: Change[] = [];
  const invalid: string[] = [];
  const unknown: string[] = [];
  let unchanged = 0;

  rows.forEach((row, index) => {
    const lineLabel = `row ${index + 2}`;
    if (!row.uuid) {
      unknown.push(`${lineLabel}: missing uuid`);
      return;
    }

    const current = currentByUuid.get(row.uuid);
    if (!current) {
      unknown.push(`${lineLabel}: uuid ${row.uuid} not found`);
      return;
    }

    const next = normalizeTagline(row.tagline ?? '') || null;
    const error = validateTagline(next);
    if (error) {
      invalid.push(`${lineLabel} (${current.name ?? current.uuid}): "${row.tagline}" - ${error}`);
      return;
    }

    if (next === current.tagline) {
      unchanged++;
      return;
    }

    changes.push({ current, next });
  });

  if (unknown.length > 0) {
    console.log(`\nSkipping ${unknown.length} row(s) with no matching comic series:`);
    unknown.forEach((line) => console.log(`  ${line}`));
  }

  if (invalid.length > 0) {
    console.error(`\n${invalid.length} row(s) have invalid taglines. Nothing was written. Fix them and re-run:`);
    invalid.forEach((line) => console.error(`  ${line}`));
    process.exit(1);
  }

  console.log(`\n${changes.length} tagline(s) to update:`);
  let updated = 0;
  let cleared = 0;

  for (const { current, next } of changes) {
    console.log(`  ${current.name ?? current.uuid} (${current.uuid}): "${current.tagline ?? ''}" -> "${next ?? ''}"`);
    const result = await ComicSeries.updateComicSeriesTagline(current.uuid, next);
    if (!result) {
      console.error(`    update failed, no row returned`);
      continue;
    }
    await purgeCacheOnCdn({ type: 'comicseries', id: current.uuid, shortUrl: current.shortUrl });
    if (next === null) { cleared++; } else { updated++; }
  }

  console.log('\n--- Summary ---');
  console.log(`Rows in CSV: ${rows.length}`);
  console.log(`Unchanged: ${unchanged}`);
  console.log(`Updated: ${updated}`);
  console.log(`Cleared: ${cleared}`);
  console.log(`Unknown uuids: ${unknown.length}`);

  process.exit(0);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
