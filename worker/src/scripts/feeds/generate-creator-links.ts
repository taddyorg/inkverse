import { database } from '@inkverse/shared-server/database/index';
import { mockWebhookEvent } from './mock-webhook-event.js';

interface Creator {
  uuid: string;
  links: Record<string, any> | null;
}

async function processCreator(creator: Creator): Promise<void> {
  try {
    
    if (!creator.links || Object.keys(creator.links).length === 0) {
      console.log(`No links for creator: ${creator.uuid}`);
      return;
    }
    
    await mockWebhookEvent('creator', 'updated', creator.uuid);
    console.log(`Successfully processed creator: ${creator.uuid}`);
  } catch (error) {
    console.error(`Error processing creator ${creator.uuid}:`, error);
    // Continue with other creators instead of failing the entire process
  }
}

async function run(): Promise<void> {
  const creators = await database('creator').select('uuid', 'links') as Creator[];
  
  for (const creator of creators) {
    await processCreator(creator);
  }
  
  console.log('Finished processing all creators');
  
  process.exit(0);
}

run();