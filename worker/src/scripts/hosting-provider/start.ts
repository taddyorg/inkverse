import { unlink, writeFile } from 'fs/promises';
import path from 'path';
import { build } from './build.js';
import { refreshHostingProviderAccessToken } from './refresh-token.js';


async function main(args: string[]) {
    try {
        const outputPath = path.join(process.cwd(), 'output', 'oauth_tokens.txt');

        // Setup
        await unlink(outputPath).catch(() => {}); // Remove existing file if it exists
        await writeFile(outputPath, ''); // Create new empty file

        // Build
        await build('oauth_token', 'id', outputPath);

        //refresh the access token
        await refreshHostingProviderAccessToken(outputPath);

        //remove the file
        // await unlink(outputPath)

        console.log('[run-scheduler] Program finished.');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

// Execute the script with command line arguments
main(process.argv.slice(2));