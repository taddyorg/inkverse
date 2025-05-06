import pgPackage from 'pg';
import fs from 'fs';
import QueryStream from 'pg-query-stream';
import { mapKeys, camelCase } from 'lodash-es';
import { Transform } from 'stream';

import { PsqlAdapter, runStreamer } from '../utils/postgres.js';

import config from '@inkverse/shared-server/database/config';
import { getInkverseUrl, type InkverseUrlType } from '@inkverse/public/utils';

export async function build(table: string, pk: string, outputPath: string) {
    if (!table || !pk || !outputPath) {
        console.error('Missing required arguments: table, pk, outputPath');
        return
    }

    const destroy_wait_ms = 3000;
    const page_size = 200;
    const hwm = 1000;
    
    const pg = new pgPackage.Pool({
        connectionString: config.connection.connectionString,
        min: 10,
        max: 30,
        idleTimeoutMillis: 300
    });

    const query_func = (min: number, max: number): string => {
        switch (table) {
            case 'comicseries':
                return `
                    SELECT
                        cs.*,
                        ci.date_published as sitemap_date_published
                    FROM comicseries cs
                    LEFT JOIN LATERAL (
                        SELECT uuid, name, date_published
                        FROM comicissue
                        WHERE series_uuid = cs.uuid
                        ORDER BY date_published DESC NULLS LAST, position DESC NULLS LAST
                        LIMIT 1
                    ) ci ON true
                WHERE
                    cs.id between ${min} and ${max} AND (cs.is_blocked IS NULL OR cs.is_blocked = false)
            `;
            case 'creator':
                return `
                    SELECT
                        c.*,
                        c.updated_at as sitemap_date_published,
                        c.created_at as sitemap_date_created
                    FROM creator c
                    WHERE
                        c.id between ${min} and ${max} AND (c.is_blocked IS NULL OR c.is_blocked = false)
            `;
            default:
                throw new Error(`Invalid type: ${table}`);
        }
    }

    const stream = internalStreamer(pg, { 
        table, 
        hwm, 
        pk, 
        outputPath, 
        query_func, 
    });

    const pgAdapter = new PsqlAdapter(pg, { table, pk });

    const done = () => {
        console.log(`[SYNC] Process finished after ${Date.now() - start}ms`);
        pg.end();
        return
    }

    const start = Date.now();
    console.log('');
    console.log(`[SYNC] /**`);
    console.log(`[SYNC]  * STARTING ${table?.toUpperCase()} PROCESS.`);
    console.log(`[SYNC]  *     args: ${[table, pk].join(', ')}`);
    console.log(`[SYNC]  */`);

    await runStreamer(pgAdapter, stream, page_size, done);
}

function internalStreamer(pg: pgPackage.Pool, config: {
    table: string;
    pk: string;
    outputPath: string;
    query_func: (min: number, max: number) => string;
    hwm: number;
}): (min: number, max: number, cb: (error?: Error) => void) => void {
    const { outputPath, query_func } = config;

    return function stream_pg(min: number, max: number, cb: (error?: Error) => void): void {
        console.log(`[STREAMER] Starting page ${min}-${max}`);
        const page_start = Date.now();

        const transform = new KnexTransform(config.table);
        const write_stream = fs.createWriteStream(outputPath, { flags: 'a' });

        pg.connect((err: Error | null, client: pgPackage.PoolClient, done: () => void) => {
            if (err) throw err;
            
            const query = new QueryStream(query_func(min, max));
            const stream = client.query(query);

            stream.on('error', cb);
            stream.pipe(transform).pipe(write_stream);
            
            stream.on('end', () => {
                console.log(`[STREAMER] Page ${min}-${max} finished in ${Date.now() - page_start}`);
                done();
            });
        });

        write_stream.on('finish', () => {
            const page_end = Date.now();
            console.log(`[STREAMER] Finished in ${page_end - page_start}`);
            cb();
        });
    };
}

class KnexTransform extends Transform {
    private table: string;
    
    constructor(table: string) {
        super({ objectMode: true });
        this.table = table;
    }

    override _transform(doc: Record<string, any> | null, enc: string, cb: (error?: Error | null) => void): void {
        if (!doc) return cb();

        const camelCaseDoc = mapKeys(doc, (_, key) => camelCase(key));
        const type = this.table;
        const inkverseUrl = `https://inkverse.co${getInkverseUrl({ type: type as InkverseUrlType, shortUrl: camelCaseDoc.shortUrl})}`;

        // Convert timestamp to desired format
        const formattedDate = getFormattedDate(type, camelCaseDoc.sitemapDatePublished, camelCaseDoc.sitemapDateCreated);

        // Construct sitemap item
        const sitemapItem = `    <url>
        <loc>${inkverseUrl}</loc>
        <lastmod>${formattedDate}</lastmod>
        <priority>0.8</priority>
    </url>
`;

        this.push(sitemapItem);
        cb();
    }
}

function getFormattedDate(type: string, timestamp?: string | number | null, timestamp2?: string | number | null): string {
    switch (type) {
        case 'comicseries':
            return new Date(Number(timestamp) * 1000).toISOString();
        case 'creator':
            const date = new Date(timestamp || timestamp2 || '');
            return date.toISOString();
        default:
            throw new Error(`Invalid type: ${type}`);
    }
}