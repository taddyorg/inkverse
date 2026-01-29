import { UserComment, UserLike, User } from '@inkverse/shared-server/models/index';
import { LikeableType } from '@inkverse/shared-server/database/types';
import { InkverseType, type QueryResolvers } from '@inkverse/shared-server/graphql/types';
import type { UserCommentModel, UserModel } from '@inkverse/shared-server/database/types';

// GraphQL Type Definitions
export const CommentDefinitions = `
  """
  Public comment data (no auth required)
  """
  type Comment {
    uuid: ID!
    text: String!
    createdAt: Int!
    user: User
    targetUuid: ID!
    targetType: InkverseType!
    replyToUuid: ID
    stats: CommentStats
  }

  """
  Stats for a comment (like count, reply count)
  """
  type CommentStats {
    uuid: ID!
    likeCount: Int
    replyCount: Int
  }

  """
  Sort type for comments
  """
  enum CommentSortType {
    NEWEST
    TOP
  }

  """
  Wrapper type for comments on a target, enabling Stellate caching by targetUuid
  """
  type CommentsForTarget {
    targetUuid: ID!
    targetType: InkverseType!
    comments: [Comment!]!
  }
`;

// Query Definitions
export const CommentQueriesDefinitions = `
  """
  Get paginated comments for a target (e.g., comic issue)
  """
  getComments(
    targetUuid: ID!
    targetType: InkverseType!
    page: Int
    limitPerPage: Int
    sortBy: CommentSortType
  ): CommentsForTarget!

  """
  Get replies for a specific comment
  """
  getRepliesForComment(
    targetUuid: ID!
    targetType: InkverseType!
    commentUuid: ID!
    page: Int
    limitPerPage: Int
  ): CommentsForTarget!
`;

// Helper to build Comment response
function buildComment(
  comment: UserCommentModel,
  userMap: Map<number, UserModel | null>,
  likeCountMap: Map<string, number>,
  replyCountMap: Map<string, number>
) {
  return {
    uuid: comment.uuid,
    text: comment.text,
    createdAt: comment.createdAt,
    userId: comment.userId,
    user: userMap.get(comment.userId) || null,
    targetUuid: comment.targetUuid,
    targetType: comment.targetType,
    replyToUuid: comment.replyToCommentUuid,
    stats: {
      uuid: comment.uuid,
      likeCount: likeCountMap.get(comment.uuid) || 0,
      replyCount: replyCountMap.get(comment.uuid) || 0,
    },
  };
}

// Resolvers
export const CommentQueries: QueryResolvers = {
  getComments: async (
    _parent: any,
    { targetUuid, targetType, page = 1, limitPerPage = 25, sortBy = 'TOP' }: {
      targetUuid: string;
      targetType: InkverseType;
      page?: number | null;
      limitPerPage?: number | null;
      sortBy?: 'NEWEST' | 'TOP' | null;
    },
    _context: any
  ) => {
    const actualPage = page ?? 1;
    const actualLimit = limitPerPage ?? 25;
    const actualSortBy = sortBy ?? 'TOP';

    // Validate target type
    if (!Object.values(InkverseType).includes(targetType)) {
      throw new Error(`Invalid target type: ${targetType}`);
    }

    // Get comments (already sorted by database: NEWEST or TOP)
    const comments = await UserComment.getCommentsForTarget(
      targetUuid,
      targetType,
      actualSortBy,
      actualPage,
      actualLimit
    );

    if (comments.length === 0) {
      return { targetUuid, targetType, comments: [] };
    }

    // Get comment UUIDs for batch queries
    const commentUuids = comments.map(c => c.uuid);
    const userIds = [...new Set(comments.map(c => c.userId))];

    // Batch fetch: users, like counts, reply counts
    const [users, likeCounts, replyCounts] = await Promise.all([
      Promise.all(userIds.map(id => User.getUserById(String(id)))),
      UserLike.getLikeCounts(commentUuids, LikeableType.COMMENT),
      UserComment.getReplyCounts(commentUuids),
    ]);

    // Build user map
    const userMap = new Map<number, UserModel | null>();
    userIds.forEach((id, index) => userMap.set(id, users[index] ?? null));

    // Build responses
    return {
      targetUuid,
      targetType,
      comments: comments.map(comment =>
        buildComment(comment, userMap, likeCounts, replyCounts)
      ),
    };
  },

  getRepliesForComment: async (
    _parent: any,
    { targetUuid, targetType, commentUuid, page = 1, limitPerPage = 25 }: {
      targetUuid: string;
      targetType: InkverseType;
      commentUuid: string;
      page?: number | null;
      limitPerPage?: number | null;
    },
    _context: any
  ) => {
    const actualPage = page ?? 1;
    const actualLimit = limitPerPage ?? 25;

    // Get replies
    const replies = await UserComment.getRepliesForComment(
      commentUuid,
      actualPage,
      actualLimit
    );

    if (replies.length === 0) {
      return { targetUuid, targetType, comments: [] };
    }

    // Get reply UUIDs for batch queries
    const replyUuids = replies.map(r => r.uuid);
    const userIds = [...new Set(replies.map(r => r.userId))];

    // Batch fetch: users, like counts (replies don't have reply counts)
    const [users, likeCounts] = await Promise.all([
      Promise.all(userIds.map(id => User.getUserById(String(id)))),
      UserLike.getLikeCounts(replyUuids, LikeableType.COMMENT),
    ]);

    // Build user map
    const userMap = new Map<number, UserModel | null>();
    userIds.forEach((id, index) => userMap.set(id, users[index] ?? null));

    // Empty reply counts for replies (no nested replies)
    const emptyReplyCounts = new Map<string, number>();

    // Build responses
    return {
      targetUuid,
      targetType,
      comments: replies.map(reply =>
        buildComment(reply, userMap, likeCounts, emptyReplyCounts)
      ),
    };
  },
};

// Field-level resolvers for Comment type
export const CommentFieldResolvers = {
  Comment: {
    user: async (parent: any) => {
      // If user was already batch-fetched, return it
      if (parent.user !== undefined) {
        return parent.user;
      }
      // Fallback: fetch user by ID
      if (!parent.userId) {
        return null;
      }
      return User.getUserById(String(parent.userId));
    },
  },
};
