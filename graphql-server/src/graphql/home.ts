import { isNumber, shuffle } from 'lodash-es';

import { UserInputError } from './error.js';
import type { GraphQLContext } from '../middleware/auth.js';
import { curatedListsData, featuredComicSeriesUuids, mostPopularComicSeriesUuids } from '@inkverse/shared-server/utils/hardcoded';
import type { ListModel } from '@inkverse/shared-server/database/types';

import type {
  QueryResolvers,
} from '@inkverse/shared-server/graphql/types';

import type { ComicSeriesModel } from '@inkverse/shared-server/database/types';
import { ComicSeries } from '@inkverse/shared-server/models/index';
import { UserLike } from '@inkverse/shared-server/models/user_like';
import { UserComment } from '@inkverse/shared-server/models/user_comment';

function getSinceEpochForPeriod(period: string): number {
  const now = Math.floor(Date.now() / 1000);
  switch (period) {
    case 'MONTH':
      return now - 90 * 24 * 60 * 60;
    case 'YEAR':
      return now - 365 * 24 * 60 * 60;
    case 'WEEK':
    default:
      return now - 14 * 24 * 60 * 60;
  }
}

const HomeScreenDefinitions = `
type HomeScreenComicSeries {
  " Id of the home screen comic series "
  id: ID

  " List of comic series "
  comicSeries: [ComicSeries]
}

type HomeScreenCuratedList {
  " Id of the home screen curated list "
  id: ID

  " List of curated lists "
  lists: [List]
}

enum TrendingMetric {
  LIKED
  DISCUSSED
}

enum TrendingPeriod {
  WEEK
  MONTH
  YEAR
}
`

const HomeScreenQueriesDefinitions = `
" Get a list of recently added comics "
getRecentlyAddedComicSeries(
  " (Optional) Default is 1, Max value allowed is 20 "
  page: Int,

  " (Optional) Return up to this number of comics. Default is 10, Max value allowed is 20 results per page "
  limitPerPage: Int,
): HomeScreenComicSeries

" Get a list of recently updated comics "
getRecentlyUpdatedComicSeries(
  " (Optional) Default is 1, Max value allowed is 20 "
  page: Int,

  " (Optional) Return up to this number of comics. Default is 10, Max value allowed is 20 results per page "
  limitPerPage: Int,
): HomeScreenComicSeries

" Get a list of most popular comics "
getMostPopularComicSeries(
  " (Optional) Default is 1, Max value allowed is 20 "
  page: Int,

  " (Optional) Return up to this number of comics. Default is 10, Max value allowed is 20 results per page "
  limitPerPage: Int,
): HomeScreenComicSeries

" Get a list of featured comics "
getFeaturedComicSeries(
  " (Optional) Default is 1, Max value allowed is 20 "
  page: Int,

  " (Optional) Return up to this number of comics. Default is 10, Max value allowed is 20 results per page "
  limitPerPage: Int,
): HomeScreenComicSeries

" Get a list of curated lists "
getCuratedLists(
  " (Optional) Default is 1, Max value allowed is 20 "
  page: Int,

  " (Optional) Return up to this number of comics. Default is 10, Max value allowed is 20 results per page "
  limitPerPage: Int,
): HomeScreenCuratedList

" Get trending comic series by metric and time period "
getTrendingComicSeries(
  " The metric to sort by (LIKED or DISCUSSED). Default is LIKED "
  metric: TrendingMetric,

  " The time period to look at (WEEK, MONTH, or YEAR). Default is WEEK "
  period: TrendingPeriod,

  " (Optional) Return up to this number of comics. Default is 6 "
  limitPerPage: Int,

  " (Optional) Default is 1, Max value allowed is 8 "
  page: Int,
): HomeScreenComicSeries
`

