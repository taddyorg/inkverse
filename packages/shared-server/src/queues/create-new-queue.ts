import dotenv from 'dotenv';
import { createQueue, QUEUE_NAMES } from "./utils.js";
import { fileURLToPath } from 'url';

import path from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '..', '..', '.env');
dotenv.config({ path: envPath });

async function run(){

  const inputs = process.argv.slice(2);
  const queueName = inputs[0];

  if (!queueName) {
    throw new Error("Must pass in a queue name");
  }else if (!(queueName in QUEUE_NAMES)) {
    throw new Error("Invalid queue name");
  }

  const queueNameEnum = queueName as QUEUE_NAMES;

  await createQueue(queueNameEnum);
}

run()
