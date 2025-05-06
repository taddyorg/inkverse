import { ListQueuesCommand, CreateQueueCommand, ReceiveMessageCommand, DeleteMessageCommand, DeleteMessageBatchCommand, SendMessageBatchCommand, SendMessageCommand, type SendMessageCommandOutput, type Message } from "@aws-sdk/client-sqs";
import { sqsClient } from "./sqs-client.js";
import { uniqBy } from "lodash-es";
import { processWebhook, type TaddyWebhook } from "../taddy/process-webhook.js";

export enum QUEUE_NAMES {
  INKVERSE_HIGH_PRIORITY = "INKVERSE_HIGH_PRIORITY",
}

export enum INKVERSE_HIGH_PRIORITY_TYPE {
  PROCESS_TADDY_WEBHOOK = "PROCESS_TADDY_WEBHOOK",
}

export function getQueueUrl(queueName: QUEUE_NAMES): string {
  if (!queueName) { throw new Error("Need to pass in a queue name")}
  return `${process.env.SQS_BASE_URL}${queueName}`
}

export async function listAllQueues(): Promise<string[] | undefined> {
  try {
    const data = await sqsClient.send(new ListQueuesCommand({}));
    return data.QueueUrls
  } catch (err) {
    console.error(err);
  }
}

export async function createQueue(queueName: QUEUE_NAMES): Promise<string | undefined> {
  if (!queueName) { throw new Error("Need to pass in a name to create a queue")}

  // Set the parameters
  const params = {
    QueueName: queueName,
    Attributes: {
      ReceiveMessageWaitTimeSeconds: "20", //long polling
    },
  };

  try {
    const data = await sqsClient.send(new CreateQueueCommand(params));
    return data.QueueUrl;
  } catch (err) {
    console.error(err);
  }
}

async function doWork(queueName: QUEUE_NAMES, doc: any, inputArgs?: any, isDebugMode?: boolean, shouldDeleteMessages?: boolean): Promise<void> {
  switch (queueName) {
    case QUEUE_NAMES.INKVERSE_HIGH_PRIORITY:
      switch (doc.type) {
        case INKVERSE_HIGH_PRIORITY_TYPE.PROCESS_TADDY_WEBHOOK:
          await processWebhook(doc as TaddyWebhook);
          return;
        default:
          throw new Error(`INKVERSE_HIGH_PRIORITY ERROR - Unhandled QUEUE_ACTION_TYPES case: ${doc.type}`);
      }
    default:
      throw new Error(`inside doWork() - Dont have logic for QueueName: ${queueName}`);
  }
}

function fixRecievingArgs(docAsString: string | undefined): Record<string, any> | undefined {
  if (!docAsString) { return }
  return JSON.parse(docAsString)
}

export async function receiveAndDeleteMessages(queueName: QUEUE_NAMES, limit = 10, inputArgs = {}, isDebugMode = process.env.NODE_ENV !== 'production', shouldDeleteMessages = true, fn = doWork): Promise<any> {
  try {
    const QueueUrl = getQueueUrl(queueName)

    const params = {
      MaxNumberOfMessages: limit,
      MessageAttributeNames: ["All"],
      QueueUrl,
    };

    const data = await sqsClient.send(new ReceiveMessageCommand(params));
    if (!data.Messages) { return } // call recieve again?
    
    const resolvedPromises = await Promise.allSettled(data.Messages.map(async (message, index) => {
      const fixedMessage: { sqsDetails: Message; uuid?: string; id?: string; [key: string]: any } = {
        sqsDetails: message,
        ...fixRecievingArgs(message.Body)
      }
      
      try {
        Promise.all([await timeout(index * 100), await fn(queueName, fixedMessage, inputArgs, isDebugMode, shouldDeleteMessages)])

        return message
      } catch (error) { // continue for other non-error messages
        console.log('ERROR for uuid:', fixedMessage.uuid, 'id:', fixedMessage.id, error);
        return Promise.resolve();
      }
    }));

    if (shouldDeleteMessages) {
      const messagesToDelete = resolvedPromises
        .filter((result): result is PromiseFulfilledResult<Message> => 
          result.status === 'fulfilled' && result.value !== undefined)
        .map(result => result.value);

      if (messagesToDelete.length > 0) {
        await deleteBatchMessages(queueName, messagesToDelete);
      }
    }

    return data; // For unit tests.
  } catch (err) {
    console.error(err);
  }
}