const HomeScreenQueries: QueryResolvers = {
  async getRecentlyAddedComicSeries(root: any, { page = 1, limitPerPage = 10 }, context: GraphQLContext) : Promise<{ id: string; comicSeries: ComicSeriesModel[] | null }> {
    if (!isNumber(page) || page < 1 || page > 8) { throw new UserInputError('page must be between 1 and 8') }
    if (!isNumber(limitPerPage) || limitPerPage < 1 || limitPerPage > 25) { throw new UserInputError('limitPerPage must be between 1 and 25') }

    const comicSeries = await ComicSeries.getRecentlyAddedComicSeries(page, limitPerPage);
    return {
      id: 'recently-added',
      comicSeries,
    };
  },

  async getRecentlyUpdatedComicSeries(root: any, { page = 1, limitPerPage = 10 }, context: GraphQLContext): Promise<{ id: string; comicSeries: ComicSeriesModel[] | null }> {
    if (!isNumber(page) || page < 1 || page > 8) { throw new UserInputError('page must be between 1 and 8') }
    if (!isNumber(limitPerPage) || limitPerPage < 1 || limitPerPage > 25) { throw new UserInputError('limitPerPage must be between 1 and 25') }

    const comicSeries = await ComicSeries.getRecentlyUpdatedComicSeries(page, limitPerPage);
    return {
      id: 'recently-updated',
      comicSeries,
    };
  },

  async getMostPopularComicSeries(root: any, { page = 1, limitPerPage = 10 }, context: GraphQLContext): Promise<{ id: string; comicSeries: ComicSeriesModel[] | null }> {
    if (!isNumber(page) || page < 1 || page > 8) { throw new UserInputError('page must be between 1 and 8') }
    if (!isNumber(limitPerPage) || limitPerPage < 1 || limitPerPage > 25) { throw new UserInputError('limitPerPage must be between 1 and 25') }

    const comicSeries = await ComicSeries.getComicSeriesByUuids(mostPopularComicSeriesUuids);

    const shuffledComicSeries = shuffle(comicSeries);

    return {
      id: 'most-popular',
      comicSeries: shuffledComicSeries,
    };
  },

  async getFeaturedComicSeries(root: any, { page = 1, limitPerPage = 10 }, context: GraphQLContext): Promise<{ id: string; comicSeries: ComicSeriesModel[] | null }> {
    if (!isNumber(page) || page < 1 || page > 8) { throw new UserInputError('page must be between 1 and 8') }
    if (!isNumber(limitPerPage) || limitPerPage < 1 || limitPerPage > 25) { throw new UserInputError('limitPerPage must be between 1 and 25') }

    const comicSeries = await ComicSeries.getComicSeriesByUuids(featuredComicSeriesUuids);

    return {
      id: 'featured-comics',
      comicSeries,
    };
  },

  async getTrendingComicSeries(root: any, args: any, context: GraphQLContext): Promise<{ id: string; comicSeries: ComicSeriesModel[] | null }> {
    const metric = args.metric || 'LIKED';
    const period = args.period || 'WEEK';
    const limitPerPage = args.limitPerPage ?? 6;
    const page = args.page ?? 1;

    if (!isNumber(limitPerPage) || limitPerPage < 1 || limitPerPage > 25) { throw new UserInputError('limitPerPage must be between 1 and 25') }
    if (!isNumber(page) || page < 1 || page > 8) { throw new UserInputError('page must be between 1 and 8') }

    const sinceEpoch = getSinceEpochForPeriod(period);
    const offset = (page - 1) * limitPerPage;

    const ranked = metric === 'DISCUSSED'
      ? await UserComment.getTopSeriesByCommentCount(sinceEpoch, limitPerPage, offset)
      : await UserLike.getTopSeriesByLikeCount(sinceEpoch, limitPerPage, offset);

    if (ranked.length === 0) {
      return { id: `trending-${metric}-${period}`, comicSeries: [] };
    }

    const uuids = ranked.map(r => r.parentUuid);
    const seriesList = await ComicSeries.getComicSeriesByUuids(uuids);

    // Preserve ranking order and filter blocked series
    const seriesMap = new Map(seriesList.map(s => [s.uuid, s]));
    const orderedSeries = uuids
      .map(uuid => seriesMap.get(uuid))
      .filter((s): s is ComicSeriesModel => s != null && !s.isBlocked);

    return {
      id: `trending-${metric}-${period}`,
      comicSeries: orderedSeries,
    };
  },

  async getCuratedLists(root: any, { page = 1, limitPerPage = 10 }, context: GraphQLContext): Promise<{ id: string; lists: ListModel[] | null }> {
    if (!isNumber(page) || page < 1 || page > 8) { throw new UserInputError('page must be between 1 and 8') }
    if (!isNumber(limitPerPage) || limitPerPage < 1 || limitPerPage > 25) { throw new UserInputError('limitPerPage must be between 1 and 25') }

    const curatedLists = [curatedListsData["4"], curatedListsData["2"], curatedListsData["3"], curatedListsData["8"], curatedListsData["10"], curatedListsData["5"], curatedListsData["6"], curatedListsData["9"], curatedListsData["7"] ].filter((list): list is ListModel => list !== undefined);
    const shuffledCuratedLists = shuffle(curatedLists);

    return {
      id: 'curated-lists',
      lists: shuffledCuratedLists,
    };
  }
};

export {
  HomeScreenDefinitions,
  HomeScreenQueriesDefinitions,
  HomeScreenQueries,
}