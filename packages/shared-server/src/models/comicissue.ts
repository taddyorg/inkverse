import { get } from "lodash-es";

import { database, type ComicIssueModel, type ComicStoryModel } from "../database/index.js";
import { SortOrder, TaddyType } from "../graphql/types.js";

import { safeStringValue, safeObjWithVariantKeys, safeArrayProperties, convertTextToBoolean } from "../utils/common.js";

import { UUIDLookup, ComicStory } from "./index.js";
import { arrayToObject } from "@inkverse/public/utils";
import { sortOrderToSQLOrderBy } from "./utils.js";

type ComicIssueInput = Omit<ComicIssueModel, 'id' | 'uuid' | 'createdAt' | 'updatedAt'>;

function getIssueDetails(data: Record<string, any>): ComicIssueInput {
  const name = safeStringValue(get(data, 'name', null));
  const seriesUuid = safeStringValue(get(data, 'seriesUuid', null));
  const hash = safeStringValue(get(data, 'hash', null), 255);
  const storiesHash = safeStringValue(get(data, 'storiesHash', null), 255);
  const position = get(data, 'position', null);
  const creatorNote = safeStringValue(get(data, 'creatorNote', null), 2000);
  const datePublished = get(data, 'datePublished', null);
  const bannerImageAsString = safeStringValue(get(data, 'bannerImageAsString', null), 5000);
  const thumbnailImageAsString = safeStringValue(get(data, 'thumbnailImageAsString', null), 5000);
  const bannerImage = safeObjWithVariantKeys(bannerImageAsString, ['base_url', 'banner_sm', 'banner_md', 'banner_lg']);
  const thumbnailImage = safeObjWithVariantKeys(thumbnailImageAsString, ['base_url', 'thumbnail']);
  const isBlocked = convertTextToBoolean(get(data, 'isBlocked', null));
  const pushNotificationMessage = safeStringValue(get(data, 'pushNotificationMessage', null), 500);
  const scopesForExclusiveContent = safeArrayProperties(get(data, 'scopesForExclusiveContent', null), 1000);
  const dateExclusiveContentIsAvailable = get(data, 'dateExclusiveContentIsAvailable', null);

  if (!seriesUuid) {
    throw new Error('getIssueDetails - seriesUuid is required');
  }

  return {
    name,
    seriesUuid,
    hash,
    storiesHash,
    position,
    creatorNote,
    datePublished,
    bannerImage,
    thumbnailImage,
    isBlocked,
    isRemoved: null,
    pushNotificationMessage,
    scopesForExclusiveContent,
    dateExclusiveContentIsAvailable,
  }
}

type ComicStoryInput = Omit<ComicStoryModel, 'id' | 'createdAt' | 'updatedAt' | 'width' | 'height'>;

function getStoryDetails(story: Record<string, any>, issue: Record<string, any>, position: number): ComicStoryInput {
  const uuid = safeStringValue(get(story, 'uuid', null));
  const issueUuid = safeStringValue(get(issue, 'uuid', null));
  const seriesUuid = safeStringValue(get(issue, 'seriesUuid', null));
  const hash = safeStringValue(get(story, 'hash', null), 255);
  const storyImageAsString = safeStringValue(get(story, 'storyImageAsString', null), 5000);
  const storyImage = safeObjWithVariantKeys(storyImageAsString, ['base_url', 'story']);

  if (!uuid || !issueUuid || !seriesUuid) {
    throw new Error('getStoryDetails - uuid, issueUuid, or seriesUuid is required');
  }

  return {
    uuid,
    issueUuid,
    seriesUuid,
    hash,
    position,
    storyImage,
    isRemoved: null,
  }
}

export class ComicIssue {
  static async getComicIssueByUuid(uuid: string): Promise<ComicIssueModel | null> {
    return await database('comicissue')
      .where({ uuid })
      .first();
  }

  static async getByUuids(uuids: string[], limit: number = 25): Promise<ComicIssueModel[]> {
    return await database('comicissue')
      .whereIn('uuid', uuids)
      .limit(limit);
  }

  static async getComicIssueForSeries(seriesUuid: string, sortOrder: SortOrder = SortOrder.LATEST): Promise<ComicIssueModel | null> {
    return await database.select(['comicissue.*'])
      .from('comicseries')
      .rightJoin('comicissue', 'comicseries.uuid', 'comicissue.series_uuid')
      .whereRaw('comicseries.uuid = ?', [seriesUuid])
      .orderBy('comicissue.position', sortOrderToSQLOrderBy(sortOrder))
      .first();
  }

  static async getComicIssuesForSeries(
    seriesUuid: string,
    sortOrder: SortOrder = SortOrder.LATEST,
    limit: number = 10,
    offset: number = 0,
    includeRemovedIssues: boolean = false
  ): Promise<ComicIssueModel[]> {
    return await database('comicissue')
      .where({
        seriesUuid,
      })
      .orderByRaw('position ' + sortOrderToSQLOrderBy(sortOrder) + ' NULLS LAST')
      .offset(offset)
      .limit(limit)
      .modify(function (queryBuilder) {
        if (!includeRemovedIssues) {
          queryBuilder.andWhereRaw('(is_removed IS NULL OR is_removed = false)')
        }
      })
      .returning('*');
  }

