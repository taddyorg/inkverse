import type { ApolloClient, ApolloQueryResult, NormalizedCacheObject } from '@apollo/client';
import { asyncAction, ActionTypes, errorHandlerFactory, type Dispatch, type Action } from './utils.js';
import { type GetComicIssueQuery, type GetComicIssueQueryVariables, SortOrder, GetComicIssue, type ComicIssue, type ComicSeries, GetMiniComicSeries, type GetMiniComicSeriesQuery, type GetMiniComicSeriesQueryVariables } from "../graphql/operations.js";

/* Actions */
export const GET_COMICISSUE = asyncAction(ActionTypes.GET_COMICISSUE);

/* Action Creators */
interface GetComicIssueProps {
  publicClient: ApolloClient<NormalizedCacheObject>;
  issueUuid: string;
  seriesUuid: string;
  forceRefresh?: boolean;
}

/* Action Creators */
interface WrappedGetComicIssueProps {
  publicClient: ApolloClient<NormalizedCacheObject>;
  shortUrl: string;
  episodeId: string;
}

export async function loadComicIssueUrl({ publicClient, shortUrl, episodeId }: WrappedGetComicIssueProps, dispatch: Dispatch) {
  dispatch(GET_COMICISSUE.request());

  try {
    // First get the comic series uuid from the shortUrl
    const getComicSeriesUuid: ApolloQueryResult<GetMiniComicSeriesQuery> = await publicClient.query<GetMiniComicSeriesQuery, GetMiniComicSeriesQueryVariables>({
      query: GetMiniComicSeries,
      variables: { shortUrl },
    });

    if (!getComicSeriesUuid.data?.getComicSeries?.uuid) {
      throw new Response("Not Found", { status: 404 });
    }

    const safeIssueUuid = episodeId.replace(/^\//, '')
        .split('?')[0]
        ?.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)?.[0];

    if (!safeIssueUuid) {
      throw new Response("Not Found", { status: 404 });
    }

    // Get comic issue data
    const comicIssueResult = await publicClient.query<GetComicIssueQuery, GetComicIssueQueryVariables>({
      query: GetComicIssue,
      variables: { issueUuid: safeIssueUuid, seriesUuid: getComicSeriesUuid.data?.getComicSeries.uuid, sortOrderForIssues: SortOrder.OLDEST, limitPerPageForIssues: 1000, pageForIssues: 1 },
    });

    if (!comicIssueResult.data?.getComicIssue) {
      throw new Response("Not Found", { status: 404 });
    }

    const parsedData = parseLoaderComicIssue(comicIssueResult.data);

    dispatch(GET_COMICISSUE.success(parsedData));
  } catch (error: Error | unknown) {
    errorHandlerFactory(dispatch, GET_COMICISSUE)(error);
  }
}

export async function loadComicIssue({ publicClient, issueUuid, seriesUuid, forceRefresh = false }: GetComicIssueProps, dispatch: Dispatch) {
  dispatch(GET_COMICISSUE.request());

  try {
    const comicIssueResult = await publicClient.query<GetComicIssueQuery, GetComicIssueQueryVariables>({
      query: GetComicIssue,
      variables: { 
        issueUuid,
        seriesUuid,
        sortOrderForIssues: SortOrder.OLDEST,
        limitPerPageForIssues: 1000,
        pageForIssues: 1
      },
      ...(!!forceRefresh && { fetchPolicy: 'network-only' })
    });

    if (!comicIssueResult.data?.getComicIssue) {
      throw new Error("Comic issue data not found");
    }

    const parsedData = parseLoaderComicIssue(comicIssueResult.data);

    dispatch(GET_COMICISSUE.success(parsedData));
  } catch (error: Error | unknown) {
    errorHandlerFactory(dispatch, GET_COMICISSUE)(error);
  }
}

export function parseLoaderComicIssue(data: GetComicIssueQuery): ComicIssueLoaderData {
  return {
    isComicIssueLoading: false,
    comicissue: data.getComicIssue || null,
    comicseries: data.getComicSeries || null,
    allIssues: data.getIssuesForComicSeries?.issues?.filter(
      (issue: ComicIssue | null): issue is ComicIssue => issue !== null
    ) || [],
  };
}

export type ComicIssueLoaderData = {
  isComicIssueLoading: boolean;
  comicissue: ComicIssue | null;
  comicseries: ComicSeries | null;
  allIssues: ComicIssue[];
  apolloState?: Record<string, any>;
};

export const comicIssueInitialState: ComicIssueLoaderData = {
  isComicIssueLoading: false,
  comicissue: null,
  comicseries: null,
  allIssues: [],
}

/* Reducers */
export function comicIssueQueryReducerDefault(state = comicIssueInitialState, action: Action): ComicIssueLoaderData {
  switch (action.type) {
    case GET_COMICISSUE.REQUEST:
      return {
        ...state,
        isComicIssueLoading: true,
      };
    case GET_COMICISSUE.SUCCESS:
      return {
        ...state,
        ...action.payload,
        isComicIssueLoading: false,
      };
    default:
      return state;
  }
}

export const comicIssueQueryReducer = (state: ComicIssueLoaderData, action: Action) => comicIssueQueryReducerDefault(state, action); 