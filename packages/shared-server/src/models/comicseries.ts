import { get } from "lodash-es";

import { safeSeriesStatus } from "@inkverse/public/status";
import { safeGenresArray } from "@inkverse/public/genres";
import { safeLanguage } from "@inkverse/public/language";
import { safeContentRating } from "@inkverse/public/ratings";
import { safeSeriesType } from "@inkverse/public/series-type";
import { safeLayoutType } from "@inkverse/public/layout";
import { arrayToObject } from "@inkverse/public/utils";

import { database, type ComicIssueModel, type ComicSeriesModel } from "../database/index.js";
import { TaddyType } from "../graphql/types.js";
import { safeStringValue, safeObjWithVariantKeys, safeArrayProperties, prettyEncodeTitle, convertTextToBoolean, convertToCamelCase } from "../utils/common.js";
import { UUIDLookup } from "./index.js";
import { setSimpleCache } from "../utils/simplecache.js";
import { getSimpleCache } from "../utils/simplecache.js";


type ComicSeriesInput = Omit<ComicSeriesModel, 'id' | 'uuid' | 'createdAt' | 'updatedAt'>;

function getSeriesDetails(data: Record<string, any>, shortUrl: string): ComicSeriesInput {
  const name = safeStringValue(get(data, 'name', null));
  const description = safeStringValue(get(data, 'description', null), 1000);
  const hash = safeStringValue(get(data, 'hash', null), 255);
  const issuesHash = safeStringValue(get(data, 'issuesHash', null), 255);
  const datePublished = get(data, 'datePublished', null);
  const status = safeSeriesStatus(get(data, 'status', null))
  const tags = safeArrayProperties(get(data, 'tags', null), 255);
  const genres = safeGenresArray(get(data, 'genres', null));
  const genre0 = get(genres, '0', null);
  const genre1 = get(genres, '1', null);
  const genre2 = get(genres, '2', null);
  const coverImageAsString = safeStringValue(get(data, 'coverImageAsString', null), 5000);
  const bannerImageAsString = safeStringValue(get(data, 'bannerImageAsString', null), 5000);
  const thumbnailImageAsString = safeStringValue(get(data, 'thumbnailImageAsString', null), 5000);
  const coverImage = safeObjWithVariantKeys(coverImageAsString, ['base_url', 'cover_sm', 'cover_md', 'cover_lg']);
  const bannerImage = safeObjWithVariantKeys(bannerImageAsString, ['base_url', 'banner_sm', 'banner_md', 'banner_lg']);
  const thumbnailImage = safeObjWithVariantKeys(thumbnailImageAsString, ['base_url', 'thumbnail']);
  const language = safeLanguage(get(data, 'language', null));
  const contentRating = safeContentRating(get(data, 'contentRating', null));
  const seriesType = safeSeriesType(get(data, 'seriesType', null));
  const seriesLayout = safeLayoutType(get(data, 'seriesLayout', null));
  const copyright = safeStringValue(get(data, 'copyright', null), 2000);
  const sssUrl = safeStringValue(get(data, 'sssUrl', null), 2000) as string;
  const sssOwnerName = safeStringValue(get(data, 'sssOwnerName', null));
  const sssOwnerPublicEmail = safeStringValue(get(data, 'sssOwnerPublicEmail', null), 1000);
  const isBlocked = convertTextToBoolean(get(data, 'isBlocked', null));
  const hostingProviderUuid = data?.hostingProvider?.uuid || null;
  const scopesForExclusiveContent = safeArrayProperties(get(data, 'scopesForExclusiveContent', null), 1000);

  return {
    name,
    description,
    shortUrl,
    hash,
    issuesHash,
    datePublished,
    status,
    tags,
    genre0,
    genre1,
    genre2,
    coverImage,
    bannerImage,
    thumbnailImage,
    language,
    contentRating,
    seriesType,
    seriesLayout,
    copyright,
    sssUrl,
    sssOwnerName,
    sssOwnerPublicEmail,
    isBlocked,
    hostingProviderUuid,
    scopesForExclusiveContent,
  }
}