  static async getComicIssueForSeriesByPosition(seriesUuid: string, position: number): Promise<ComicIssueModel | null> {
    return await database('comicissue')
      .where({
        seriesUuid,
        position,
      })
      .first();
  }

  static async addComicIssue(data: Record<string, any>): Promise<[ComicIssueModel, ComicStoryModel[]]> {
    const { uuid, seriesUuid } = data;
    var trx = await database.transaction();
    try {
      await UUIDLookup.saveUUIDforType(trx, uuid, TaddyType.COMICISSUE);
      const storiesData = get(data, 'stories', []);
      const [comicissue] = await database('comicissue')
        .transacting(trx)
        .insert({
          uuid,
          ...getIssueDetails(data),
        })
        .returning('*');

      const stories = storiesData.map((story: Record<string, any>, index: number) => {
        return getStoryDetails(story, data, index)
      });

      const comicstories = stories.length
        ? await ComicStory.addComicStories(trx, stories, uuid, seriesUuid)
        : [];

      await trx.commit();

      return [comicissue, comicstories];
    }
    catch (e) {
      console.log('addComicIssue transaction rollback', uuid, e);
      await trx.rollback();
      throw e;
    }
  }

  static async updateComicIssue(data: Record<string, any>): Promise<[ComicIssueModel, ComicStoryModel[]]> {
    const { uuid, seriesUuid } = data;
    var trx = await database.transaction();
    try {
      const storiesData = get(data, 'stories', []);

      const [comicissue] = await database('comicissue')
        .transacting(trx)
        .where({
          uuid,
          seriesUuid,
        })
        .update({
          updatedAt: new Date(),
          ...getIssueDetails(data),
        })
        .returning('*');

      if (!comicissue) {
        throw new Error('comicissue not found');
      }

      const alreadyaddedcomicstories = await ComicStory.getEfficientComicStoriesByIssueAndSeriesUuid(uuid, seriesUuid);
      const comicstoriesObjByUuid = arrayToObject(alreadyaddedcomicstories, 'uuid');
      const alreadyRemovedComicStoriesByUuid = alreadyaddedcomicstories.filter(comicstory => comicstory.isRemoved).map(comicstory => comicstory.uuid);
      const alreadyRemovedComicStoriesSet = new Set(alreadyRemovedComicStoriesByUuid);
      const alreadySavedStoryUuids = Object.keys(comicstoriesObjByUuid);

      const storiesToAdd = storiesData.map((story: Record<string, any>, index: number) => {
        return getStoryDetails(story, data, index)
      });

      const storiesAdded = storiesToAdd.filter((story: ComicStoryModel) => !comicstoriesObjByUuid[story.uuid]);
      const storiesUpdated = storiesToAdd.filter((story: ComicStoryModel) => comicstoriesObjByUuid[story.uuid]);

      const comicstoriesadded = storiesAdded.length
        ? await ComicStory.addComicStories(trx, storiesAdded, uuid, seriesUuid)
        : [];

      const comicstoriesupdated = storiesUpdated.length
        ? await ComicStory.updateComicStories(trx, storiesUpdated, uuid, seriesUuid)
        : [];

      const addedOrUpdatedComicStoriesUuids = [...comicstoriesadded, ...comicstoriesupdated].map((story: ComicStoryModel) => story.uuid);
      const addedOrUpdatedComicIssuesUuidsSet = new Set(addedOrUpdatedComicStoriesUuids);
      const storyUuidsRemovedFromFeed = alreadySavedStoryUuids.filter((uuid) => {
        return !addedOrUpdatedComicIssuesUuidsSet.has(uuid) && !alreadyRemovedComicStoriesSet.has(uuid)
      });

      const comicissuesremoved = storyUuidsRemovedFromFeed.length
        ? await ComicStory.setComicStoriesAsRemoved(trx, storyUuidsRemovedFromFeed)
        : [];

      const comicstories = [...comicstoriesadded, ...comicstoriesupdated, ...comicissuesremoved]

      await trx.commit();

      return [comicissue, comicstories];
    } catch (e) {
      console.log('updateComicIssue transaction rollback', uuid, e);
      await trx.rollback();
      throw e;
    }
  }

  static async deleteComicIssue(data: Record<string, any>): Promise<{ uuid: string, storyUuids: string[], seriesUuid: string }> {
    const { uuid } = data;
    var trx = await database.transaction();

    try {
      const [deletedComicIssue] = await database('comicissue')
        .transacting(trx)
        .where({ uuid })
        .delete('*');

      const deletedComicStories = await database('comicstory')
        .transacting(trx)
        .where({ issueUuid: uuid })
        .delete('*');

      const allStoriesUUids = deletedComicStories.map(story => story.uuid);

      await UUIDLookup.deleteLookupsForUuids(trx, [uuid, ...allStoriesUUids]);

      await trx.commit();

      return {
        uuid,
        storyUuids: allStoriesUUids,
        seriesUuid: deletedComicIssue.seriesUuid,
      };
    }
    catch (e) {
      console.log('deleteComicIssue transaction rollback', uuid, e);
      await trx.rollback();
      throw e;
    }
  }
}