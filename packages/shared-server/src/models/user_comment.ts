import { database } from "../database/index.js";
import type { UserCommentModel } from "../database/types.js";
import { InkverseType } from "../graphql/types.js";
import { currentDate } from "../utils/date.js";
import { v4 as uuidv4 } from "uuid";

export type CommentSortType = 'NEWEST' | 'TOP';

export class UserComment {
  /**
   * Add a new comment or reply
   */
  static async addComment(
    userId: number,
    text: string,
    targetUuid: string,
    targetType: InkverseType,
    parentUuid: string,
    parentType: InkverseType,
    replyToCommentUuid?: string | null
  ): Promise<UserCommentModel | null> {
    const uuid = uuidv4();
    const [comment] = await database('user_comments')
      .insert({
        uuid,
        userId,
        text,
        targetUuid,
        targetType,
        parentUuid,
        parentType,
        replyToCommentUuid: replyToCommentUuid || null,
        isVisible: true,
      })
      .returning('*');

    return comment || null;
  }

  /**
   * Edit an existing comment
   */
  static async editComment(
    commentUuid: string,
    userId: number,
    text: string
  ): Promise<UserCommentModel | null> {
    const [comment] = await database('user_comments')
      .where({ uuid: commentUuid, userId })
      .update({
        text,
        updatedAt: currentDate(),
      })
      .returning('*');

    return comment || null;
  }

  /**
   * Get a comment by UUID
   */
  static async getCommentByUuid(commentUuid: string): Promise<UserCommentModel | null> {
    const comment = await database('user_comments')
      .where({ uuid: commentUuid })
      .first('*');

    return comment || null;
  }

  /**
   * Set comment visibility (soft delete)
   */
  static async setCommentVisibility(
    commentUuid: string,
    userId: number,
    isVisible: boolean
  ): Promise<UserCommentModel | null> {
    const [comment] = await database('user_comments')
      .where({ uuid: commentUuid, userId })
      .update({
        isVisible,
        updatedAt: currentDate(),
      })
      .returning('*');

    return comment || null;
  }

  /**
   * Delete a comment (hard delete)
   */
  static async deleteComment(
    commentUuid: string,
    userId: number
  ): Promise<boolean> {
    const deleted = await database('user_comments')
      .where({ uuid: commentUuid, userId })
      .delete();

    return deleted > 0;
  }

  /**
   * Get paginated top-level comments for an entity
   */
  static async getCommentsForTarget(
    targetUuid: string,
    targetType: InkverseType,
    sortBy: CommentSortType = 'NEWEST',
    page: number = 1,
    limitPerPage: number = 25
  ): Promise<UserCommentModel[]> {
    const offset = (page - 1) * limitPerPage;

    if (sortBy === 'NEWEST') {
      // Simple query for newest
      const comments = await database('user_comments')
        .where({
          targetUuid,
          targetType,
          isVisible: true,
          replyToCommentUuid: null,
        })
        .orderBy('createdAt', 'desc')
        .offset(offset)
        .limit(limitPerPage)
        .select('*');
      return comments;
    }

    // TOP sorting: LEFT JOIN with user_likes to sort by like count
    const comments = await database('user_comments')
      .leftJoin('user_likes', function() {
        this.on('user_comments.uuid', '=', 'user_likes.likeable_uuid')
          .andOn('user_likes.likeable_type', '=', database.raw('?', ['COMMENT']));
      })
      .where({
        'user_comments.target_uuid': targetUuid,
        'user_comments.target_type': targetType,
        'user_comments.is_visible': true,
        'user_comments.reply_to_comment_uuid': null,
      })
      .groupBy('user_comments.id')
      .orderByRaw('COUNT(user_likes.id) DESC, user_comments.created_at ASC')
      .offset(offset)
      .limit(limitPerPage)
      .select('user_comments.*');

    return comments;
  }

  /**
   * Get replies for a specific comment
   */
  static async getRepliesForComment(
    replyToCommentUuid: string,
    page: number = 1,
    limitPerPage: number = 25
  ): Promise<UserCommentModel[]> {
    const offset = (page - 1) * limitPerPage;

    const replies = await database('user_comments')
      .where({
        replyToCommentUuid,
        isVisible: true,
      })
      .orderBy('createdAt', 'asc') // Oldest first for replies
      .offset(offset)
      .limit(limitPerPage)
      .select('*');

    return replies;
  }

  /**
   * Get comment count for an entity (top-level only)
   */
  static async getCommentCount(
    targetUuid: string,
    targetType: InkverseType
  ): Promise<number> {
    const result = await database('user_comments')
      .where({
        targetUuid,
        targetType,
        isVisible: true,
      })
      .count('id as count')
      .first();

    return Number(result?.count || 0);
  }

  /**
   * Get reply count for a specific comment
   */
  static async getReplyCount(commentUuid: string): Promise<number> {
    const result = await database('user_comments')
      .where({
        replyToCommentUuid: commentUuid,
        isVisible: true,
      })
      .count('id as count')
      .first();

    return Number(result?.count || 0);
  }

  /**
   * Get reply counts for multiple comments (batch)
   */
  static async getReplyCounts(commentUuids: string[]): Promise<Map<string, number>> {
    if (commentUuids.length === 0) {
      return new Map();
    }

    const results = await database('user_comments')
      .where({ isVisible: true })
      .whereIn('replyToCommentUuid', commentUuids)
      .groupBy('replyToCommentUuid')
      .select('replyToCommentUuid')
      .count('id as count');

    const countMap = new Map<string, number>();
    // Initialize all with 0
    commentUuids.forEach(uuid => countMap.set(uuid, 0));
    // Set actual counts
    results.forEach(r => countMap.set(r.replyToCommentUuid as string, Number(r.count)));

    return countMap;
  }

  /**
   * Get all comments by a user for a target (to get liked comment UUIDs)
   */
  static async getCommentsByUser(
    userId: number,
    targetUuid: string,
    targetType: InkverseType
  ): Promise<UserCommentModel[]> {
    const comments = await database('user_comments')
      .where({
        userId,
        targetUuid,
        targetType,
      })
      .select('*');

    return comments;
  }
}
