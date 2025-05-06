import { ComicSeries, ComicIssue, Creator, CreatorContent } from '../models/index.js';
import { purgeCacheOnCdn, purgeMultipleCacheOnCdn } from '../cache/index.js'
import { getMultipleHeightAndWidths } from '../utils/sharp.js';

export type TaddyWebhook = {
  uuid: string;
  timestamp: number;
  taddyType: TaddyWebhookType;
  action: TaddyWebhookAction;
  data: Record<string, any>;
}

export type TaddyWebhookType = 
  'comicseries' |
  'comicissue' |
  'creator' |
  'creatorcontent'

export type TaddyWebhookAction =
  'created' |
  'updated' |
  'deleted'

export type TaddyWebhookValidEvents =
  'comicseries.created' |
  'comicseries.updated' |
  'comicseries.deleted' |
  'comicseries.new_issues_released' |
  'comicissue.created' |
  'comicissue.updated' |
  'comicissue.deleted' |
  'creator.created' |
  'creator.updated' |
  'creator.deleted' |
  'creator.new_content_released' |
  'creatorcontent.created' |
  'creatorcontent.updated' |
  'creatorcontent.deleted'

export async function processWebhook(body: TaddyWebhook): Promise<void> {
  const { taddyType } = body;
  switch (taddyType) {
    case 'comicseries':
      return await processComicSeriesWebhook(body);
    case 'comicissue':
      return await processComicIssueWebhook(body);
    case 'creator':
      return await processCreatorWebhook(body);
    case 'creatorcontent':
      return await processCreatorContentWebhook(body);
    default:
      throw new Error(`processWebhook - Invalid taddyType: ${taddyType}`);
  }
}

async function processComicSeriesWebhook(body: TaddyWebhook): Promise<void> {
  const { taddyType, action, data } = body;
  switch (action) {
    case 'created': {
      const comicseries = await ComicSeries.addComicSeries(data);

      if (!comicseries) {
        throw new Error('processComicSeriesWebhook - created - comicseries not found', data.uuid);
      }

      await Promise.allSettled([
        purgeCacheOnCdn({ type: 'comicseries', id: comicseries.uuid, shortUrl: comicseries.shortUrl }),
        purgeCacheOnCdn({ type: 'recentlyAdded' }),
      ])
      return;
    }
    case 'updated': {
      const comicseries = await ComicSeries.updateComicSeries(data);  

      if (!comicseries) {
        throw new Error('processComicSeriesWebhook - updated - comicseries not found', data.uuid);
      }
      
      await purgeCacheOnCdn({ type: 'comicseries', id: comicseries.uuid, shortUrl: comicseries.shortUrl })

      return;
    }
    case 'deleted': {
      const deletedComicSeries = await ComicSeries.deleteComicSeries(data);

      if (!deletedComicSeries || !deletedComicSeries.uuid) {
        throw new Error('processComicSeriesWebhook - deleted - deletedComicSeries not found', data.uuid);
      }

      const { uuid, issueUuids, storyUuids, shortUrl } = deletedComicSeries;

      await Promise.allSettled([
        purgeCacheOnCdn({ type: 'comicseries', id: uuid, shortUrl }),
        issueUuids ? purgeMultipleCacheOnCdn({ type: 'comicissue', ids: issueUuids }) : [],
        storyUuids ? purgeMultipleCacheOnCdn({ type: 'comicstory', ids: storyUuids }) : [],
      ])

      return;
    }
    default:
      throw new Error('processComicSeriesWebhook - Invalid action');
  }
}

