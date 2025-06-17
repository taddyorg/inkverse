import { type LoaderFunctionArgs } from "react-router";
import { getPublicApolloClient } from "@/lib/apollo/client.server";
import { type SearchQuery, Search, type SearchQueryVariables } from "@inkverse/shared-client/graphql/operations";
import { handleLoaderError } from "./error-handler";

export type SearchLoaderData = {
  search: SearchQuery['search'];
  comicseries: NonNullable<SearchQuery['search']>['comicSeries'];
};

function prettyTypeToInkverseType(type: string): string {
  switch (type) {
    case 'comics': 
      return 'COMICSERIES';
    default: 
      return type.toUpperCase();
  }
}

export async function loadSearch({ params, request, context }: LoaderFunctionArgs): Promise<SearchLoaderData> {
  const { term, types = "comics" } = params;

  if (!term) {
    throw new Response("Not Found", { status: 404 });
  }

  const client = getPublicApolloClient(request);

  const typesArray = types.split(',').map(type => prettyTypeToInkverseType(type.trim()));

  try {
    // Get creator data first
    const searchResult = await client.query<SearchQuery, SearchQueryVariables>({
      query: Search,
      variables: { term, filterForTypes: typesArray },
    });
    
    if (!searchResult.data?.search) {
      throw new Response("Not Found", { status: 404 });
    }

    // Return immediately with comic series, but defer user data
    return {
      search: searchResult.data.search,
      comicseries: searchResult.data.search.comicSeries,
    };
    
  } catch (error) {
    return handleLoaderError(error, 'Search');
  }
}