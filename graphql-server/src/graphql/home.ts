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
`

const HomeScreenQueries: QueryResolvers = {
  async getRecentlyAddedComicSeries(root: any, { page = 1, limitPerPage = 10 }, context: GraphQLContext) : Promise<{ id: string; comicSeries: ComicSeriesModel[] | null }> {
    if (!isNumber(page) || page < 1 || page > 8) { throw new UserInputError('page must be between 1 and 20') }
    if (!isNumber(limitPerPage) || limitPerPage < 1 || limitPerPage > 25) { throw new UserInputError('limitPerPage must be between 1 and 20') }

    const comicSeries = await ComicSeries.getRecentlyAddedComicSeries(page, limitPerPage);
    return {
      id: 'recently-added',
      comicSeries,
    };
  },

  async getRecentlyUpdatedComicSeries(root: any, { page = 1, limitPerPage = 10 }, context: GraphQLContext): Promise<{ id: string; comicSeries: ComicSeriesModel[] | null }> {
    if (!isNumber(page) || page < 1 || page > 8) { throw new UserInputError('page must be between 1 and 20') }
    if (!isNumber(limitPerPage) || limitPerPage < 1 || limitPerPage > 25) { throw new UserInputError('limitPerPage must be between 1 and 20') }

    const comicSeries = await ComicSeries.getRecentlyUpdatedComicSeries(page, limitPerPage);
    return {
      id: 'recently-updated',
      comicSeries,
    };
  },

  async getMostPopularComicSeries(root: any, { page = 1, limitPerPage = 10 }, context: GraphQLContext): Promise<{ id: string; comicSeries: ComicSeriesModel[] | null }> {
    if (!isNumber(page) || page < 1 || page > 8) { throw new UserInputError('page must be between 1 and 20') }
    if (!isNumber(limitPerPage) || limitPerPage < 1 || limitPerPage > 25) { throw new UserInputError('limitPerPage must be between 1 and 20') }
    
    const comicSeries = await ComicSeries.getComicSeriesByUuids(mostPopularComicSeriesUuids);

    const shuffledComicSeries = shuffle(comicSeries);

    return {
      id: 'most-popular',
      comicSeries: shuffledComicSeries,
    };
  },

  async getFeaturedComicSeries(root: any, { page = 1, limitPerPage = 10 }, context: GraphQLContext): Promise<{ id: string; comicSeries: ComicSeriesModel[] | null }> {
    if (!isNumber(page) || page < 1 || page > 8) { throw new UserInputError('page must be between 1 and 20') }
    if (!isNumber(limitPerPage) || limitPerPage < 1 || limitPerPage > 100) { throw new UserInputError('limitPerPage must be between 1 and 100') }

    const comicSeries = await ComicSeries.getComicSeriesByUuids(featuredComicSeriesUuids);

    return {
      id: 'featured-comics',
      comicSeries,
    };
  },

  async getCuratedLists(root: any, { page = 1, limitPerPage = 10 }, context: GraphQLContext): Promise<{ id: string; lists: ListModel[] | null }> {
    if (!isNumber(page) || page < 1 || page > 8) { throw new UserInputError('page must be between 1 and 20') }
    if (!isNumber(limitPerPage) || limitPerPage < 1 || limitPerPage > 25) { throw new UserInputError('limitPerPage must be between 1 and 20') }

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