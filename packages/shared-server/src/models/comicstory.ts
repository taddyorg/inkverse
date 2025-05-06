import type { Knex } from "knex";
import { flatten } from "lodash-es";

import { database, type ComicStoryModel } from "../database/index.js";

export class ComicStory {
  static async getComicStoryByUuid(uuid: string): Promise<ComicStoryModel> {
    return await database('comicstory')
      .where({ uuid })
      .first();
  }

  static async getComicStoriesForIssue(
    issueUuid: string,
    includeRemovedStories: boolean | undefined = false
  ): Promise<ComicStoryModel[]> {
    return await database('comicstory')
      .where({ issueUuid })
      .orderBy('position', 'asc')
      .modify((queryBuilder: Knex.QueryBuilder) => {
        if (!includeRemovedStories) {
          queryBuilder.andWhereRaw('(is_removed IS NULL OR is_removed = false)')
        }
      })
      .returning('*');
  }

  static async getEfficientComicStoriesByIssueAndSeriesUuid(issueUuid: string, seriesUuid: string): Promise<ComicStoryModel[]> {
    return await database('comicstory')
      .select('uuid', 'issueUuid', 'seriesUuid', 'hash', 'isRemoved')
      .where({ 
        issueUuid, 
        seriesUuid 
      })
      .returning('*');
  }

  static async addComicStories(
    trx: Knex.Transaction,
    stories: ComicStoryModel[],
    issueUuid: string,
    seriesUuid: string
  ): Promise<ComicStoryModel[]> {
    const storiesWithIssueAndSeriesUuid = stories.map(story => ({ ...story, issueUuid, seriesUuid }));
    try {
      const comicstories = await database('comicstory')
            .transacting(trx)
            .insert(storiesWithIssueAndSeriesUuid)
            .returning('*');
      return comicstories;
    }
    catch (e) {
      console.log('addComicStories transaction rollback', issueUuid, e);
      await trx.rollback();
      throw e;
    }
  }

  static async updateComicStories(
    trx: Knex.Transaction,
    stories: ComicStoryModel[],
    issueUuid: string,
    seriesUuid: string
  ): Promise<ComicStoryModel[]> {
    try {
      const updates = stories.map(async (story: Partial<ComicStoryModel>) => {
        const { uuid, ...storyData } = story;
      
        return database('comicstory')
          .transacting(trx)
          .where({
            uuid,
            issueUuid,
            seriesUuid,
          })
          .update({
            updatedAt: new Date(),
            ...storyData,
          })
          .returning('*');
      });
      
      const comicstories = await Promise.all(updates);
      return flatten(comicstories);
    }
    catch (e) {
      console.log('updateComicStories transaction rollback', issueUuid, e);
      await trx.rollback();
      throw e;
    }
  }

  static async updateHeightAndWidthForComicStories(
    trx: Knex.Transaction,
    stories: Partial<ComicStoryModel>[],
    issueUuid: string,
    seriesUuid: string
  ): Promise<ComicStoryModel[] | undefined> {
    const [updatedStories] = await Promise.all(stories.map(story => 
      trx('comicstory')
        .where('uuid', story.uuid)
        .update({
          issueUuid,
          seriesUuid,
          width: story.width,
          height: story.height,
          storyImage: story.storyImage
        })
        .returning('*')
    ));

    return updatedStories;
  }

  static async updateHeightAndWidthForComicStory(uuid: string, issueUuid: string, seriesUuid: string, width: number, height: number): Promise<ComicStoryModel | undefined> {
    try {
      const [story] = await database('comicstory')
        .where({
          uuid,
          issueUuid,
          seriesUuid,
        })
        .update({
          updatedAt: new Date(),
          width,
          height,
        })
        .returning('*');
      
      return story
    }
    catch (e) {
      console.log('updateComicStory transaction rollback', issueUuid, e);
      throw e;
    }
  }

  static async setComicStoriesAsRemoved(
    trx: Knex.Transaction,
    uuids: string[]
  ): Promise<ComicStoryModel[]> {
    try {
      return await database('comicstory')
        .transacting(trx)
        .whereIn('uuid', uuids)
        .update({
          updatedAt: new Date(),
          hash: null,
          position: null,
          storyImage: null,
          isRemoved: true,
        })
        .returning('*');
    }
    catch (e) {
      console.log('setComicStoriesAsRemoved transaction rollback', uuids, e);
      await trx.rollback();
      throw e;
    }
  }
}