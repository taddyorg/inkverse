import { isNumber } from 'lodash-es';

import { validateAndTrimUuid, UserInputError } from './error.js';
import type { GraphQLContext } from '../middleware/auth.js';

import type { 
  QueryResolvers, 
  ComicIssueResolvers,
} from '@inkverse/shared-server/graphql/types';
import { SortOrder } from '@inkverse/shared-server/graphql/types';

import type { ComicIssueModel } from '@inkverse/shared-server/database/types';
import { ComicIssue, ComicStory, ComicSeries } from '@inkverse/shared-server/models/index';

const ComicIssueDefinitions = `
" Comic Issue Details "
type ComicIssue {
  " Unique identifier for a comic issue "
  uuid: ID!

  " Unique identifier for a comic series this issue belongs to "
  seriesUuid: ID!
  
  " Date when the issue was published (Epoch time in seconds) "
  datePublished: Int
  
  " The name (title) of the issue "
  name: String
  
  " Short note from the creator for the issue "
  creatorNote: String
  
  " A different hash means that details for this issue have updated since the last hash "
  hash: String
  
  " A different hash means that details for the stories that make up this issue have updated since the last hash "
  storiesHash: String

  " Stringified JSON details for the banner art. Convert to JSON to use."
  bannerImageAsString: String
  
  " Stringified JSON details for the thumbnail art. Convert to JSON to use."
  thumbnailImageAsString: String
  
  " Details on all the stories that make up this issue "
  stories: [ComicStory]

  " Preview of the first 5 story image urls "
  previewStoryImageUrls: [String]

  " Position of the issue in the series "
  position: Int
  
  " If the issue has now been removed from the SSS Feed "
  isRemoved: Boolean
  
  " If the content has violated Taddy's distribution policies for illegal or harmful content it will be blocked from getting any updates "
  isBlocked: Boolean

  " Details on the comic for which this issue belongs to "
  comicSeries: ComicSeries

  " Previous issue in the series "
  previousIssue: ComicIssue

  " Next issue in the series "
  nextIssue: ComicIssue

  " The scopes for the exclusive content - e.g. 'patreon' "
  scopesForExclusiveContent: [String]

  " The date when the issue (exclusive content) becomes available through the scope (epoch time in seconds)"
  dateExclusiveContentAvailable: Int
}

type ComicIssueForSeries {
  " Series uuid "
  seriesUuid: ID!

  " The issues "
  issues: [ComicIssue]
}
`

const ComicIssueQueriesDefinitions = `
  " Get details on a comic issue"
  getComicIssue(
    " Unique identifier for a comic issue "
    uuid: ID!,

    " Unique identifier for a comic series this issue belongs to "
    seriesUuid: ID!,
  ):ComicIssue

  " Get multiple issues for a comic series "
  getIssuesForComicSeries(
    " Unique identifier for a comic series "
    seriesUuid: ID!,

    " The order of the issues to return "
    sortOrder: SortOrder,

    " The number of issues to return per page "
    limitPerPage: Int,

    " The page number to return "
    page: Int,

    " If the removed issues should be included "
    includeRemovedIssues: Boolean,
  ):ComicIssueForSeries
`

const ComicIssueQueries: QueryResolvers = {
  async getComicIssue(root, { uuid }, context: GraphQLContext): Promise<ComicIssueModel | null> {
    if (uuid) {
      const trimmedUuid = validateAndTrimUuid(uuid);
      return await ComicIssue.getComicIssueByUuid(trimmedUuid);
    } else {
      return null;
    }
  },

  async getIssuesForComicSeries(root, { seriesUuid, sortOrder, limitPerPage = 10, page = 1, includeRemovedIssues = false }, context: GraphQLContext): Promise<{ seriesUuid: string; issues: ComicIssueModel[] | null }> {
    if (!isNumber(page) || page < 1 || page > 1000) { throw new UserInputError('page must be between 1 and 1000') }
    if (!isNumber(limitPerPage) || limitPerPage < 1 || limitPerPage > 1000) { throw new UserInputError('limitPerPage must be between 1 and 1000') }

    const trimmedSeriesUuid = validateAndTrimUuid(seriesUuid, 'seriesUuid');
    const offset = (page - 1) * limitPerPage;
    const safeSortOrder = sortOrder ?? SortOrder.LATEST;
    const safeIncludeRemovedIssues = includeRemovedIssues ?? false;

    const issues = await ComicIssue.getComicIssuesForSeries(
      trimmedSeriesUuid,
      safeSortOrder,
      limitPerPage,
      offset,
      safeIncludeRemovedIssues,
    );

    return {
      seriesUuid: trimmedSeriesUuid,
      issues,
    };
  },
}

const ComicIssueFieldResolvers: ComicIssueResolvers = {
  ComicIssue: {
    bannerImageAsString({ bannerImage }: ComicIssueModel, input:{}, context: GraphQLContext) {
      return bannerImage ? JSON.stringify(bannerImage) : null;
    },

    thumbnailImageAsString({ thumbnailImage }: ComicIssueModel, input:{}, context: GraphQLContext) {
      return thumbnailImage ? JSON.stringify(thumbnailImage) : null;
    },

    async stories({ uuid }: ComicIssueModel, input:{}, context: GraphQLContext) {
      return await ComicStory.getComicStoriesForIssue(uuid);
    },

    async previewStoryImageUrls({ uuid }: ComicIssueModel, input:{}, context: GraphQLContext) {
      const comicstories = await ComicStory.getComicStoriesForIssue(uuid);
      return comicstories.map(story => story.storyImage?.base_url && story.storyImage?.story ? `${story.storyImage.base_url}${story.storyImage.story}` : null).filter(Boolean).slice(0, 5);
    },

    async comicSeries({ seriesUuid }: ComicIssueModel, input:{}, context: GraphQLContext) {
      const trimmedSeriesUuid = validateAndTrimUuid(seriesUuid, 'seriesUuid');
      return await ComicSeries.getComicSeriesByUuid(trimmedSeriesUuid);
    },

    async previousIssue({ seriesUuid, position }: ComicIssueModel, input:{}, context: GraphQLContext) {
      const trimmedSeriesUuid = validateAndTrimUuid(seriesUuid, 'seriesUuid');
      if (!isNumber(position)) { return null }
      if (position === 0) { return null } // The first issue has no previous issue
      return await ComicIssue.getComicIssueForSeriesByPosition(trimmedSeriesUuid, position - 1);
    },

    async nextIssue({ seriesUuid, position }: ComicIssueModel, input:{}, context: GraphQLContext) {
      const trimmedSeriesUuid = validateAndTrimUuid(seriesUuid, 'seriesUuid');
      if (!isNumber(position)) { return null }
      return await ComicIssue.getComicIssueForSeriesByPosition(trimmedSeriesUuid, position + 1);
    },
  }
}

export {
  ComicIssueDefinitions,
  ComicIssueQueriesDefinitions,
  ComicIssueQueries,
  ComicIssueFieldResolvers,
}
