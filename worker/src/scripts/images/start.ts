import { unlink, writeFile } from 'fs/promises';
import path from 'path';
import { build } from './build.js';
import { downloadAndSave } from './download-and-save.js';
async function main(args: string[]) {
    try {
        const outputPath = path.join(process.cwd(), 'output', 'comicstories.txt');

        // Setup
        await unlink(outputPath).catch(() => {}); // Remove existing file if it exists
        await writeFile(outputPath, ''); // Create new empty file

        // Build
        await build('comicstory', 'id', outputPath);
        await downloadAndSave(outputPath);

        //remove the file
        await unlink(outputPath)

        console.log('[run-scheduler] Program finished.');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

// Execute the script with command line arguments
main(process.argv.slice(2));