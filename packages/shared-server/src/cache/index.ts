import axios from "axios";
import { GraphQLClient, gql } from 'graphql-request';

import { getInkverseUrl, inkverseWebsiteUrl } from "@inkverse/public/utils";

import path from 'path';
import { fileURLToPath } from "url";
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '..', '..', '.env');
dotenv.config({ path: envPath });

export type CacheType = 
  'everything' |
  'documentation' |
  'sitemap' |
  'comicseries' |
  'comicissue' |
  'comicissueforseries' |
  'comicstory' |
  'creator' |
  'creatorcontent' |
  'recentlyAdded' |
  'recentlyUpdated' |
  'profilecomicseries'

interface PurgeCacheParams {
  type: CacheType;
  id?: string;
  ids?: string[];
  shortUrl?: string;
  name?: string;
  seriesUuid?: string;
}

export async function purgeCacheOnCdn({ type, id, shortUrl, name, seriesUuid }: PurgeCacheParams) {
  if (process.env.NODE_ENV !== "production") {
    console.log('LocalHost purgeCacheOnCdn', type, id, shortUrl, name);
  }

  switch (type) {
    case 'documentation':
    case 'comicseries':
    case 'creator':
    case 'comicstory':
    case 'creatorcontent':
      if (!id) { throw new Error('purgeCacheOnCdn - id is required for type: ' + type); }
      await purgeApiCache(type, id)
      await purgeWebsiteCache(type, id, shortUrl, name)
      return
    case 'comicissue':
      if (!id) { throw new Error('purgeCacheOnCdn - id is required for type: ' + type); }
      if (!seriesUuid) { throw new Error('purgeCacheOnCdn - seriesUuid is required for type: ' + type); }
      await purgeApiCache(type, id)
      await purgeApiCache('comicissueforseries', seriesUuid)
      await purgeWebsiteCache(type, id, shortUrl, name, seriesUuid)
      return
    case 'profilecomicseries':
      if (!id) { throw new Error('purgeCacheOnCdn - id (userId) is required for type: ' + type); }
      await purgeApiCache(type, id)
      return
    case 'everything':
      await purgeApiCache(type, "")
      await purgeWebsiteCache(type)
      return 
    case 'recentlyAdded':
      await purgeApiCache(type, 'recently-added')
      await purgeWebsiteCache(type, 'recently-added')
      return
    case 'recentlyUpdated':
      await purgeApiCache(type, 'recently-updated')
      await purgeWebsiteCache(type, 'recently-updated')
      return
    case 'sitemap':
      await purgeWebsiteCache(type, id, shortUrl, name)
      return
    default:
      throw new Error(`inside purgeEvent() - Dont have logic for type: ${type}`)
  }
}

export async function purgeMultipleCacheOnCdn({ type, ids }: PurgeCacheParams) {
  if (process.env.NODE_ENV !== "production") {
    console.log('LocalHost purgeMultipleCacheOnCdn', type, ids);
  }

  switch (type) {
    case 'comicissue':
    case 'comicstory':
    case 'creatorcontent':
      if (!ids) { throw new Error('purgeMultipleCacheOnCdn - ids is required for type: ' + type); }

      await purgeMultipleOnCdn(type, ids)
      return
    default:
      throw new Error(`inside purgeEvent() - Dont have logic for type: ${type}`)
  }
}

function getGraphCDNQuery(type: CacheType) {
  switch (type) {
    case 'everything':
      return `
        mutation {
          _purgeAll
        }
      `
    case 'documentation':
      return `
        mutation {
          _purgeQuery(queries: [getDocumenation])
        }
      `
    case 'comicseries':
      return `
        mutation ComicSeriesPurge ($uuid: [ID!]) {
          purgeComicSeries(uuid: $uuid)
        }
      `
    case 'comicissue':
      return `
        mutation ComicIssuePurge ($uuid: [ID!]) {
          purgeComicIssue(uuid: $uuid)
        }
      `
    case 'comicissueforseries':
      return `
        mutation ComicIssueForSeriesPurge ($seriesUuid: [ID!]) {
          purgeComicIssueForSeries(seriesUuid: $seriesUuid)
        }
      `
    case 'comicstory':
      return `
        mutation ComicStoryPurge ($uuid: [ID!]) {
          purgeComicStory(uuid: $uuid)
        }
      `
    case 'creator':
      return `
        mutation CreatorPurge ($uuid: [ID!]) {
          purgeCreator(uuid: $uuid)
        }
      `
    case 'creatorcontent':
      return `
        mutation CreatorContentPurge ($uuid: [ID!]) {
          purgeCreatorContent(uuid: $uuid)
        }
      `
    case 'recentlyAdded':
    case 'recentlyUpdated':
      return `
        mutation HomeScreenComicSeriesPurge ($id: [ID!]) {
          purgeHomeScreenComicSeries(id: $id)
        }
      `
    case 'profilecomicseries':
      return `
        mutation ProfileComicSeriesPurge ($userId: [ID!]) {
          purgeProfileComicSeries(userId: $userId)
        }
      `
    default:
      throw new Error(`inside getGraphCDNQuery() - Dont have logic for type: ${type}`)
  }
}

