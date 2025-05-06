import { QUEUE_NAMES, receiveAndDeleteMessages } from "./utils.js";

let shouldLoop = true;

const shouldStopOnEmptyQueueNameSet: Set<QUEUE_NAMES> = new Set([   
]);

const shouldPauseOnNotFullQueueNameSet: Set<QUEUE_NAMES> = new Set([ 
]);

async function run(){
  const inputs = process.argv.slice(2);
  const queueNameString = inputs[0] || process.env.QUEUE_NAME;

  if(!queueNameString){
    throw new Error("Must pass in a queue name")
  }else if (!(queueNameString in QUEUE_NAMES)){
    throw new Error(`QueueName: ${queueNameString} is not a valid queue name`)
  }

  const queueName = queueNameString as QUEUE_NAMES;

  let countOfZeroMessagesRecieved = 0;

  while(shouldLoop) {
    const data = await receiveAndDeleteMessages(queueName); 

    // check to see if you should stop.
    if (shouldStopOnEmptyQueueNameSet.has(queueName)) {
      if (!data || !data.Messages || !data.Messages.length) {
        if (countOfZeroMessagesRecieved > 2) { 
          shouldLoop = false;
          break;
        }
  
        countOfZeroMessagesRecieved++;
        console.log('No messages recieved', countOfZeroMessagesRecieved);
        continue;
      }else{
        countOfZeroMessagesRecieved = 0;
      }
    }else if (shouldPauseOnNotFullQueueNameSet.has(queueName) && (!data || !data.Messages || !data.Messages.length || data.Messages.length < 6)) {
      // if under 10 messsages recieved, wait for 10 seconds and try again
      await timeout(10000);
    }
  }

  if (!shouldLoop) {
    console.log('Shutting down...');
    process.exit(0);
  }
}

async function timeout(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

process.on('SIGTERM', () => {
  console.log('The service is about to shut down!');

  // Finish any outstanding requests
  shouldLoop = false;
});

run()