import axios from "axios";
import { get } from "lodash-es";
import { fileURLToPath, pathToFileURL } from 'url';
import path from 'path';
import dotenv from 'dotenv';
import { type TaddyWebhookType, type TaddyWebhookAction, type TaddyWebhookValidEvents } from '@inkverse/shared-server/taddy/process-webhook';

import { taddyGraphqlRequest, GET_COMICSERIES_QUERY, GET_COMICISSUE_QUERY, GET_CREATOR_QUERY, GET_CREATORCONTENT_QUERY } from '@inkverse/shared-server/taddy/index';

const envPath = path.resolve('.', '.env');
dotenv.config({ path: envPath });

async function mockWebhookEvent(taddyType: TaddyWebhookType, action: TaddyWebhookAction, uuid: string){
  const query = getQuery(taddyType);
  const variables = { uuid };

  const data = await taddyGraphqlRequest(query, variables);
  if (!data) {
    throw new Error(`ERROR in mockWebhookEvent: no data returned for taddyType: ${taddyType} and uuid: ${uuid}.`);
  }
  const mockEvent = createMockWebhookEvent(data, taddyType, action, uuid);
  console.log(mockEvent);
  await sendMockEventToEndpointUrl(mockEvent);
}

function getQuery(webhookType: TaddyWebhookType){
  switch(webhookType) {
    case 'comicseries':
      return GET_COMICSERIES_QUERY;
    case 'comicissue':
      return GET_COMICISSUE_QUERY;
    case 'creator':
      return GET_CREATOR_QUERY;
    case 'creatorcontent':
      return GET_CREATORCONTENT_QUERY;
    default:
      throw new Error(`ERROR in getQuery: taddyType: ${webhookType} is not supported`);
  }
}

function getDataProperty(taddyType: TaddyWebhookType){
  switch(taddyType) {
    case 'comicseries':
      return 'getComicSeries';
    case 'comicissue':
      return 'getComicIssue';
    case 'creator':
      return 'getCreator';
    case 'creatorcontent':
      return 'getCreatorContent';
    default:
      throw new Error(`ERROR in getDataProperty: taddyType: ${taddyType} is not supported`);
  }
}

function createMockWebhookEvent(data: Record<string, any>, taddyType: TaddyWebhookType, action: TaddyWebhookAction, uuid: string){
  const dataForEvent = get(data, getDataProperty(taddyType), null);
  if (!dataForEvent) {
    throw new Error(`ERROR in createMockWebhookEvent: no data returned for taddyType: ${taddyType} and uuid: ${uuid}.`);
  }
  return {
    uuid,
    taddyType,
    action,
    timestamp: Math.floor(Date.now()/1000),
    data: dataForEvent,
  }
}

async function sendMockEventToEndpointUrl(mockEvent: Record<string, any>) {
  const webhookEndpointUrl = process.env.TADDY_WEBHOOK_ENDPOINT_URL;

  if (!webhookEndpointUrl) {
    throw new Error('TADDY_WEBHOOK_ENDPOINT_URL is not set');
  }else if (!process.env.TADDY_WEBHOOK_SECRET) {
    throw new Error('TADDY_WEBHOOK_SECRET is not set');
  }

  try { 
    const options = {
      method: 'POST',
      url: webhookEndpointUrl,
      timeout: 1000 * 5,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'taddy.org/1.0',
        'X-TADDY-WEBHOOK-SECRET': process.env.TADDY_WEBHOOK_SECRET,
      },
      data: mockEvent
    };
    
    await axios(options);
  }catch(error){
    console.log('sendMockEventToEndpointUrl error sending to ', webhookEndpointUrl, error);
  }
}

// if this file is being run directly, then we need to get the inputs from the command line
if (import.meta.url.replace('file://', '') === fileURLToPath(pathToFileURL(process.argv[1] as string))) {
  const inputs = process.argv.slice(2);
  const webhookEventAsString = inputs[0];
  const uuid = inputs[1];

  if (!webhookEventAsString || !uuid) {
    console.error('Usage: node mock-webhook-event.js <webhookEvent> <uuid>');
    process.exit(1);
  }

  const webhookEvent = webhookEventAsString as TaddyWebhookValidEvents;
  const taddyType = webhookEvent.toString().split('.')[0] as TaddyWebhookType;
  const action = webhookEvent.toString().split('.')[1] as TaddyWebhookAction;
  
  mockWebhookEvent(taddyType, action, uuid)
}

export { 
  createMockWebhookEvent,
  sendMockEventToEndpointUrl 
}