export class ComicSeries {
  static async getComicSeriesByUuid(uuid: string): Promise<ComicSeriesModel | null> {
    return await database('comicseries')
      .where({ uuid })
      .first();
  }

  static async getComicSeriesByUuids(uuids: string[]): Promise<ComicSeriesModel[]> {
    return await database('comicseries')
      .whereIn('uuid', uuids)
      .returning('*');
  }

  static async getComicSeriesByShortUrl(shortUrl: string): Promise<ComicSeriesModel | null> {
    return await database('comicseries')
      .where({ shortUrl })
      .first();
  }

  static async getRecentlyAddedComicSeries(page: number, limitPerPage: number): Promise<ComicSeriesModel[]> {
    return await database('comicseries')
      .orderBy('created_at', 'desc')
      .andWhere('is_blocked', false)
      .limit(limitPerPage)
      .offset((page - 1) * limitPerPage)
      .returning('*');
  }

  static async getRecentlyUpdatedComicSeries(page: number, limitPerPage: number): Promise<ComicSeriesModel[]> {
    const comicissuesRawPromise = database.raw(`
      SELECT * 
      FROM (
        SELECT *, ROW_NUMBER() OVER(PARTITION BY series_uuid ORDER BY date_published DESC) AS rn
        FROM comicissue
        WHERE date_published < EXTRACT(EPOCH FROM NOW()) * 1000
      ) AS ranked_issues
      WHERE rn = 1
      ORDER BY date_published DESC
      LIMIT ${limitPerPage} OFFSET ${(page - 1) * limitPerPage}
    `)

    const comicseriesRecentlyAddedPromise = ComicSeries.getRecentlyAddedComicSeries(page, limitPerPage);

    const [comicissuesRaw, comicseriesRecentlyAdded] = await Promise.all([comicissuesRawPromise, comicseriesRecentlyAddedPromise]);

    const comicissues: ComicIssueModel[] = comicissuesRaw.rows.map((issue: any) => convertToCamelCase(issue));

    const seriesUuidsOutOfOrder = comicissues.map(issue => issue.seriesUuid);
    const seriesUuidsRecentlyAdded = comicseriesRecentlyAdded.map(series => series.uuid);
    const oldUpdatedComicseriesUuids: string[] = getSimpleCache('recently-updated-comicseries') as string[] || [];
    const oldUpdatedComicseriesUuidsSet = new Set(oldUpdatedComicseriesUuids);
    const seriesUuidsRecentlyAddedSet = new Set(seriesUuidsRecentlyAdded);

    const seriesUuidsNotInCache = seriesUuidsOutOfOrder.filter(uuid => !oldUpdatedComicseriesUuidsSet.has(uuid));
    const seriesUuidsInCache = seriesUuidsOutOfOrder.filter(uuid => oldUpdatedComicseriesUuidsSet.has(uuid));
    const seriesUuids = [...seriesUuidsNotInCache, ...seriesUuidsInCache].filter(uuid => !seriesUuidsRecentlyAddedSet.has(uuid));

    const comicseriesOutOfOrder = await ComicSeries.getComicSeriesByUuids(seriesUuids);

    const comicseriesObj = arrayToObject(comicseriesOutOfOrder, 'uuid');
    const comicseries = seriesUuids
      .map(uuid => comicseriesObj[uuid])
      .filter(series => series && !series.isBlocked)
      .slice(0, limitPerPage)
      .filter(series => series != undefined)

    const seriesUuidsForCache = comicseries.map(series => series.uuid);
    setSimpleCache('recently-updated-comicseries', seriesUuidsForCache);
    return comicseries;
  }

