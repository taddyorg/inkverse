import { get } from 'lodash-es';
import { fileURLToPath, pathToFileURL } from 'url';

import { type TaddyWebhookType, type TaddyWebhookAction } from '@inkverse/shared-server/taddy/process-webhook';
import { GET_COMICISSUE_QUERY, GET_COMICSERIES_QUERY, GET_COMICSERIES_WITH_CREATOR_QUERY, GET_COMICSERIES_WITH_ISSUES_QUERY, GET_CREATOR_QUERY, GET_CREATOR_WITH_CONTENT_QUERY, GET_CREATORCONTENT_QUERY, taddyGraphqlRequest } from '@inkverse/shared-server/taddy/index';
import { createMockWebhookEvent, sendMockEventToEndpointUrl } from './mock-webhook-event.js';

export async function addFeedByUuid(taddyType: TaddyWebhookType, uuid: string, action: TaddyWebhookAction = 'created') {
  const parentQuery = getQuery(taddyType);
  const parentVariables = { uuid };
  const parentData = await taddyGraphqlRequest(parentQuery, parentVariables);
  const totalCount = get(parentData, getCountProperty(taddyType), 0);
  const itemsPerPage = 25;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  let page = 1;
  let childrenUuids: string[] = [];
  while (page <= totalPages) {
    const childrenQuery = getChildrenQuery(taddyType);
    const childrenVariables = { uuid, page, limitPerPage: itemsPerPage };
    const childrenData = await taddyGraphqlRequest(childrenQuery, childrenVariables);
    const items = get(childrenData, getChildrenProperty(taddyType), []);
    childrenUuids.push(...items.map((item: any) => item.uuid));
    page++;
  }

  if (!parentData) { return; }

  const mockEvent = createMockWebhookEvent(parentData, taddyType, action, uuid);
  console.log('parent - ', mockEvent);
  await sendMockEventToEndpointUrl(mockEvent);

  for await (const childUuid of childrenUuids) {
    const childQuery = getChildQuery(taddyType);
    const childVariables = { uuid: childUuid };
    const childData = await taddyGraphqlRequest(childQuery, childVariables);
    if (!childData) { continue; }
    const mockEvent = createMockWebhookEvent(childData, getChildTaddyType(taddyType), action, childUuid);
    console.log('child - ', mockEvent);
    await sendMockEventToEndpointUrl(mockEvent);
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  if (taddyType === 'comicseries' && action !== 'deleted') {
    const creatorsQuery = getQuery('comicseries-with-creator');
    const creatorsVariables = { uuid };
    const creatorsData = await taddyGraphqlRequest(creatorsQuery, creatorsVariables);
    const creators = get(creatorsData, getChildrenProperty('comicseries-with-creator'), []);

    for await (const creator of creators) {
      addFeedByUuid('creator', creator.uuid, action);
    }
  }
}

function getQuery(taddyType: string){
  switch(taddyType) {
    case 'comicseries':
      return GET_COMICSERIES_QUERY;
    case 'creator':
      return GET_CREATOR_QUERY;
    case 'comicseries-with-creator':
      return GET_COMICSERIES_WITH_CREATOR_QUERY;
    default:
      throw new Error(`ERROR in getQuery: taddyType: ${taddyType} is not supported`);
  }
}

function getChildrenQuery(taddyType: string){
  switch(taddyType) {
    case 'comicseries':
      return GET_COMICSERIES_WITH_ISSUES_QUERY;
    case 'creator':
      return GET_CREATOR_WITH_CONTENT_QUERY;
    default:
      throw new Error(`ERROR in getQuery: taddyType: ${taddyType} is not supported`);
  }
}

function getChildQuery(taddyType: string){
  switch(taddyType) {
    case 'comicseries':
      return GET_COMICISSUE_QUERY;
    case 'creator':
      return GET_CREATORCONTENT_QUERY;
    default:
      throw new Error(`ERROR in getQuery: taddyType: ${taddyType} is not supported`);
  }
}

function getChildTaddyType(taddyType: string): TaddyWebhookType {
  switch(taddyType) {
    case 'comicseries':
      return 'comicissue';
    case 'creator':
      return 'creatorcontent';
    default:
      throw new Error(`ERROR in getChildTaddyType: taddyType: ${taddyType} is not supported`);
  }
}

function getCountProperty(taddyType: string){
  switch(taddyType) {
    case 'comicseries':
      return 'getComicSeries.totalIssuesCount';
    case 'creator':
      return 'getCreator.totalContentCount';
    default:
      throw new Error(`ERROR in getDataProperty: taddyType: ${taddyType} is not supported`);
  }
}

function getChildrenProperty(taddyType: string){
  switch(taddyType) {
    case 'comicseries':
      return 'getComicSeries.issues';
    case 'creator':
      return 'getCreator.content';
    case 'comicseries-with-creator':
      return 'getComicSeries.creators';
    default:
      throw new Error(`ERROR in getDataProperty: taddyType: ${taddyType} is not supported`);
  }
}

// if this file is being run directly, then we need to get the inputs from the command line
if (import.meta.url.replace('file://', '') === fileURLToPath(pathToFileURL(process.argv[1] as string))) {
  const inputs = process.argv.slice(2);
  const taddyType = inputs[0];
  const uuid = inputs[1];
  const action = inputs[2] || 'created';

  if (!taddyType || !uuid) {
    console.error('Usage: npm run add-new-feed-by-uuid <taddyType> <uuid> [action]');
    process.exit(1);
  }

  const taddyTypeEnum = taddyType as TaddyWebhookType;
  const actionEnum = action as TaddyWebhookAction;

  addFeedByUuid(taddyTypeEnum, uuid, actionEnum);
}
