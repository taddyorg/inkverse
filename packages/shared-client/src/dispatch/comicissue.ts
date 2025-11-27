import { ApolloClient } from '@apollo/client';
import type { Dispatch } from 'react';
import { type GetComicIssueQuery, type GetComicIssueQueryVariables, GetComicIssue, type ComicIssue, type ComicSeries, GetMiniComicSeries, type GetMiniComicSeriesQuery, type GetMiniComicSeriesQueryVariables, type CreatorLinkDetails } from "../graphql/operations.js";

/* Action Type Enum */
export enum ComicIssueActionType {
  GET_COMICISSUE_START = 'GET_COMICISSUE_START',
  GET_COMICISSUE_SUCCESS = 'GET_COMICISSUE_SUCCESS',
  GET_COMICISSUE_ERROR = 'GET_COMICISSUE_ERROR',
  
  // Patreon Access Actions
  CHECK_PATREON_ACCESS_START = 'CHECK_PATREON_ACCESS_START',
  CHECK_PATREON_ACCESS_SUCCESS = 'CHECK_PATREON_ACCESS_SUCCESS',
  CHECK_PATREON_ACCESS_NO_ACCESS = 'CHECK_PATREON_ACCESS_NO_ACCESS',
  CHECK_PATREON_ACCESS_ERROR = 'CHECK_PATREON_ACCESS_ERROR',
}

/* Action Types */
export type ComicIssueAction =
  // Comic Issue Loading
  | { type: ComicIssueActionType.GET_COMICISSUE_START }
  | { type: ComicIssueActionType.GET_COMICISSUE_SUCCESS; payload: Partial<ComicIssueLoaderData> }
  | { type: ComicIssueActionType.GET_COMICISSUE_ERROR; payload: string }
  
  // Patreon Access Actions
  | { type: ComicIssueActionType.CHECK_PATREON_ACCESS_START }
  | { 
      type: ComicIssueActionType.CHECK_PATREON_ACCESS_SUCCESS; 
      payload: { contentToken: string; hasConnectedPatreon: boolean } 
    }
  | { 
      type: ComicIssueActionType.CHECK_PATREON_ACCESS_NO_ACCESS; 
      payload: { hasConnectedPatreon: boolean } 
    }
  | { type: ComicIssueActionType.CHECK_PATREON_ACCESS_ERROR; payload: string }

export type ComicIssueLoaderData = {
  isComicIssueLoading: boolean;
  comicissue: ComicIssue | null;
  comicseries: ComicSeries | null;
  creatorLinks: CreatorLinkDetails[] | [];
  // Patreon Access State
  contentToken: string | null;
  isCheckingAccess: boolean;
  hasConnectedPatreon: boolean;
  accessError: string | null;
};

export const comicIssueInitialState: Partial<ComicIssueLoaderData> = {
  isComicIssueLoading: false,
  comicissue: null,
  comicseries: null,
  creatorLinks: [],
}

/* Action Creators */
interface GetComicIssueProps {
  publicClient: ApolloClient;
  issueUuid: string;
  seriesUuid: string;
  forceRefresh?: boolean;
}

/* Action Creators */
interface WrappedGetComicIssueProps {
  publicClient: ApolloClient;
  shortUrl: string;
  episodeId: string;
}

export async function loadComicIssueUrl(
  { publicClient, shortUrl, episodeId }: WrappedGetComicIssueProps,
  dispatch?: Dispatch<ComicIssueAction>
): Promise<Partial<ComicIssueLoaderData> | null> {
  if (dispatch) dispatch({ type: ComicIssueActionType.GET_COMICISSUE_START });

  try {
    // First get the comic series uuid from the shortUrl
    const getComicSeriesUuid = await publicClient.query<GetMiniComicSeriesQuery, GetMiniComicSeriesQueryVariables>({
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
      variables: { issueUuid: safeIssueUuid, seriesUuid: getComicSeriesUuid.data?.getComicSeries.uuid },
    });

    if (!comicIssueResult.data?.getComicIssue) {
      throw new Response("Not Found", { status: 404 });
    }

    const parsedData = parseLoaderComicIssue(comicIssueResult.data);

    if (dispatch) {
      dispatch({ 
        type: ComicIssueActionType.GET_COMICISSUE_SUCCESS, 
        payload: parsedData 
      });
    }
    
    return parsedData;
  } catch (error: any) {
    const errorMessage = error?.response?.data?.error || 
                        error?.message || 
                        'Failed to load comic issue';
    
    if (dispatch) {
      dispatch({ 
        type: ComicIssueActionType.GET_COMICISSUE_ERROR, 
        payload: errorMessage 
      });
    }

    return null;
  }
}

