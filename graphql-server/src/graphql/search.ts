import type { GraphQLContext } from '../middleware/auth.js';
import { SEARCH_QUERY, taddyGraphqlRequest } from '@inkverse/shared-server/taddy/index';
import { ComicSeries } from '@inkverse/shared-server/models/index';

import type { QueryResolvers, QuerySearchArgs } from '@inkverse/shared-server/graphql/types';
import { arrayToObject } from '@inkverse/public/utils';
import type { ComicSeriesModel } from '@inkverse/shared-server/database/types';

const SearchDefinitions = `
" A search result "
type SearchResults {
  " Identifier for the search query being sent "
  searchId: ID!
  
  " A list of ComicSeries items "
  comicSeries: [ComicSeries]
  
  " A list of Creator items "
  creators: [Creator]
}
`

const SearchQueriesDefinitions = `
" Search for a term "
search(
  term: String
  page: Int
  limitPerPage: Int
  filterForTypes: [String]
  filterForTags: [String]
  filterForGenres: [Genre]
): SearchResults
`

const SearchQueries: QueryResolvers = {
  async search(root: any, args: QuerySearchArgs, context: GraphQLContext) {
    const { term = '', page = 1, limitPerPage = 25, filterForTypes = ["COMICSERIES"], filterForTags = null, filterForGenres = null } = args;

    const variables = { term, page, limitPerPage, filterForTypes, filterForTags, filterForGenres };
    const query = SEARCH_QUERY;

    try {
      const data = await taddyGraphqlRequest(query, variables);
      return data?.search;
    } catch (e) {
      throw new Error(`Error in search query: ${e}`);
    }
  }
};

const SearchResolvers = {
  SearchResults: {
    async comicSeries({ comicSeries }: any, _: any, context: GraphQLContext): Promise<ComicSeriesModel[]> {
      const uuids = comicSeries.map((series: any) => series.uuid);
      const data = await ComicSeries.getComicSeriesByUuids(uuids);
      const dataByUuid = arrayToObject(data, 'uuid');

      return uuids.map((uuid: string) => dataByUuid[uuid]).filter(Boolean);
    }
  }
};

export {
  SearchDefinitions,
  SearchQueriesDefinitions,
  SearchQueries,
  SearchResolvers,
};