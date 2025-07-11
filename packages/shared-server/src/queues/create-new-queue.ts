import dotenv from 'dotenv';
import { createQueue, type QUEUE_NAMES, isValidQueueName } from "./utils.js";
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
  } else if (!isValidQueueName(queueName)) {
    throw new Error(`Invalid queue name: ${queueName}`);
  }

  const queueNameEnum = queueName as QUEUE_NAMES;

  await createQueue(queueNameEnum);
}

run()
