import { unlink, writeFile } from 'fs/promises';
import path from 'path';
import { build } from './build.js';
import { splitAndUpload } from './split-and-upload.js';

async function main(args: string[]) {
    try {
        const outputPathComicSeries = path.join(process.cwd(), 'output', 'comicseries.txt');
        const outputPathCreator = path.join(process.cwd(), 'output', 'creator.txt');

        // Setup
        await unlink(outputPathComicSeries).catch(() => {}); // Remove existing file if it exists
        await writeFile(outputPathComicSeries, ''); // Create new empty file

        await unlink(outputPathCreator).catch(() => {}); // Remove existing file if it exists
        await writeFile(outputPathCreator, ''); // Create new empty file

        // Build
        await build('comicseries', 'id', outputPathComicSeries);
        await build('creator', 'id', outputPathCreator);

        //split and upload
        await splitAndUpload('comicseries', outputPathComicSeries);
        await splitAndUpload('creator', outputPathCreator);

        //remove the files
        await unlink(outputPathComicSeries);
        await unlink(outputPathCreator);

        console.log('[sitemap] Program finished.');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

// Execute the script with command line arguments
main(process.argv.slice(2));