async function processComicIssueWebhook(body: TaddyWebhook) {
  const { taddyType, action, data } = body;
  switch (action) {
    case 'created': {
      const [comicissue, comicstories] = await ComicIssue.addComicIssue(data);

      if (!comicissue) {
        throw new Error('processComicIssueWebhook - created - comicissue not found', data.uuid);
      }else if (!comicstories) {
        throw new Error('processComicIssueWebhook - created - comicstories not found', data.uuid);
      }

      // pre-download height and width for each story
      if (!comicissue.scopesForExclusiveContent || comicissue.scopesForExclusiveContent.length === 0) {
        await getMultipleHeightAndWidths(comicstories);
      }

      const comicseries = await ComicSeries.getComicSeriesByUuid(comicissue.seriesUuid);

      if (!comicseries) {
        console.error('processComicIssueWebhook - created - comicseries not found', comicissue.seriesUuid);
      }

      // purge cache
      await Promise.allSettled([
        comicseries ? purgeCacheOnCdn({ type: 'comicseries', id: comicseries.uuid, shortUrl: comicseries.shortUrl }) : [],
        purgeCacheOnCdn({ type: 'comicissue', id: comicissue.uuid, seriesUuid: comicseries?.uuid, shortUrl: comicseries?.shortUrl, name: comicseries?.name || undefined }),
        comicstories.length > 0 ? purgeMultipleCacheOnCdn({ type: 'comicstory', ids: comicstories.map(story => story.uuid) }) : [],
        purgeCacheOnCdn({ type: 'recentlyUpdated' }),
      ])

      // push notification
      await sendPushNotification(taddyType, action, data);

      return;
    }
    case 'updated': {
      const [comicissue, comicstories] = await ComicIssue.updateComicIssue(data);
      
      if (!comicissue) {
        throw new Error('processComicIssueWebhook - updated - comicissue not found', data.uuid);
      }else if (!comicstories) {
        throw new Error('processComicIssueWebhook - updated - comicstories not found', data.uuid);
      }

      // pre-download height and width for each story
      if (!comicissue.scopesForExclusiveContent || comicissue.scopesForExclusiveContent.length === 0) {
        await getMultipleHeightAndWidths(comicstories);
      }

      const comicseries = await ComicSeries.getComicSeriesByUuid(comicissue.seriesUuid);
      
      if (!comicseries) {
        console.error('processComicIssueWebhook - updated - comicseries not found', comicissue.seriesUuid);
      }
      
      await Promise.allSettled([
        comicseries ? purgeCacheOnCdn({ type: 'comicseries', id: comicseries.uuid, shortUrl: comicseries.shortUrl }) : [],
        purgeCacheOnCdn({ type: 'comicissue', id: comicissue.uuid, seriesUuid: comicseries?.uuid, shortUrl: comicseries?.shortUrl, name: comicseries?.name || undefined }),
        comicstories.length > 0 ? purgeMultipleCacheOnCdn({ type: 'comicstory', ids: comicstories.map(story => story.uuid) }) : [],
      ])

      return;
    }
    case 'deleted': {
      const deletedComicIssue = await ComicIssue.deleteComicIssue(data);

      if (!deletedComicIssue || !deletedComicIssue.uuid) {
        throw new Error('processComicIssueWebhook - deleted - deletedComicIssue not found', data.uuid);
      }

      const { uuid, storyUuids, seriesUuid } = deletedComicIssue;

      const comicseries = await ComicSeries.getComicSeriesByUuid(seriesUuid);

      if (!comicseries) {
        console.error('processComicIssueWebhook - deleted - comicseries not found', seriesUuid);
      }

      await Promise.allSettled([
        comicseries ? purgeCacheOnCdn({ type: 'comicseries', id: comicseries.uuid, shortUrl: comicseries.shortUrl }) : [],
        purgeCacheOnCdn({ type: 'comicissue', id: uuid, seriesUuid: comicseries?.uuid, shortUrl: comicseries?.shortUrl, name: comicseries?.name || undefined }),
        storyUuids ? purgeMultipleCacheOnCdn({ type: 'comicstory', ids: storyUuids }) : [],
      ])
      return;
    }
    default:
      throw new Error('processComicIssueWebhook - Invalid action');
  }
}

