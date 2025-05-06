import fs from 'fs/promises'
import { createReadStream, createWriteStream } from 'fs'
import readline from 'readline'
import { purgeCacheOnCdn } from '@inkverse/shared-server/cache/index'
import { uploadFile } from '@inkverse/shared-server/cloudflare/index'
import path from 'path'
import { fileURLToPath } from 'url'

export async function splitAndUpload(type: string, inputTxtFile: string): Promise<void> {
    const start = +new Date();
    console.log('');
    console.log(`[SYNC] /**`)
    console.log(`[SYNC]  * STARTING SPLIT-AND-UPLOAD PROCESS.`)
    console.log(`[SYNC]  *     args: ${[type, inputTxtFile].join(', ')}`)
    console.log(`[SYNC]  */`)

    console.log(`[SYNC] Starting build.`);

    // Get base directory path using ES modules pattern
    const basePath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../output');
    
    // Check if inputTxtFile is already an absolute path
    const readFilePath = path.isAbsolute(inputTxtFile) 
        ? inputTxtFile 
        : path.join(basePath, inputTxtFile);
        
    const writeFilePath = path.join(basePath, `${type}-1.xml`);
    
    console.log(`[SYNC] Reading from: ${readFilePath}`);
    console.log(`[SYNC] Writing to: ${writeFilePath}`);
    
    const fileStream = createReadStream(readFilePath, "utf8");

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    const writeStream = createWriteStream(writeFilePath, { flags: 'a' });

    writeStream.write(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`);

    for await (const line of rl) {
        writeStream.write(`${line}\n`);
    }
    
    writeStream.write(`</urlset>\n`);
    writeStream.end();
    
    await new Promise<void>((resolve) => {
        writeStream.on('finish', resolve);
    });
    
    console.log(`[SYNC] Process finished after ${+new Date() - start}ms`);
    await uploadToR2(type, writeFilePath);
    console.log(`[SYNC] Upload finished after ${+new Date() - start}ms`);
}

async function uploadToR2(type: string, filePath: string): Promise<void> {
    await uploadFile({
        bucketName: 'ink0',
        fileName: `sitemap/${type}-1${process.env.NODE_ENV === 'production' ? '' : '-dev'}.xml`,
        filePath,
    });

    await purgeCacheOnCdn({ type: 'sitemap', id: `${type}-1.xml` })
}