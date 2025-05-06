import { addFeedByUuid } from './add-new-feed-by-uuid.js';

async function run() {
  const inputs = process.argv.slice(2);
  const uuid = inputs[0];

  if (!uuid) {
    console.error('Usage: npm run audit-comic <uuid>');
    process.exit(1);
  }

  try {
    await addFeedByUuid('comicseries', uuid);
  } catch (error) {
    console.log('error - ', error);
  }

  try {
    await addFeedByUuid('comicseries', uuid, 'updated');
  } catch (error) {
    console.log('error - ', error);
  }

  // end node program
  process.exit()
}

run();