async function processCreatorWebhook(body: TaddyWebhook): Promise<void> {
  const { taddyType, action, data } = body;
  switch (action) {
    case 'created': {
      const creator = await Creator.addCreator(data);

      if (!creator) {
        throw new Error('processCreatorWebhook - created - creator not found', data.uuid);
      }

      await purgeCacheOnCdn({ type: 'creator', id: creator.uuid })
      return;
    }
    case 'updated': {
      const creator = await Creator.updateCreator(data);

      if (!creator) {
        throw new Error('processCreatorWebhook - updated - creator not found', data.uuid);
      }

      await purgeCacheOnCdn({ type: 'creator', id: creator.uuid })
      return;
    }
    case 'deleted': {
      const deletedCreator = await Creator.deleteCreator(data);

      if (!deletedCreator || !deletedCreator.uuid) {
        throw new Error('processCreatorWebhook - deleted - creatorUuid not found', data.uuid );
      }

      const { uuid, contentUuids, shortUrl } = deletedCreator;

      await Promise.allSettled([
        purgeCacheOnCdn({ type: 'creator', id: uuid, shortUrl }),
        contentUuids ? purgeMultipleCacheOnCdn({ type: 'creatorcontent', ids: contentUuids }) : [],
      ])
      return;
    }
    default:
      throw new Error('processCreatorWebhook - Invalid action');
  }
}

async function processCreatorContentWebhook(body: TaddyWebhook): Promise<void> {
  const { taddyType, action, data } = body;
  switch (action) {
    case 'created': {
      const creatorcontent = await CreatorContent.addOrUpdateCreatorContent(data);

      if (!creatorcontent) {
        throw new Error('processCreatorContentWebhook - created - creatorcontent not found', data.uuid);
      }
      
      const creator = await Creator.getCreatorByUuid(creatorcontent.creatorUuid);

      if (!creator) {
        console.error('processCreatorContentWebhook - created - creator not found', creatorcontent.creatorUuid);
      }

      await Promise.allSettled([
        creator ? purgeCacheOnCdn({ type: 'creator', id: creator.uuid, shortUrl: creator.shortUrl }) : [],
        purgeCacheOnCdn({ type: 'creatorcontent', id: creatorcontent.uuid }),
      ])
      
      // push notification
      await sendPushNotification(taddyType, action, data);

      return;
    }
    case 'updated': {
      const creatorcontent = await CreatorContent.addOrUpdateCreatorContent(data);

      if (!creatorcontent) {
        throw new Error('processCreatorContentWebhook - updated - creatorcontent not found', data.uuid);
      }
      
      const creator = await Creator.getCreatorByUuid(creatorcontent.creatorUuid);

      if (!creator) {
        console.error('processCreatorContentWebhook - updated - creator not found', creatorcontent.creatorUuid);
      }

      await Promise.allSettled([
        creator ? purgeCacheOnCdn({ type: 'creator', id: creator.uuid, shortUrl: creator.shortUrl }) : [],
        purgeCacheOnCdn({ type: 'creatorcontent', id: creatorcontent.uuid }),
      ])
      return;
    }
    case 'deleted': {
      const deletedCreatorContent = await CreatorContent.deleteCreatorContent(data);

      if (!deletedCreatorContent) {
        throw new Error('processCreatorContentWebhook - deleted - deletedCreatorContent not found', data.uuid);
      }

      const creator = await Creator.getCreatorByUuid(deletedCreatorContent.creatorUuid);

      if (!creator) {
        console.error('processCreatorContentWebhook - deleted - creator not found', deletedCreatorContent.creatorUuid);
      }

      await Promise.allSettled([
        creator ? purgeCacheOnCdn({ type: 'creator', id: creator.uuid, shortUrl: creator.shortUrl }) : [],
        deletedCreatorContent ? purgeCacheOnCdn({ type: 'creatorcontent', id: deletedCreatorContent.uuid }) : [],
      ])
      return;
    }
    default:
      throw new Error('processCreatorContentWebhook - Invalid action');
  }
}

async function sendPushNotification(taddyType: TaddyWebhookType, action: TaddyWebhookAction, data: Record<string, any>) {
  // const source = 'webhook'
  // const pushNotificationData = {
  //   source,
  //   taddyType,
  //   action,
  //   data,
  // }

  // const event = `${source}-${taddyType}-${action}`;
  // const tokenRows = await Common.getFCMTokensForEvent(event, data);
  // const fcmTokens = tokenRows.map(token => token.fcmToken)

  // await fcmSendMulticast({ fcmTokens, source, data: pushNotificationData });
}