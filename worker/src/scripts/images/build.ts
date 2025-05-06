import pgPackage from 'pg';
import fs from 'fs';
import QueryStream from 'pg-query-stream';
import { mapKeys, camelCase } from 'lodash-es';
import { Transform } from 'stream';

import { PsqlAdapter, runStreamer } from '../utils/postgres.js';

import config from '@inkverse/shared-server/database/config';

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
        return `
            SELECT
                cs.uuid, cs.issue_uuid, cs.series_uuid, cs.story_image 
            FROM comicstory cs
            JOIN comicissue ci ON ci.uuid = cs.issue_uuid
            WHERE
                cs.id between ${min} and ${max} AND (cs.is_removed IS NULL OR cs.is_removed = false) AND (cs.width IS NULL OR cs.height IS NULL) AND (ci.scopes_for_exclusive_content IS NULL OR (ci.scopes_for_exclusive_content IS NOT NULL AND ci.date_exclusive_content_is_available < EXTRACT(EPOCH FROM NOW()) * 1000))
            `;
    };

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

        const transform = new KnexTransform();
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
    constructor() {
        super({ objectMode: true });
    }

    override _transform(doc: Record<string, any> | null, enc: string, cb: (error?: Error | null) => void): void {
        if (!doc) return cb();
        const camelCaseObj = mapKeys(doc, (_, key) => camelCase(key));
        this.push(`${JSON.stringify(camelCaseObj)}\n`);
        cb();
    }
}