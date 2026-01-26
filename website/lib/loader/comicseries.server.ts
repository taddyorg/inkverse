import { type LoaderFunctionArgs } from "react-router";
import { getPublicApolloClient } from "@/lib/apollo/client.server";
import { type GetComicSeriesQuery, type GetComicSeriesQueryVariables, GetComicSeries, type GetMiniComicSeriesQuery, type GetMiniComicSeriesQueryVariables, GetMiniComicSeries, SortOrder } from "@inkverse/shared-client/graphql/operations";
import { handleLoaderError } from "./error-handler";
import { parseLoaderComicSeries, type ComicSeriesLoaderData } from "@inkverse/shared-client/dispatch/comicseries";

export async function loadComicSeries({ params, request, context }: LoaderFunctionArgs): Promise<Partial<ComicSeriesLoaderData>> {
  const { shortUrl } = params;

  const client = getPublicApolloClient(request);

  try {
    // Get comic series data first
    const getComicSeriesUuid = await client.query<GetMiniComicSeriesQuery, GetMiniComicSeriesQueryVariables>({
      query: GetMiniComicSeries,
      variables: { shortUrl },
    });

    if (!getComicSeriesUuid.data?.getComicSeries?.uuid) {
      return {
        isComicSeriesLoading: false,
        comicseries: null,
        issues: [],
      };
    }

    // Get comic series data first
    const comicSeriesResult = await client.query<GetComicSeriesQuery, GetComicSeriesQueryVariables>({
      query: GetComicSeries,
      variables: { 
        uuid: getComicSeriesUuid.data?.getComicSeries.uuid, 
        sortOrderForIssues: SortOrder.OLDEST, 
        limitPerPageForIssues: 1000, 
        pageForIssues: 1 
      },
    });

    if (!comicSeriesResult.data?.getComicSeries) {
      throw new Response("Not Found", { status: 404 });
    }

    const parsedData = parseLoaderComicSeries(comicSeriesResult.data);

    if (!parsedData.comicseries) {
      throw new Response("Not Found", { status: 404 });
    }

    return parsedData;
    
  } catch (error) {
    handleLoaderError(error, 'Comic Series');
  }
}