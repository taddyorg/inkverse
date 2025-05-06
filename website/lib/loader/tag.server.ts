import { type LoaderFunctionArgs } from "react-router";
import { getApolloClient } from "@/lib/apollo/client.server";
import { handleLoaderError } from "./error-handler";
import { Genre, type ComicSeries } from "@inkverse/shared-client/graphql/types";
import { parseComicsListResults } from "@inkverse/shared-client/dispatch/comicslist";
import { Search, type SearchQuery, type SearchQueryVariables } from "@inkverse/shared-client/graphql/operations";

export type ComicsListPageType = 'tag' | 'genre';

export type ComicsListLoaderData = {
  comicseries: ComicSeries[];
  apolloState: Record<string, any>;
};

const LIMIT_PER_PAGE = 12;
export async function loadComicsList({ params, request, context }: LoaderFunctionArgs): Promise<ComicsListLoaderData> {
  const { pageType, value } = params;
  
  const client = getApolloClient(request);
  
  const filterParams: {
    filterForTags?: string[];
    filterForGenres?: Genre[];
  } = {};
  
  // Add specific filters based on page type
  if (pageType === 'tag') {
    // Replace all spaces in the tag value with empty string
    const formattedValue = (value as string).replace(/\s+/g, '');
    filterParams.filterForTags = [value as string, formattedValue];
  } else if (pageType === 'genre') {
    filterParams.filterForGenres = [value as Genre];
  }
  
  try {

    const searchResult = await client.query<SearchQuery, SearchQueryVariables>({
      query: Search,
      variables: {
        term: '',
        page: 1,
        limitPerPage: LIMIT_PER_PAGE,
        filterForTypes: ["COMICSERIES"],
        filterForTags: filterParams.filterForTags,
        filterForGenres: filterParams.filterForGenres
      },
    });

    if (!searchResult.data?.search) {
      throw new Error("Search data not found");
    }

    const parsedData = parseComicsListResults(searchResult.data, LIMIT_PER_PAGE);

    const state = client.extract();

    return {
      comicseries: parsedData.comics,
      apolloState: state,
    };

  } catch (error) {
    return handleLoaderError(error, 'Comics List');
  }
}