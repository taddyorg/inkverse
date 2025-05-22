import { type LoaderFunctionArgs } from "react-router";
import { getPublicApolloClient } from "@/lib/apollo/client.server";
import { type GetComicSeriesQuery, type GetComicSeriesQueryVariables, GetComicSeries, type GetMiniComicSeriesQuery, type GetMiniComicSeriesQueryVariables, GetMiniComicSeries, SortOrder } from "@inkverse/shared-client/graphql/operations";
import { handleLoaderError } from "./error-handler";
import type { ApolloQueryResult } from "@apollo/client";
import { parseLoaderComicSeries, type ComicSeriesLoaderData } from "@inkverse/shared-client/dispatch/comicseries";

export async function loadComicSeries({ params, request, context }: LoaderFunctionArgs): Promise<ComicSeriesLoaderData> {
  const { shortUrl } = params;

  const client = getPublicApolloClient(request);

  try {
    // Get comic series data first
    const getComicSeriesUuid: ApolloQueryResult<GetMiniComicSeriesQuery> = await client.query<GetMiniComicSeriesQuery, GetMiniComicSeriesQueryVariables>({
      query: GetMiniComicSeries,
      variables: { shortUrl },
    });

    if (!getComicSeriesUuid.data?.getComicSeries?.uuid) {
      throw new Response("Not Found", { status: 404 });
    }

    // Get comic series data first
    const comicSeriesResult: ApolloQueryResult<GetComicSeriesQuery> = await client.query<GetComicSeriesQuery, GetComicSeriesQueryVariables>({
      query: GetComicSeries,
      variables: { 
        uuid: getComicSeriesUuid.data?.getComicSeries.uuid, 
        sortOrderForIssues: SortOrder.OLDEST, 
        limitPerPageForIssues: 1000, 
        pageForIssues: 1 
      },
    });

    const parsedData = parseLoaderComicSeries(comicSeriesResult.data);

    if (!parsedData.comicseries) {
      throw new Response("Not Found", { status: 404 });
    }

    const state = client.extract();

    // Return immediately with comic series, but defer user data
    return {
      ...parsedData,
      apolloState: state,
    };
    
  } catch (error) {
    handleLoaderError(error, 'Comic Series');
  }
}