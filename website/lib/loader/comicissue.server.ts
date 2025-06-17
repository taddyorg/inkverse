import { type LoaderFunctionArgs } from "react-router";
import { getPublicApolloClient } from "@/lib/apollo/client.server";
import { type GetMiniComicSeriesQuery, type GetMiniComicSeriesQueryVariables, GetMiniComicSeries, SortOrder, type GetComicIssueQuery, type GetComicIssueQueryVariables, GetComicIssue } from "@inkverse/shared-client/graphql/operations";
import { handleLoaderError } from "./error-handler";
import type { ApolloQueryResult } from "@apollo/client";
import type { ComicIssueLoaderData } from "@inkverse/shared-client/dispatch/comicissue";

export async function loadComicIssue({ params, request, context }: LoaderFunctionArgs): Promise<Partial<ComicIssueLoaderData>> {
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
      variables: { issueUuid: safeIssueUuid, seriesUuid: getComicSeriesUuid.data?.getComicSeries.uuid },
    });

    if (!comicIssueResult.data?.getComicIssue) {
      throw new Response("Not Found", { status: 404 });
    }

    const isPatreonExclusive = comicIssueResult.data.getComicIssue.scopesForExclusiveContent?.includes('patreon');

    // Return immediately with comic series, but defer user data
    return {
      comicissue: comicIssueResult.data.getComicIssue,
      comicseries: comicIssueResult.data.getComicSeries,
      creatorLinks: comicIssueResult.data.getCreatorLinksForSeries,
      isCheckingAccess: isPatreonExclusive,
    };
    
  } catch (error) {
    handleLoaderError(error, 'Comic Issue');
  }
}