function getGraphCDNVariables(type: CacheType, id?:string, ids?:string[]) {
  switch (type) {
    case 'everything':
    case 'documentation':
      return null
    case 'comicseries':
    case 'comicissue':
    case 'comicstory':
    case 'creator':
    case 'creatorcontent':
      return { uuid: ids || [id] }
    case 'comicissueforseries':
      return { seriesUuid: ids || [id] }
    case 'recentlyAdded':
    case 'recentlyUpdated':
      return { id: [id] }
    case 'profilecomicseries':
      return { userId: ids || [id] }
    default:
      throw new Error(`inside getGraphCDNVariables() - Dont have logic for type: ${type}`)
  }
}

async function purgeApiCache(type: CacheType, id:string) {
  try {
    if (process.env.NODE_ENV !== "production") {
      console.log('LocalHost purgeApiCache', type, id);
      return;
    }

    const query = getGraphCDNQuery(type);
    const variables = getGraphCDNVariables(type, id)
    await postToGraphQL(query, variables);
  } catch (error) {
    console.error('purgeApiCache error', type, error);
  }
}

async function purgeMultipleOnCdn(type: CacheType, ids:string[]) {
  try {
    if (process.env.NODE_ENV !== "production") {
      console.log('LocalHost purgeMultipleOnCdn', type, ids);
      return;
    }

    const query = getGraphCDNQuery(type);
    const variables = getGraphCDNVariables(type, undefined, ids)
    await postToGraphQL(query, variables);
  } catch (error) {
    console.error('purgeMultipleOnCdn error', type, error);
  }
}

async function purgeWebsiteCache(type: CacheType, id?:string, shortUrl?:string, name?:string, seriesUuid?:string) {
  try {
    if (process.env.NODE_ENV !== "production") {
      console.log('LocalHost purgeWebsiteCache', type, id, shortUrl, name);
      return;
    }

    const data = getCloudflareDataObject(type, id, shortUrl, name, seriesUuid)

    if (!data) {
      console.log('purgeWebsiteCache - No data to purge', type, id, shortUrl, name);
      return;
    }

    const options = {
      method: 'POST',
      url: `https://api.cloudflare.com/client/v4/zones/${process.env.CLOUDFLARE_TADDY_ZONE_ID}/purge_cache`,
      timeout: 1000 * 5,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
      },
      data
    };

    await axios(options);
  } catch (error) {
    console.error('purgeWebsiteCache error', type, error);
  }
}

function getCloudflareDataObject(type: CacheType, id?:string, shortUrl?:string, name?:string, seriesUuid?:string): { purge_everything: boolean } | { files: string[] } | null {
  switch (type) {
    case 'everything':
    case 'documentation':
      return { purge_everything: true }
    case 'comicseries':
    case 'comicissue':
    case 'creator':
    case 'sitemap':
    case 'recentlyAdded':
    case 'recentlyUpdated':
      return { files: [urlToPurge(type, id, shortUrl, name)] }
    case 'comicstory':
    case 'creatorcontent':
      return null;
    default:
      throw new Error(`inside getCloudflareDataObject() - Dont have logic for type: ${type}`)
  }
}

function urlToPurge(type: CacheType, id?:string, shortUrl?:string, name?:string, seriesUuid?:string) {
  switch (type) {
    case 'comicseries':
      return `${inkverseWebsiteUrl}${getInkverseUrl({ type: 'comicseries', shortUrl })}`
    case 'comicissue':
      return `${inkverseWebsiteUrl}${getInkverseUrl({ type: 'comicissue', shortUrl, name, uuid: id })}`
    case 'creator':
      return `${inkverseWebsiteUrl}${getInkverseUrl({ type: 'creator', shortUrl })}`
    case 'creatorcontent':
      return `${inkverseWebsiteUrl}${getInkverseUrl({ type: 'creator', shortUrl })}`
    case 'recentlyAdded':
    case 'recentlyUpdated':
      return `${inkverseWebsiteUrl}`
    case 'sitemap':
      return `https://ink0.inkverse.co/sitemap/${id}`
    default:
      throw new Error(`inside getURLsToPurge() - Dont have logic for type: ${type}`)
  }
}

async function postToGraphQL(query: string, variables: any) {
  const queryRequest = gql`${query}`;

  const endpointUrl = 'https://admin.stellate.co/inkverse1'

  const headers = {
    'Content-Type': 'application/json',
    'stellate-token': process.env.STELLATE_API_TOKEN
  }

  const client = new GraphQLClient(endpointUrl, { headers: headers as Record<string, string> })
  const data = await client.request(queryRequest, variables)
  return data;
}