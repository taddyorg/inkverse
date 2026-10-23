import type { GraphQLContext } from '../middleware/auth.js';
import { SEARCH_QUERY, taddyGraphqlRequest } from '@inkverse/shared-server/taddy/index';
import { ComicSeries } from '@inkverse/shared-server/models/index';

import type { QueryResolvers, QuerySearchArgs } from '@inkverse/shared-server/graphql/types';
import { arrayToObject } from '@inkverse/public/utils';
import { MAX_SEARCH_PAGE, MAX_SEARCH_LIMIT_PER_PAGE, MAX_SEARCH_TERM_WORDS } from '@inkverse/public/search';
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

  " Totals for the search results, one entry per content type "
  responseDetails: [SearchResponseDetails]
}

" Totals for a search query, for one content type "
type SearchResponseDetails {
  " Identifier for the search query and content type "
  id: ID!

  " The type of item being returned in the search results "
  type: String

  " Total number of search results for this type "
  totalCount: Int

  " Total number of pages of search results for this type "
  pagesCount: Int
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
    const { filterForTypes = ["COMICSERIES"], filterForTags = null, filterForGenres = null } = args;

    // Taddy rejects terms with more than 8 words, so search the first 8
    const term = (args.term ?? '').trim().split(/\s+/).slice(0, MAX_SEARCH_TERM_WORDS).join(' ');

    // Keep page and limitPerPage within what Taddy search accepts
    const page = Math.max(args.page ?? 1, 1);
    const limitPerPage = Math.min(Math.max(args.limitPerPage ?? MAX_SEARCH_LIMIT_PER_PAGE, 1), MAX_SEARCH_LIMIT_PER_PAGE);

    // Taddy returns an error past its last page, so return an empty page instead
    if (page > MAX_SEARCH_PAGE) {
      return { searchId: `${term}-${page}-past-max-page`, comicSeries: [], creators: [], responseDetails: [] };
    }

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