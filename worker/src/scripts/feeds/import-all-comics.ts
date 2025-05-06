import fs from 'fs';
import path from 'path';
import readline from 'readline';

import { addFeedByUuid } from './add-new-feed-by-uuid.js';

async function run() {

  const filePath = path.resolve('input/comicseries.txt');
  const fileStream = fs.createReadStream(filePath);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    let comicseries = JSON.parse(line);
    try {
      await addFeedByUuid('comicseries', comicseries.uuid);
      await new Promise(resolve => setTimeout(resolve, 10000));
    } catch (error) {
      console.log('error - ', error);
    }
  }

  // end node program
  process.exit()
}

run();