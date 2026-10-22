/**
 * Export every (non-blocked) comic series to a CSV so taglines can be reviewed
 * and edited in a spreadsheet, then written back with import-taglines.
 *
 *   yarn workspace worker export-taglines [output.csv]
 *
 * Defaults to worker/output/comicseries-taglines.csv. A relative output path is
 * taken from the repo root. Rows are fetched in batches of 100 and streamed
 * straight to the file.
 */

import fs from 'fs';
import path from 'path';
import { stringify } from 'csv-stringify';

import { database, type ComicSeriesModel } from '@inkverse/shared-server/database/index';
import { getPrettyGenre } from '@inkverse/public/genres';
import { resolveOutputPath } from './paths.js';

const BATCH_SIZE = 100;

export const CSV_COLUMNS = ['uuid', 'name', 'shortUrl', 'tagline', 'genres', 'tags', 'description'] as const;

type ExportRow = Pick<ComicSeriesModel, 'uuid' | 'name' | 'shortUrl' | 'tagline' | 'genre0' | 'genre1' | 'genre2' | 'tags' | 'description'>;

function toCsvRow(row: ExportRow): Record<(typeof CSV_COLUMNS)[number], string> {
  const genres = [row.genre0, row.genre1, row.genre2]
    .filter((genre): genre is NonNullable<typeof genre> => !!genre)
    .map(getPrettyGenre);

  return {
    uuid: row.uuid,
    name: row.name ?? '',
    shortUrl: row.shortUrl,
    tagline: row.tagline ?? '',
    genres: genres.join(', '),
    tags: (row.tags ?? []).join(', '),
    description: row.description ?? '',
  };
}

async function run() {
  const outputPath = resolveOutputPath(process.argv[2]);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const stringifier = stringify({ header: true, columns: [...CSV_COLUMNS], bom: true });
  const fileStream = fs.createWriteStream(outputPath);
  const finished = new Promise<void>((resolve, reject) => {
    fileStream.on('finish', resolve);
    fileStream.on('error', reject);
    stringifier.on('error', reject);
  });
  stringifier.pipe(fileStream);

  let offset = 0;
  let total = 0;

  while (true) {
    const batch: ExportRow[] = await database('comicseries')
      .select('uuid', 'name', 'shortUrl', 'tagline', 'genre0', 'genre1', 'genre2', 'tags', 'description')
      .where((builder) => builder.whereNull('isBlocked').orWhere('isBlocked', false))
      .orderBy('id', 'asc')
      .limit(BATCH_SIZE)
      .offset(offset);

    for (const row of batch) {
      stringifier.write(toCsvRow(row));
    }

    total += batch.length;
    offset += BATCH_SIZE;
    console.log(`exported ${total} rows...`);

    if (batch.length < BATCH_SIZE) { break; }
  }

  stringifier.end();
  await finished;

  console.log(`\nWrote ${total} comic series to ${outputPath}`);
  process.exit(0);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