async function deleteMessage(queueName: QUEUE_NAMES, doc: any): Promise<any> {
  try {
    if (!doc.sqsDetails && !doc.sqsDetails.ReceiptHandle) { return }

    const QueueUrl = getQueueUrl(queueName)

    // Set the parameters
    const deleteParams = {
      QueueUrl,
      ReceiptHandle: doc.sqsDetails.ReceiptHandle,
    };

    const data = await sqsClient.send(new DeleteMessageCommand(deleteParams));
    return data; // For unit tests.
  } catch (err) {
    console.error(err);
  }
}

export async function deleteBatchMessages(queueName: QUEUE_NAMES, messages: any[]): Promise<any> {
  try {
    const QueueUrl = getQueueUrl(queueName)

    if (!messages || !messages.length) { return }

    const params = {
      QueueUrl,
      Entries: messages.map(message => {
        return {
          Id: message.MessageId,
          ReceiptHandle: message.ReceiptHandle,
        }
      })
    };

    const data = await sqsClient.send(new DeleteMessageBatchCommand(params));
    return data; // For unit tests.
  } catch (err) {
    console.error(err);
  }
}

export function fixSendingArgs(doc: any, removedValues: string[] = []): string {
  const filteredDoc = Object.entries(doc).reduce<Record<string, any>>((acc, [key, value]) => {
    if (!removedValues.includes(key) && value != null) {
      acc[key] = value;
    }
    return acc;
  }, {});
  return JSON.stringify(filteredDoc);
}

export async function sendMessage(queueName: QUEUE_NAMES, doc: any): Promise<SendMessageCommandOutput | undefined> {
  const QueueUrl = getQueueUrl(queueName);

  const params = {
    QueueUrl,
    MessageBody: fixSendingArgs(doc, ["createdAt", "updatedAt"])
  };

  try {
    const data = await sqsClient.send(new SendMessageCommand(params));
    
    if (!data) {
      throw new Error(`Failed to send message to ${queueName}: ${JSON.stringify(data)}`);
    }
    
    return data;
  } catch (err) {
    console.error(`Error sending message to ${queueName}:`, err);
    throw err; // Re-throw the error for the caller to handle
  }
}

export async function chunkAndSendBatchMessage(queueName: QUEUE_NAMES, docs: any[]): Promise<any> {
  let index = 1;
  let size = 10;
  let batch = [];

  for await (const doc of docs) {
    if (index % size === 0) { 
      await sendBatchMessage(queueName, batch);
      batch = []
    }
    
    batch.push(doc);
    index++;
  }

  if (batch.length > 0){ //send leftover batch
    await sendBatchMessage(queueName, batch);
  }
}

async function sendBatchMessage(queueName: QUEUE_NAMES, docs: any[]): Promise<any> {
  try {
    const QueueUrl = getQueueUrl(queueName)

    if (docs.length === 0) { return }

    const EntriesMaybeDuplicates = docs.map((doc) => {
      return { 
        "Id": doc.uuid || doc.id,
        MessageBody: fixSendingArgs({ doc, removedValues: ["createdAt", "updatedAt"] }) 
      }
    });

    const Entries = uniqBy(EntriesMaybeDuplicates, "Id");

    // Set the parameters
    const params = {
      QueueUrl,
      Entries,
    };

    const data = await sqsClient.send(new SendMessageBatchCommand(params));
    
    if(!data){
      throw new Error(`Failed to send message to ${queueName} ${data}`)
    }
    
    return data; // For unit tests.
  } catch (err) {
    console.error(err);
  }
}

async function timeout(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
