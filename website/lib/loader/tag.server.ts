import { type LoaderFunctionArgs } from "react-router";
import { getPublicApolloClient } from "@/lib/apollo/client.server";
import { handleLoaderError } from "./error-handler";
import { parseComicsListResults, getComicsListFilters, COMICS_LIST_LIMIT_PER_PAGE, type ComicsListPageType } from "@inkverse/shared-client/dispatch/comicslist";
import { type ComicSeries, Search, type SearchQuery, type SearchQueryVariables } from "@inkverse/shared-client/graphql/operations";

export type ComicsListLoaderData = {
  comicseries: ComicSeries[];
  hasMore: boolean;
  totalCount: number;
  pageType: ComicsListPageType;
  value: string;
};

export async function loadComicsList({ params, request, context }: LoaderFunctionArgs): Promise<ComicsListLoaderData> {
  const pageType = params.pageType as ComicsListPageType;
  const value = params.value as string;

  const client = getPublicApolloClient(request);

  try {

    const searchResult = await client.query<SearchQuery, SearchQueryVariables>({
      query: Search,
      variables: {
        term: '',
        page: 1,
        limitPerPage: COMICS_LIST_LIMIT_PER_PAGE,
        filterForTypes: ["COMICSERIES"],
        ...getComicsListFilters(pageType, value),
      },
    });

    if (!searchResult.data?.search) {
      throw new Error("Search data not found");
    }

    const parsedData = parseComicsListResults(searchResult.data, 1);

    return {
      comicseries: parsedData.comics,
      hasMore: parsedData.hasMore,
      totalCount: parsedData.totalCount,
      pageType,
      value,
    };

  } catch (error) {
    handleLoaderError(error, 'Comics List');
    return { comicseries: [], hasMore: false, totalCount: 0, pageType, value };
  }
}