  static async getShortUrl(uuid: string, name: string): Promise<string> {
    const savedcomicseries = await ComicSeries.getComicSeriesByUuid(uuid);
    if (savedcomicseries && savedcomicseries.shortUrl) {
      return savedcomicseries.shortUrl
    } else {
      if (!name) { throw new Error('comicseries - getShortUrl - name is required') };
      const nameLowercase = name.toLowerCase();
      const shortUrl = prettyEncodeTitle(nameLowercase);
      const formattedShortUrl = `^${shortUrl}($|[0-9]+)`;
      const comicseries = await database('comicseries')
        .whereRaw("short_url ~ ? AND (short_url !~ '[0-9]$' OR short_url ~ '[0-9]+$')", [formattedShortUrl])
        .returning("*");

      return comicseries.length > 0
        ? `${shortUrl}-${comicseries.length}`
        : shortUrl;
    }
  }

  static async getIssueCount(uuid: string): Promise<number> {    
    const [issueCount] = await database('comicissue')
      .where({ series_uuid: uuid })
      .count('uuid', { as: 'issueCount' })
      .returning('issueCount');

    if (!issueCount) { return 0 }

    return issueCount.issueCount ? Number(issueCount.issueCount) : 0;
  }

  static async addComicSeries(data: Record<string, any>): Promise<ComicSeriesModel | null> {
    const { uuid, name } = data;
    var trx = await database.transaction();
    try {
      const shortUrl = await ComicSeries.getShortUrl(uuid, name);
      await UUIDLookup.saveUUIDforType(trx, uuid, TaddyType.COMICSERIES);
      const [comicseries] = await database("comicseries")
        .transacting(trx)
        .insert({
          uuid,
          ...getSeriesDetails(data, shortUrl)
        })
        .returning("*");

      await trx.commit();

      return comicseries;
    }
    catch (e) {
      console.log('addComicSeries transaction rollback', uuid, e);
      await trx.rollback();
      throw e;
    }
  }

  static async updateComicSeries(data: Record<string, any>): Promise<ComicSeriesModel | null> {
    const { uuid, name } = data;
    var trx = await database.transaction();
    try {
      const shortUrl = await ComicSeries.getShortUrl(uuid, name);
      const [comicseries] = await database("comicseries")
        .transacting(trx)
        .where({ uuid })
        .update({
          updatedAt: new Date(),
          ...getSeriesDetails(data, shortUrl)
        })
        .returning("*");

      await trx.commit();

      return comicseries;
    }
    catch (e) {
      console.log('updateComicSeries transaction rollback', uuid, e);
      await trx.rollback();
      throw e;
    }
  }

  static async deleteComicSeries(data: Record<string, any>): Promise<{ uuid: string, issueUuids: string[], storyUuids: string[], shortUrl: string } | null> {
    const { uuid } = data;
    var trx = await database.transaction();

    try {
      const [deletedComicSeries] = await database('comicseries')
        .transacting(trx)
        .where({ uuid })
        .delete('*');

      const deletedComicIssues = await database('comicissue')
        .transacting(trx)
        .where({ seriesUuid: uuid })
        .delete('*');

      const deletedComicStories = await database('comicstory')
        .transacting(trx)
        .where({ seriesUuid: uuid })
        .delete('*');

      const allIssuesUUids = deletedComicIssues.map(issue => issue.uuid);
      const allStoriesUUids = deletedComicStories.map(story => story.uuid);
      const allNonStoryUuids = [uuid, ...allIssuesUUids];

      await UUIDLookup.deleteLookupsForUuids(trx, allNonStoryUuids);

      await trx.commit();

      return {
        uuid,
        issueUuids: allIssuesUUids,
        storyUuids: allStoriesUUids,
        shortUrl: deletedComicSeries.shortUrl
      };
    }
    catch (e) {
      console.log('deleteComicSeries transaction rollback', uuid, e);
      await trx.rollback();
      throw e;
    }
  }
}