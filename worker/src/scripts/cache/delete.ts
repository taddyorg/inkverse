import { purgeCacheOnCdn, type CacheType } from '@inkverse/shared-server/cache/index'

async function run() {

  const inputs = process.argv.slice(2);
  const type = inputs[0];
  const id = inputs[1];
  const shortUrl = inputs[2];

  if(!type){
    throw new Error("Must pass in a taddyType as arg 1")
  }

  await purgeCacheOnCdn({ type: type as CacheType, id, shortUrl });

  // end node program
  process.exit()

}

run();