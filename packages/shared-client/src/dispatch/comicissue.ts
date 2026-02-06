import { ApolloClient } from '@apollo/client';
import type { Dispatch } from 'react';
import type { UserComicData } from './comicseries.js';
import { type GetComicIssueQuery, type GetComicIssueQueryVariables, GetComicIssue, type ComicIssue, type ComicSeries, GetMiniComicSeries, type GetMiniComicSeriesQuery, type GetMiniComicSeriesQueryVariables, type CreatorLinkDetails, type LikeComicIssueMutation, type LikeComicIssueMutationVariables, LikeComicIssue, type UnlikeComicIssueMutation, type UnlikeComicIssueMutationVariables, UnlikeComicIssue, type SuperLikeAllEpisodesMutation, type SuperLikeAllEpisodesMutationVariables, SuperLikeAllEpisodes, GetComicIssueDynamic, type GetComicIssueDynamicQuery, type GetComicIssueDynamicQueryVariables, GetComicSeriesDynamic } from "../graphql/operations.js";

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

  // Like Management
  LIKE_COMIC_ISSUE_START = 'LIKE_COMIC_ISSUE_START',
  LIKE_COMIC_ISSUE_SUCCESS = 'LIKE_COMIC_ISSUE_SUCCESS',
  LIKE_COMIC_ISSUE_ERROR = 'LIKE_COMIC_ISSUE_ERROR',

  UNLIKE_COMIC_ISSUE_START = 'UNLIKE_COMIC_ISSUE_START',
  UNLIKE_COMIC_ISSUE_SUCCESS = 'UNLIKE_COMIC_ISSUE_SUCCESS',
  UNLIKE_COMIC_ISSUE_ERROR = 'UNLIKE_COMIC_ISSUE_ERROR',

  SUPER_LIKE_ALL_EPISODES_START = 'SUPER_LIKE_ALL_EPISODES_START',
  SUPER_LIKE_ALL_EPISODES_SUCCESS = 'SUPER_LIKE_ALL_EPISODES_SUCCESS',
  SUPER_LIKE_ALL_EPISODES_ERROR = 'SUPER_LIKE_ALL_EPISODES_ERROR',
}

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

  // Like Management
  | { type: ComicIssueActionType.LIKE_COMIC_ISSUE_START }
  | { type: ComicIssueActionType.LIKE_COMIC_ISSUE_SUCCESS; payload: { userComicData: UserComicData; likeCount: number } }
  | { type: ComicIssueActionType.LIKE_COMIC_ISSUE_ERROR; payload: string }

  | { type: ComicIssueActionType.UNLIKE_COMIC_ISSUE_START }
  | { type: ComicIssueActionType.UNLIKE_COMIC_ISSUE_SUCCESS; payload: { userComicData: UserComicData; likeCount: number } }
  | { type: ComicIssueActionType.UNLIKE_COMIC_ISSUE_ERROR; payload: string }

  | { type: ComicIssueActionType.SUPER_LIKE_ALL_EPISODES_START }
  | { type: ComicIssueActionType.SUPER_LIKE_ALL_EPISODES_SUCCESS; payload: { userComicData: UserComicData } }
  | { type: ComicIssueActionType.SUPER_LIKE_ALL_EPISODES_ERROR; payload: string };

export type ComicIssueLoaderData = {
  isComicIssueLoading: boolean;
  comicissue: ComicIssue | null;
  comicseries: ComicSeries | null;
  creatorLinks: CreatorLinkDetails[] | [];
  likeCount: number | null;
  commentCount: number | null;
  // Patreon Access State
  contentToken: string | null;
  isCheckingAccess: boolean;
  hasConnectedPatreon: boolean;
  accessError: string | null;
  // Like-related state
  userComicData: UserComicData | null;
  isLikeLoading: boolean;
  likeError: string | null;
  isSuperLikeLoading: boolean;
  superLikeError: string | null;
};

