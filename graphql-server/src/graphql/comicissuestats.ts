import { UserLike } from '@inkverse/shared-server/models/index';
import { LikeableType, ParentType } from '@inkverse/shared-server/database/types';
import type { QueryResolvers } from '@inkverse/shared-server/graphql/types';

// GraphQL Type Definitions
export const ComicIssueStatsDefinitions = `
  """
  Public stats for a comic issue (like count, future: comment count)
  """
  type ComicIssueStats {
    seriesUuid: ID!
    issueUuid: ID!
    likeCount: Int
  }
`;

// Query Definitions
export const ComicIssueStatsQueriesDefinitions = `
  """
  Get stats (like count) for a single episode
  """
  getStatsForComicIssue(issueUuid: ID!, seriesUuid: ID!): ComicIssueStats

  """
  Get stats (like counts) for all episodes in a series
  """
  getStatsForComicSeries(seriesUuid: ID!): [ComicIssueStats!]
`;

// Resolvers
export const ComicIssueStatsQueries: QueryResolvers = {
  getStatsForComicIssue: async (
    _parent: any,
    { issueUuid, seriesUuid }: { issueUuid: string; seriesUuid: string },
    _context: any
  ) => {
    // Get like count for a single episode
    const likeCount = await UserLike.getLikeCount(
      issueUuid,
      LikeableType.COMICISSUE
    );

    return {
      seriesUuid,
      issueUuid,
      likeCount,
    };
  },

  getStatsForComicSeries: async (
    _parent: any,
    { seriesUuid }: { seriesUuid: string },
    _context: any
  ) => {
    // Get like counts for all episodes in the series
    const likeCounts = await UserLike.getLikeCountsForParent(
      seriesUuid,
      ParentType.COMICSERIES,
      LikeableType.COMICISSUE
    );

    // Convert Map to array of ComicIssueStats
    const stats = Array.from(likeCounts.entries()).map(([issueUuid, likeCount]) => ({
      seriesUuid,
      issueUuid,
      likeCount,
    }));

    return stats;
  },
};