export async function loadComicIssue(
  { publicClient, issueUuid, seriesUuid, forceRefresh = false }: GetComicIssueProps,
  dispatch?: Dispatch<ComicIssueAction>
): Promise<Partial<ComicIssueLoaderData> | null> {
  if (dispatch) dispatch({ type: ComicIssueActionType.GET_COMICISSUE_START });

  try {
    const comicIssueResult = await publicClient.query<GetComicIssueQuery, GetComicIssueQueryVariables>({
      query: GetComicIssue,
      variables: { 
        issueUuid,
        seriesUuid,
      },
      ...(!!forceRefresh && { fetchPolicy: 'network-only' })
    });

    if (!comicIssueResult.data?.getComicIssue) {
      throw new Error("Comic issue data not found");
    }

    const parsedData = parseLoaderComicIssue(comicIssueResult.data);

    if (dispatch) {
      dispatch({ 
        type: ComicIssueActionType.GET_COMICISSUE_SUCCESS, 
        payload: parsedData 
      });
    }
    
    return parsedData;
  } catch (error: any) {
    const errorMessage = error?.response?.data?.error || 
                        error?.message || 
                        'Failed to load comic issue';
    
    if (dispatch) {
      dispatch({ 
        type: ComicIssueActionType.GET_COMICISSUE_ERROR, 
        payload: errorMessage 
      });
    }
    return null;
  }
}

export function parseLoaderComicIssue(data: GetComicIssueQuery): Partial<ComicIssueLoaderData> {
  return {
    isComicIssueLoading: false,
    comicissue: data.getComicIssue || null,
    comicseries: data.getComicSeries || null,
    creatorLinks: data.getCreatorLinksForSeries?.filter(
      (link: CreatorLinkDetails | null): link is CreatorLinkDetails => link !== null
    ) || [],
  };
}

/* Patreon Access Action Creators */
interface CheckPatreonAccessProps {
  isPatreonExclusive: boolean;
  hostingProviderUuid?: string | null;
  seriesUuid?: string | null;
  getContentTokenForProviderAndSeries: (
    hostingProviderUuid: string,
    seriesUuid: string
  ) => Promise<string | null>;
}

export async function checkPatreonAccess({ 
    isPatreonExclusive, 
    hostingProviderUuid, 
    seriesUuid,
    getContentTokenForProviderAndSeries
  }: CheckPatreonAccessProps,
  dispatch: Dispatch<ComicIssueAction>
): Promise<void> {
  // If not exclusive content, no need to check
  if (!isPatreonExclusive || !hostingProviderUuid || !seriesUuid) {
    return;
  }

  dispatch({ type: ComicIssueActionType.CHECK_PATREON_ACCESS_START });

  try {
    const token = await getContentTokenForProviderAndSeries(
      hostingProviderUuid,
      seriesUuid
    );
    
    if (token) {
      dispatch({ 
        type: ComicIssueActionType.CHECK_PATREON_ACCESS_SUCCESS, 
        payload: { contentToken: token, hasConnectedPatreon: true }
      });
    } else {
      // Connected but no access (not a backer)
      dispatch({ 
        type: ComicIssueActionType.CHECK_PATREON_ACCESS_NO_ACCESS,
        payload: { hasConnectedPatreon: true }
      });
    }
  } catch (error: any) {
    const errorMessage = error?.message || 'Failed to check Patreon access';
    dispatch({ 
      type: ComicIssueActionType.CHECK_PATREON_ACCESS_ERROR,
      payload: errorMessage
    });
  }
}

/* Reducer */
export function comicIssueReducer(
  state: Partial<ComicIssueLoaderData>,
  action: ComicIssueAction
): Partial<ComicIssueLoaderData> {
  switch (action.type) {
    case ComicIssueActionType.GET_COMICISSUE_START:
      return {
        ...state,
        isComicIssueLoading: true,
      };
    case ComicIssueActionType.GET_COMICISSUE_SUCCESS:
      return {
        ...state,
        ...action.payload,
        isComicIssueLoading: false,
      };
    case ComicIssueActionType.GET_COMICISSUE_ERROR:
      return {
        ...state,
        isComicIssueLoading: false,
        // Could add error field if needed
      };
      
    // Patreon Access Actions
    case ComicIssueActionType.CHECK_PATREON_ACCESS_START:
      return {
        ...state,
        isCheckingAccess: true,
        accessError: null,
      };
      
    case ComicIssueActionType.CHECK_PATREON_ACCESS_SUCCESS:
      return {
        ...state,
        isCheckingAccess: false,
        contentToken: action.payload.contentToken,
        hasConnectedPatreon: action.payload.hasConnectedPatreon,
        accessError: null,
      };
      
    case ComicIssueActionType.CHECK_PATREON_ACCESS_NO_ACCESS:
      return {
        ...state,
        isCheckingAccess: false,
        hasConnectedPatreon: action.payload.hasConnectedPatreon,
        accessError: null,
      };
      
    case ComicIssueActionType.CHECK_PATREON_ACCESS_ERROR:
      return {
        ...state,
        isCheckingAccess: false,
        accessError: action.payload,
      };
    default:
      return state;
  }
}