export const comicIssueInitialState: Partial<ComicIssueLoaderData> = {
  isComicIssueLoading: false,
  comicissue: null,
  comicseries: null,
  creatorLinks: [],
  likeCount: null,
  commentCount: null,
  userComicData: null,
  isLikeLoading: false,
  likeError: null,
  isSuperLikeLoading: false,
  superLikeError: null,
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

/* Load Comic Issue Dynamic Data (stats + comments) */
interface LoadComicIssueDynamicProps {
  publicClient: ApolloClient;
  issueUuid: string;
  forceRefresh?: boolean;
}

export interface ComicIssueDynamicResult {
  likeCount: number;
  commentCount: number;
  comments: any[];
}

export async function loadComicIssueDynamic(
  { publicClient, issueUuid, forceRefresh = false }: LoadComicIssueDynamicProps,
  dispatch?: Dispatch<ComicIssueAction>
): Promise<ComicIssueDynamicResult | null> {
  try {
    const result = await publicClient.query<GetComicIssueDynamicQuery, GetComicIssueDynamicQueryVariables>({
      query: GetComicIssueDynamic,
      variables: { issueUuid },
      ...(!!forceRefresh && { fetchPolicy: 'network-only' })
    });

    const likeCount = result.data?.getStatsForComicIssue?.likeCount ?? 0;
    const commentCount = result.data?.getStatsForComicIssue?.commentCount ?? 0;
    const comments = (result.data?.getComments?.comments || []) as any[];

    if (dispatch) {
      dispatch({
        type: ComicIssueActionType.GET_COMICISSUE_SUCCESS,
        payload: { likeCount, commentCount },
      });
    }

    return { likeCount, commentCount, comments };
  } catch (error: any) {
    console.error('Failed to load comic issue dynamic data:', error?.message);
    return null;
  }
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

/* Like Action Creators */
interface LikeComicIssueProps {
  userClient: ApolloClient;
  issueUuid: string;
  seriesUuid: string;
}

interface SuperLikeAllEpisodesProps {
  userClient: ApolloClient;
  seriesUuid: string;
}

export async function likeComicIssue(
  { userClient, issueUuid, seriesUuid }: LikeComicIssueProps,
  dispatch?: Dispatch<ComicIssueAction>
): Promise<UserComicData | null> {
  if (dispatch) dispatch({ type: ComicIssueActionType.LIKE_COMIC_ISSUE_START });

  try {
    const result = await userClient.mutate<LikeComicIssueMutation, LikeComicIssueMutationVariables>({
      mutation: LikeComicIssue,
      variables: { issueUuid, seriesUuid },
      refetchQueries: [
        { query: GetComicIssueDynamic, variables: { issueUuid } },
        { query: GetComicSeriesDynamic, variables: { seriesUuid } }
      ],
      awaitRefetchQueries: true
    });

    if (!result.data?.likeComicIssue) {
      throw new Error('Failed to like comic issue');
    }

    // Read fresh stats from cache after refetch
    const statsData = userClient.readQuery<GetComicIssueDynamicQuery, GetComicIssueDynamicQueryVariables>({
      query: GetComicIssueDynamic,
      variables: { issueUuid }
    });

    const userComicData: UserComicData = {
      isSubscribed: result.data.likeComicIssue.isSubscribed,
      isRecommended: result.data.likeComicIssue.isRecommended,
      hasNotificationEnabled: result.data.likeComicIssue.hasNotificationEnabled,
      likedComicIssueUuids: result.data.likeComicIssue.likedComicIssueUuids?.filter((uuid): uuid is string => uuid !== null) || [],
    };
    const likeCount = statsData?.getStatsForComicIssue?.likeCount ?? 0;

    if (dispatch) {
      dispatch({
        type: ComicIssueActionType.LIKE_COMIC_ISSUE_SUCCESS,
        payload: { userComicData, likeCount }
      });
    }

    return userComicData;
  } catch (error: any) {
    const errorMessage = error?.response?.data?.error ||
                        error?.message ||
                        'Failed to like comic issue';

    if (dispatch) {
      dispatch({
        type: ComicIssueActionType.LIKE_COMIC_ISSUE_ERROR,
        payload: errorMessage
      });
    }
    return null;
  }
}

export async function unlikeComicIssue(
  { userClient, issueUuid, seriesUuid }: LikeComicIssueProps,
  dispatch?: Dispatch<ComicIssueAction>
): Promise<UserComicData | null> {
  if (dispatch) dispatch({ type: ComicIssueActionType.UNLIKE_COMIC_ISSUE_START });

  try {
    const result = await userClient.mutate<UnlikeComicIssueMutation, UnlikeComicIssueMutationVariables>({
      mutation: UnlikeComicIssue,
      variables: { issueUuid, seriesUuid },
      refetchQueries: [
        { query: GetComicIssueDynamic, variables: { issueUuid } },
        { query: GetComicSeriesDynamic, variables: { seriesUuid } }
      ],
      awaitRefetchQueries: true
    });

    if (!result.data?.unlikeComicIssue) {
      throw new Error('Failed to unlike comic issue');
    }

    // Read fresh stats from cache after refetch
    const statsData = userClient.readQuery<GetComicIssueDynamicQuery, GetComicIssueDynamicQueryVariables>({
      query: GetComicIssueDynamic,
      variables: { issueUuid }
    });

    const userComicData: UserComicData = {
      isSubscribed: result.data.unlikeComicIssue.isSubscribed,
      isRecommended: result.data.unlikeComicIssue.isRecommended,
      hasNotificationEnabled: result.data.unlikeComicIssue.hasNotificationEnabled,
      likedComicIssueUuids: result.data.unlikeComicIssue.likedComicIssueUuids?.filter((uuid): uuid is string => uuid !== null) || [],
    };
    const likeCount = statsData?.getStatsForComicIssue?.likeCount ?? 0;

    if (dispatch) {
      dispatch({
        type: ComicIssueActionType.UNLIKE_COMIC_ISSUE_SUCCESS,
        payload: { userComicData, likeCount }
      });
    }

    return userComicData;
  } catch (error: any) {
    const errorMessage = error?.response?.data?.error ||
                        error?.message ||
                        'Failed to unlike comic issue';

    if (dispatch) {
      dispatch({
        type: ComicIssueActionType.UNLIKE_COMIC_ISSUE_ERROR,
        payload: errorMessage
      });
    }
    return null;
  }
}

export async function superLikeAllEpisodes(
  { userClient, seriesUuid }: SuperLikeAllEpisodesProps,
  dispatch?: Dispatch<ComicIssueAction>
): Promise<UserComicData | null> {
  if (dispatch) dispatch({ type: ComicIssueActionType.SUPER_LIKE_ALL_EPISODES_START });

  try {
    const result = await userClient.mutate<SuperLikeAllEpisodesMutation, SuperLikeAllEpisodesMutationVariables>({
      mutation: SuperLikeAllEpisodes,
      variables: { seriesUuid }
    });

    if (!result.data?.superLikeAllEpisodes) {
      throw new Error('Failed to super-like all episodes');
    }

    const userComicData: UserComicData = {
      isSubscribed: result.data.superLikeAllEpisodes.isSubscribed,
      isRecommended: result.data.superLikeAllEpisodes.isRecommended,
      hasNotificationEnabled: result.data.superLikeAllEpisodes.hasNotificationEnabled,
      likedComicIssueUuids: result.data.superLikeAllEpisodes.likedComicIssueUuids?.filter((uuid): uuid is string => uuid !== null) || [] as string[],
    };

    if (dispatch) {
      dispatch({
        type: ComicIssueActionType.SUPER_LIKE_ALL_EPISODES_SUCCESS,
        payload: { userComicData }
      });
    }

    return userComicData;
  } catch (error: any) {
    const errorMessage = error?.response?.data?.error ||
                        error?.message ||
                        'Failed to super-like all episodes';

    if (dispatch) {
      dispatch({
        type: ComicIssueActionType.SUPER_LIKE_ALL_EPISODES_ERROR,
        payload: errorMessage
      });
    }
    return null;
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

    // Like Management
    case ComicIssueActionType.LIKE_COMIC_ISSUE_START:
      return {
        ...state,
        isLikeLoading: true,
        likeError: null,
      };
    case ComicIssueActionType.LIKE_COMIC_ISSUE_SUCCESS:
      return {
        ...state,
        userComicData: action.payload.userComicData,
        likeCount: action.payload.likeCount,
        isLikeLoading: false,
        likeError: null,
      };
    case ComicIssueActionType.LIKE_COMIC_ISSUE_ERROR:
      return {
        ...state,
        isLikeLoading: false,
        likeError: action.payload,
      };

    case ComicIssueActionType.UNLIKE_COMIC_ISSUE_START:
      return {
        ...state,
        isLikeLoading: true,
        likeError: null,
      };
    case ComicIssueActionType.UNLIKE_COMIC_ISSUE_SUCCESS:
      return {
        ...state,
        userComicData: action.payload.userComicData,
        likeCount: action.payload.likeCount,
        isLikeLoading: false,
        likeError: null,
      };
    case ComicIssueActionType.UNLIKE_COMIC_ISSUE_ERROR:
      return {
        ...state,
        isLikeLoading: false,
        likeError: action.payload,
      };

    case ComicIssueActionType.SUPER_LIKE_ALL_EPISODES_START:
      return {
        ...state,
        isSuperLikeLoading: true,
        superLikeError: null,
      };
    case ComicIssueActionType.SUPER_LIKE_ALL_EPISODES_SUCCESS: {
      // Check if current episode was already liked before super-like
      const wasCurrentEpisodeLiked = state.comicissue?.uuid &&
        state.userComicData?.likedComicIssueUuids?.includes(state.comicissue.uuid);
      return {
        ...state,
        userComicData: action.payload.userComicData,
        // Only increment if current episode wasn't already liked
        likeCount: wasCurrentEpisodeLiked
          ? state.likeCount
          : (state.likeCount ?? 0) + 1,
        isSuperLikeLoading: false,
        superLikeError: null,
      };
    }
    case ComicIssueActionType.SUPER_LIKE_ALL_EPISODES_ERROR:
      return {
        ...state,
        isSuperLikeLoading: false,
        superLikeError: action.payload,
      };

    default:
      return state;
  }
}