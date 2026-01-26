import { database } from "../database/index.js";
import type { UserLikeModel, LikeableType, ParentType } from "../database/types.js";
import { currentDate } from "../utils/date.js";

export class UserLike {
  /**
   * Like an item (upsert - creates or updates if already exists)
   */
  static async likeItem(
    userId: number,
    likeableUuid: string,
    likeableType: LikeableType,
    parentUuid: string,
    parentType: ParentType
  ): Promise<UserLikeModel | null> {
    const [like] = await database('user_likes')
      .insert({
        userId,
        likeableUuid,
        likeableType,
        parentUuid,
        parentType,
        updatedAt: currentDate()
      })
      .onConflict(['userId', 'likeableType', 'likeableUuid'])
      .merge()
      .returning('*');

    return like || null;
  }

  /**
   * Unlike an item (delete)
   */
  static async unlikeItem(
    userId: number,
    likeableUuid: string,
    likeableType: LikeableType
  ): Promise<boolean> {
    const deleted = await database('user_likes')
      .where({ userId, likeableUuid, likeableType })
      .delete();

    return deleted > 0;
  }

  /**
   * Check if a user has liked a single item
   */
  static async hasUserLikedItem(
    userId: number,
    likeableUuid: string,
    likeableType: LikeableType
  ): Promise<boolean> {
    const like = await database('user_likes')
      .where({ userId, likeableUuid, likeableType })
      .first('id');

    return !!like;
  }

  /**
   * Check if a user has liked multiple items (batch check)
   * Returns a Map of likeableUuid -> boolean
   */
  static async hasUserLikedItems(
    userId: number,
    likeableUuids: string[],
    likeableType: LikeableType
  ): Promise<Map<string, boolean>> {
    if (likeableUuids.length === 0) {
      return new Map();
    }

    const likes = await database('user_likes')
      .where({ userId, likeableType })
      .whereIn('likeableUuid', likeableUuids)
      .select('likeableUuid');

    const likedSet = new Set(likes.map(l => l.likeableUuid));
    const result = new Map<string, boolean>();
    likeableUuids.forEach(uuid => result.set(uuid, likedSet.has(uuid)));

    return result;
  }

  /**
   * Like multiple items at once (for super-like feature)
   */
  static async likeMultipleItems(
    userId: number,
    likeableUuids: string[],
    likeableType: LikeableType,
    parentUuid: string,
    parentType: ParentType
  ): Promise<boolean> {
    if (likeableUuids.length === 0) {
      return true;
    }

    const updatedAt = currentDate();
    const likes = likeableUuids.map(likeableUuid => ({
      userId,
      likeableUuid,
      likeableType,
      parentUuid,
      parentType,
      updatedAt
    }));

    await database('user_likes')
      .insert(likes)
      .onConflict(['userId', 'likeableType', 'likeableUuid'])
      .merge();

    return true;
  }

  /**
   * Get all likes for a parent (e.g., all episode likes for a series)
   */
  static async getUserLikesForParent(
    userId: number,
    parentUuid: string,
    parentType: ParentType
  ): Promise<UserLikeModel[]> {
    const likes = await database('user_likes')
      .where({ userId, parentUuid, parentType })
      .select('*');

    return likes;
  }

  /**
   * Get like count for a single item
   */
  static async getLikeCount(
    likeableUuid: string,
    likeableType: LikeableType
  ): Promise<number> {
    const result = await database('user_likes')
      .where({ likeableUuid, likeableType })
      .count('id as count')
      .first();

    return Number(result?.count || 0);
  }

  /**
   * Get like counts for multiple items (batch query)
   * Returns a Map of likeableUuid -> count
   */
  static async getLikeCounts(
    likeableUuids: string[],
    likeableType: LikeableType
  ): Promise<Map<string, number>> {
    if (likeableUuids.length === 0) {
      return new Map();
    }

    const results = await database('user_likes')
      .where({ likeableType })
      .whereIn('likeableUuid', likeableUuids)
      .groupBy('likeableUuid')
      .select('likeableUuid')
      .count('id as count');

    const countMap = new Map<string, number>();
    // Initialize all with 0
    likeableUuids.forEach(uuid => countMap.set(uuid, 0));
    // Set actual counts
    results.forEach(r => countMap.set(r.likeableUuid as string, Number(r.count)));

    return countMap;
  }

  /**
   * Get like counts for all items under a parent (e.g., all episodes in a series)
   * Returns a Map of likeableUuid -> count
   */
  static async getLikeCountsForParent(
    parentUuid: string,
    parentType: ParentType,
    likeableType: LikeableType
  ): Promise<Map<string, number>> {
    const results = await database('user_likes')
      .where({ parentUuid, parentType, likeableType })
      .groupBy('likeableUuid')
      .select('likeableUuid')
      .count('id as count');

    const countMap = new Map<string, number>();
    results.forEach(r => countMap.set(r.likeableUuid as string, Number(r.count)));

    return countMap;
  }
}
