import { UserLike, UserComment } from '@inkverse/shared-server/models/index';
import { InkverseType, type QueryResolvers } from '@inkverse/shared-server/graphql/types';

// GraphQL Type Definitions
export const ComicStatsDefinitions = `
  """
  Public stats for a comic issue (like count, comment count)
  """
  type ComicIssueStats {
    uuid: ID!
    likeCount: Int
    commentCount: Int
  }

  """
  Public stats for a comic series (total like count, total comment count)
  """
  type ComicSeriesStats {
    uuid: ID!
    likeCount: Int
    commentCount: Int
  }
`;

// Query Definitions
export const ComicStatsQueriesDefinitions = `
  """
  Get stats (like count, comment count) for a single episode
  """
  getStatsForComicIssue(issueUuid: ID!): ComicIssueStats

  """
  Get total stats (like count, comment count) for a series
  """
  getStatsForComicSeries(seriesUuid: ID!): ComicSeriesStats
`;

// Resolvers
export const ComicStatsQueries: QueryResolvers = {
  getStatsForComicIssue: async (
    _parent: any,
    { issueUuid }: { issueUuid: string },
    _context: any
  ) => {
    const [likeCount, commentCount] = await Promise.all([
      UserLike.getLikeCount(issueUuid, InkverseType.COMICISSUE),
      UserComment.getCommentCount(issueUuid, InkverseType.COMICISSUE),
    ]);

    return {
      uuid: issueUuid,
      likeCount,
      commentCount,
    };
  },

  getStatsForComicSeries: async (
    _parent: any,
    { seriesUuid }: { seriesUuid: string },
    _context: any
  ) => {
    const [likeCount, commentCount] = await Promise.all([
      UserLike.getLikeCountForParent(seriesUuid, InkverseType.COMICSERIES, InkverseType.COMICISSUE),
      UserComment.getCommentCountForParent(seriesUuid, InkverseType.COMICSERIES),
    ]);

    return {
      uuid: seriesUuid,
      likeCount,
      commentCount,
    };
  },
};
