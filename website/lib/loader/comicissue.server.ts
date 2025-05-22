import { type LoaderFunctionArgs } from "react-router";
import { getPublicApolloClient } from "@/lib/apollo/client.server";
import { type GetMiniComicSeriesQuery, type GetMiniComicSeriesQueryVariables, GetMiniComicSeries, SortOrder, type GetComicIssueQuery, type GetComicIssueQueryVariables, GetComicIssue } from "@inkverse/shared-client/graphql/operations";
import { handleLoaderError } from "./error-handler";
import type { ApolloQueryResult } from "@apollo/client";

export type ComicIssueLoaderData = {
  comicissue: GetComicIssueQuery['getComicIssue'];
  comicseries: GetComicIssueQuery['getComicSeries'];
  allIssues: GetComicIssueQuery['getIssuesForComicSeries'];
  apolloState: Record<string, any>;
};

export async function loadComicIssue({ params, request, context }: LoaderFunctionArgs): Promise<ComicIssueLoaderData> {
  const { shortUrl, episodeId } = params;

  const client = getPublicApolloClient(request);

  try {

    if (!episodeId) {
      throw new Response("Not Found", { status: 404 });
    }
  
    // Get comic series data first
    const getComicSeriesUuid: ApolloQueryResult<GetMiniComicSeriesQuery> = await client.query<GetMiniComicSeriesQuery, GetMiniComicSeriesQueryVariables>({
      query: GetMiniComicSeries,
      variables: { shortUrl },
    });

    if (!getComicSeriesUuid.data?.getComicSeries?.uuid) {
      throw new Response("Not Found", { status: 404 });
    }

    const safeIssueUuid = episodeId.replace(/^\//, '')
        .split('?')[0]
        .match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)?.[0];

    if (!safeIssueUuid) {
      throw new Response("Not Found", { status: 404 });
    }

    // Get comic issue data
    const comicIssueResult = await client.query<GetComicIssueQuery, GetComicIssueQueryVariables>({
      query: GetComicIssue,
      variables: { issueUuid: safeIssueUuid, seriesUuid: getComicSeriesUuid.data?.getComicSeries.uuid, sortOrderForIssues: SortOrder.OLDEST, limitPerPageForIssues: 1000, pageForIssues: 1 },
    });

    if (!comicIssueResult.data?.getComicIssue) {
      throw new Response("Not Found", { status: 404 });
    }

    const state = client.extract();

    // Return immediately with comic series, but defer user data
    return {
      comicissue: comicIssueResult.data.getComicIssue,
      comicseries: comicIssueResult.data.getComicSeries,
      allIssues: comicIssueResult.data.getIssuesForComicSeries,
      apolloState: state,
    };
    
  } catch (error) {
    handleLoaderError(error, 'Comic Issue');
  }
}