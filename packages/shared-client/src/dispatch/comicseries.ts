import { ApolloClient } from '@apollo/client';
import type { Dispatch } from 'react';
import { type GetComicSeriesQuery, type GetComicSeriesQueryVariables, SortOrder, GetComicSeries, type ComicIssue, type ComicSeries, GetMiniComicSeries, type GetMiniComicSeriesQuery, type GetMiniComicSeriesQueryVariables, type SubscribeToSeriesMutation, type SubscribeToSeriesMutationVariables, SubscribeToSeries, type UnsubscribeFromSeriesMutation, type UnsubscribeFromSeriesMutationVariables, UnsubscribeFromSeries, GetUserComicSeries, type GetUserComicSeriesQuery, type GetUserComicSeriesQueryVariables, type EnableNotificationsForSeriesMutation, type EnableNotificationsForSeriesMutationVariables, EnableNotificationsForSeries, type DisableNotificationsForSeriesMutation, type DisableNotificationsForSeriesMutationVariables, DisableNotificationsForSeries, GetProfileByUserId, type LikeComicIssueMutation, type LikeComicIssueMutationVariables, LikeComicIssue, type UnlikeComicIssueMutation, type UnlikeComicIssueMutationVariables, UnlikeComicIssue, GetComicSeriesDynamic, type GetComicSeriesDynamicQuery, type GetComicSeriesDynamicQueryVariables, GetComicIssueDynamic } from "../graphql/operations.js";
import { emit, EventNames } from '../pubsub';

/* Action Type Enum */
export enum ComicSeriesActionType {
  // Comic Series Loading
  GET_COMICSERIES_START = 'GET_COMICSERIES_START',
  GET_COMICSERIES_SUCCESS = 'GET_COMICSERIES_SUCCESS',
  GET_COMICSERIES_ERROR = 'GET_COMICSERIES_ERROR',
  
  // User Comic Data
  GET_USER_COMIC_DATA_START = 'GET_USER_COMIC_DATA_START',
  GET_USER_COMIC_DATA_SUCCESS = 'GET_USER_COMIC_DATA_SUCCESS',
  GET_USER_COMIC_DATA_ERROR = 'GET_USER_COMIC_DATA_ERROR',
  
  // Subscription Management
  SUBSCRIBE_TO_SERIES_START = 'SUBSCRIBE_TO_SERIES_START',
  SUBSCRIBE_TO_SERIES_SUCCESS = 'SUBSCRIBE_TO_SERIES_SUCCESS',
  SUBSCRIBE_TO_SERIES_ERROR = 'SUBSCRIBE_TO_SERIES_ERROR',
  
  UNSUBSCRIBE_FROM_SERIES_START = 'UNSUBSCRIBE_FROM_SERIES_START',
  UNSUBSCRIBE_FROM_SERIES_SUCCESS = 'UNSUBSCRIBE_FROM_SERIES_SUCCESS',
  UNSUBSCRIBE_FROM_SERIES_ERROR = 'UNSUBSCRIBE_FROM_SERIES_ERROR',
  
  // Notification Management
  ENABLE_NOTIFICATIONS_FOR_SERIES_START = 'ENABLE_NOTIFICATIONS_FOR_SERIES_START',
  ENABLE_NOTIFICATIONS_FOR_SERIES_SUCCESS = 'ENABLE_NOTIFICATIONS_FOR_SERIES_SUCCESS',
  ENABLE_NOTIFICATIONS_FOR_SERIES_ERROR = 'ENABLE_NOTIFICATIONS_FOR_SERIES_ERROR',
  
  DISABLE_NOTIFICATIONS_FOR_SERIES_START = 'DISABLE_NOTIFICATIONS_FOR_SERIES_START',
  DISABLE_NOTIFICATIONS_FOR_SERIES_SUCCESS = 'DISABLE_NOTIFICATIONS_FOR_SERIES_SUCCESS',
  DISABLE_NOTIFICATIONS_FOR_SERIES_ERROR = 'DISABLE_NOTIFICATIONS_FOR_SERIES_ERROR',

  // Like Management (for individual issues in series page)
  LIKE_COMIC_ISSUE_START = 'LIKE_COMIC_ISSUE_START',
  LIKE_COMIC_ISSUE_SUCCESS = 'LIKE_COMIC_ISSUE_SUCCESS',
  LIKE_COMIC_ISSUE_ERROR = 'LIKE_COMIC_ISSUE_ERROR',

  UNLIKE_COMIC_ISSUE_START = 'UNLIKE_COMIC_ISSUE_START',
  UNLIKE_COMIC_ISSUE_SUCCESS = 'UNLIKE_COMIC_ISSUE_SUCCESS',
  UNLIKE_COMIC_ISSUE_ERROR = 'UNLIKE_COMIC_ISSUE_ERROR',
}

/* Action Types */
export interface UserComicData {
  isSubscribed: boolean;
  isRecommended: boolean;
  hasNotificationEnabled: boolean;
  likedComicIssueUuids: string[];
}

export type ComicSeriesAction =
  // Comic Series Loading
  | { type: ComicSeriesActionType.GET_COMICSERIES_START }
  | { type: ComicSeriesActionType.GET_COMICSERIES_SUCCESS; payload: Partial<ComicSeriesLoaderData> }
  | { type: ComicSeriesActionType.GET_COMICSERIES_ERROR; payload: string }
  
  // User Comic Data
  | { type: ComicSeriesActionType.GET_USER_COMIC_DATA_START }
  | { type: ComicSeriesActionType.GET_USER_COMIC_DATA_SUCCESS; payload: Partial<ComicSeriesLoaderData> }
  | { type: ComicSeriesActionType.GET_USER_COMIC_DATA_ERROR; payload: string }
  
  // Subscription Management
  | { type: ComicSeriesActionType.SUBSCRIBE_TO_SERIES_START }
  | { type: ComicSeriesActionType.SUBSCRIBE_TO_SERIES_SUCCESS; payload: { userComicData: UserComicData } }
  | { type: ComicSeriesActionType.SUBSCRIBE_TO_SERIES_ERROR; payload: string }
  
  | { type: ComicSeriesActionType.UNSUBSCRIBE_FROM_SERIES_START }
  | { type: ComicSeriesActionType.UNSUBSCRIBE_FROM_SERIES_SUCCESS; payload: { userComicData: UserComicData } }
  | { type: ComicSeriesActionType.UNSUBSCRIBE_FROM_SERIES_ERROR; payload: string }
  
  // Notification Management
  | { type: ComicSeriesActionType.ENABLE_NOTIFICATIONS_FOR_SERIES_START }
  | { type: ComicSeriesActionType.ENABLE_NOTIFICATIONS_FOR_SERIES_SUCCESS; payload: { userComicData: UserComicData } }
  | { type: ComicSeriesActionType.ENABLE_NOTIFICATIONS_FOR_SERIES_ERROR; payload: string }
  
  | { type: ComicSeriesActionType.DISABLE_NOTIFICATIONS_FOR_SERIES_START }
  | { type: ComicSeriesActionType.DISABLE_NOTIFICATIONS_FOR_SERIES_SUCCESS; payload: { userComicData: UserComicData } }
  | { type: ComicSeriesActionType.DISABLE_NOTIFICATIONS_FOR_SERIES_ERROR; payload: string }

  // Like Management (for individual issues in series page)
  | { type: ComicSeriesActionType.LIKE_COMIC_ISSUE_START; payload: { issueUuid: string } }
  | { type: ComicSeriesActionType.LIKE_COMIC_ISSUE_SUCCESS; payload: { issueUuid: string; userComicData: UserComicData; likeCount: number; commentCount: number } }
  | { type: ComicSeriesActionType.LIKE_COMIC_ISSUE_ERROR; payload: { issueUuid: string; error: string } }

  | { type: ComicSeriesActionType.UNLIKE_COMIC_ISSUE_START; payload: { issueUuid: string } }
  | { type: ComicSeriesActionType.UNLIKE_COMIC_ISSUE_SUCCESS; payload: { issueUuid: string; userComicData: UserComicData; likeCount: number; commentCount: number } }
  | { type: ComicSeriesActionType.UNLIKE_COMIC_ISSUE_ERROR; payload: { issueUuid: string; error: string } };

export type ComicSeriesLoaderData = {
  isComicSeriesLoading: boolean;
  comicseries: ComicSeries | null;
  issues: ComicIssue[];
  userComicData: UserComicData | null;
  isUserDataLoading: boolean;
  userDataError: string | null;
  isSubscriptionLoading: boolean;
  subscriptionError: string | null;
  isNotificationLoading: boolean;
  notificationError: string | null;
  likeCount: number;
  commentCount: number;
  issueLikeLoadingMap: Record<string, boolean>;
};

export const comicSeriesInitialState: Partial<ComicSeriesLoaderData> = {
  isComicSeriesLoading: false,
  comicseries: null,
  issues: [],
  userComicData: null,
  isUserDataLoading: false,
  userDataError: null,
  isSubscriptionLoading: false,
  subscriptionError: null,
  isNotificationLoading: false,
  notificationError: null,
  likeCount: 0,
  commentCount: 0,
  issueLikeLoadingMap: {},
}

/* Action Creators */
interface GetComicSeriesProps {
  publicClient: ApolloClient;
  uuid: string;
  forceRefresh?: boolean;
}

/* Action Creators */
interface WrappedGetComicSeriesProps {
  publicClient: ApolloClient;
  shortUrl: string;
}

/* User Comic Data Actions */
interface GetUserComicDataProps {
  userClient: ApolloClient;
  seriesUuid: string;
  forceRefresh?: boolean;
}

interface SubscribeToSeriesProps {
  userClient: ApolloClient;
  seriesUuid: string;
  userId: string;
}

interface UnsubscribeFromSeriesProps {
  userClient: ApolloClient;
  seriesUuid: string;
  userId: string;
}

/* Notification Actions */
interface EnableNotificationsProps {
  userClient: ApolloClient;
  seriesUuid: string;
  userId: string;
}

interface DisableNotificationsProps {
  userClient: ApolloClient;
  seriesUuid: string;
  userId: string;
}

export async function loadComicSeriesUrl(
  { publicClient, shortUrl }: WrappedGetComicSeriesProps,
  dispatch?: Dispatch<ComicSeriesAction>
): Promise<Partial<ComicSeriesLoaderData> | null> {
  if (dispatch) dispatch({ type: ComicSeriesActionType.GET_COMICSERIES_START });

  try {
    // Then get the full comic series data
    const getComicSeriesUuid = await publicClient.query<GetMiniComicSeriesQuery, GetMiniComicSeriesQueryVariables>({
      query: GetMiniComicSeries,
      variables: { shortUrl },
    });
    
    if (!getComicSeriesUuid.data?.getComicSeries?.uuid) {
      throw new Response("Not Found", { status: 404 });
    }

    const parsedData = parseLoaderComicSeries(getComicSeriesUuid.data);

    if (dispatch) {
      dispatch({ 
        type: ComicSeriesActionType.GET_COMICSERIES_SUCCESS, 
        payload: parsedData 
      });
    }
    
    return parsedData;
  } catch (error: any) {
    const errorMessage = error?.response?.data?.error || 
                        error?.message || 
                        'Failed to load comic series';
    
    if (dispatch) {
      dispatch({ 
        type: ComicSeriesActionType.GET_COMICSERIES_ERROR, 
        payload: errorMessage 
      });
    }
    return null;
  }
}

export async function loadComicSeries(
  { publicClient, uuid, forceRefresh = false }: GetComicSeriesProps,
  dispatch?: Dispatch<ComicSeriesAction>
): Promise<Partial<ComicSeriesLoaderData> | null> {
  if (dispatch) dispatch({ type: ComicSeriesActionType.GET_COMICSERIES_START });

  try {
    // Then get the full comic series data
    const comicSeriesResult = await publicClient.query<GetComicSeriesQuery, GetComicSeriesQueryVariables>({
      query: GetComicSeries,
      variables: { 
        uuid,
        sortOrderForIssues: SortOrder.OLDEST,
        limitPerPageForIssues: 1000,
        pageForIssues: 1
      },
      ...(!!forceRefresh && { fetchPolicy: 'network-only' })
    });

    if (!comicSeriesResult.data?.getComicSeries) {
      throw new Error("Comic series data not found");
    }

    const parsedData = parseLoaderComicSeries(comicSeriesResult.data);

    if (dispatch) {
      dispatch({ 
        type: ComicSeriesActionType.GET_COMICSERIES_SUCCESS, 
        payload: parsedData 
      });
    }
    
    return parsedData;
  } catch (error: any) {
    const errorMessage = error?.response?.data?.error || 
                        error?.message || 
                        'Failed to load comic series';
    
    if (dispatch) {
      dispatch({ 
        type: ComicSeriesActionType.GET_COMICSERIES_ERROR, 
        payload: errorMessage 
      });
    }
    return null;
  }
}

export async function loadUserComicData(
  { userClient, seriesUuid, forceRefresh = false }: GetUserComicDataProps,
  dispatch?: Dispatch<ComicSeriesAction>
): Promise<Partial<ComicSeriesLoaderData> | null> {
  if (dispatch) dispatch({ type: ComicSeriesActionType.GET_USER_COMIC_DATA_START });

  try {
    const result = await userClient.query<GetUserComicSeriesQuery, GetUserComicSeriesQueryVariables>({
      query: GetUserComicSeries,
      variables: { seriesUuid },
      ...(!!forceRefresh && { fetchPolicy: 'network-only' })
    });

    const parsedData = parseLoaderUserComicSeries(result.data);

    if (dispatch) {
      dispatch({ 
        type: ComicSeriesActionType.GET_USER_COMIC_DATA_SUCCESS, 
        payload: parsedData 
      });
    }
    
    return parsedData;
  } catch (error: any) {
    const errorMessage = error?.response?.data?.error || 
                        error?.message || 
                        'Failed to load user comic data';
    
    if (dispatch) {
      dispatch({ 
        type: ComicSeriesActionType.GET_USER_COMIC_DATA_ERROR, 
        payload: errorMessage 
      });
    }
    return null;
  }
}

export async function subscribeToSeries(
  { userClient, seriesUuid, userId }: SubscribeToSeriesProps,
  dispatch?: Dispatch<ComicSeriesAction>
): Promise<UserComicData | null> {
  if (dispatch) dispatch({ type: ComicSeriesActionType.SUBSCRIBE_TO_SERIES_START });

  try {
    const result = await userClient.mutate<SubscribeToSeriesMutation, SubscribeToSeriesMutationVariables>({
      mutation: SubscribeToSeries,
      refetchQueries: [{ query: GetProfileByUserId, variables: { id: userId } }],
      variables: { seriesUuid }
    });

    if (!result.data?.subscribeToSeries) {
      throw new Error('Failed to subscribe to series');
    }
    
    const userComicData: UserComicData = {
      isSubscribed: result.data.subscribeToSeries.isSubscribed,
      isRecommended: result.data.subscribeToSeries.isRecommended,
      hasNotificationEnabled: result.data.subscribeToSeries.hasNotificationEnabled,
      likedComicIssueUuids: result.data.subscribeToSeries.likedComicIssueUuids?.filter((uuid): uuid is string => uuid !== null),
    };

    if (dispatch) {
      dispatch({
        type: ComicSeriesActionType.SUBSCRIBE_TO_SERIES_SUCCESS,
        payload: { userComicData }
      });
    }

    // Emit event for other components to listen
    emit(EventNames.COMIC_SUBSCRIBED, { seriesUuid, userId });
    
    return userComicData;
  } catch (error: any) {
    const errorMessage = error?.response?.data?.error || 
                        error?.message || 
                        'Failed to subscribe to series';
    
    if (dispatch) {
      dispatch({ 
        type: ComicSeriesActionType.SUBSCRIBE_TO_SERIES_ERROR, 
        payload: errorMessage 
      });
    }
    return null;
  }
}

export async function unsubscribeFromSeries(
  { userClient, seriesUuid, userId }: UnsubscribeFromSeriesProps,
  dispatch?: Dispatch<ComicSeriesAction>
): Promise<UserComicData | null> {
  if (dispatch) dispatch({ type: ComicSeriesActionType.UNSUBSCRIBE_FROM_SERIES_START });

  try {
    const result = await userClient.mutate<UnsubscribeFromSeriesMutation, UnsubscribeFromSeriesMutationVariables>({
      mutation: UnsubscribeFromSeries,
      refetchQueries: [{ query: GetProfileByUserId, variables: { id: userId } }],
      variables: { seriesUuid }
    });

    if (!result.data?.unsubscribeFromSeries) {
      throw new Error('Failed to unsubscribe from series');
    }
    
    const userComicData: UserComicData = {
      isSubscribed: result.data.unsubscribeFromSeries.isSubscribed,
      isRecommended: result.data.unsubscribeFromSeries.isRecommended,
      hasNotificationEnabled: result.data.unsubscribeFromSeries.hasNotificationEnabled,
      likedComicIssueUuids: result.data.unsubscribeFromSeries.likedComicIssueUuids?.filter((uuid): uuid is string => uuid !== null),
    };

    if (dispatch) {
      dispatch({
        type: ComicSeriesActionType.UNSUBSCRIBE_FROM_SERIES_SUCCESS,
        payload: { userComicData }
      });
    }

    // Emit event for other components to listen
    emit(EventNames.COMIC_UNSUBSCRIBED, { seriesUuid, userId });
    
    return userComicData;
  } catch (error: any) {
    const errorMessage = error?.response?.data?.error || 
                        error?.message || 
                        'Failed to unsubscribe from series';
    
    if (dispatch) {
      dispatch({ 
        type: ComicSeriesActionType.UNSUBSCRIBE_FROM_SERIES_ERROR, 
        payload: errorMessage 
      });
    }
    return null;
  }
}


export async function enableNotificationsForSeries(
  { userClient, seriesUuid, userId }: EnableNotificationsProps,
  dispatch?: Dispatch<ComicSeriesAction>
): Promise<UserComicData | null> {
  if (dispatch) dispatch({ type: ComicSeriesActionType.ENABLE_NOTIFICATIONS_FOR_SERIES_START });

  try {
    const result = await userClient.mutate<EnableNotificationsForSeriesMutation, EnableNotificationsForSeriesMutationVariables>({
      mutation: EnableNotificationsForSeries,
      variables: { seriesUuid }
    });

    if (!result.data?.enableNotificationsForSeries) {
      throw new Error('Failed to enable notifications for series');
    }
    
    const userComicData: UserComicData = {
      isSubscribed: result.data.enableNotificationsForSeries.isSubscribed,
      isRecommended: result.data.enableNotificationsForSeries.isRecommended,
      hasNotificationEnabled: result.data.enableNotificationsForSeries.hasNotificationEnabled,
      likedComicIssueUuids: result.data.enableNotificationsForSeries.likedComicIssueUuids?.filter((uuid): uuid is string => uuid !== null),
    };

    if (dispatch) {
      dispatch({
        type: ComicSeriesActionType.ENABLE_NOTIFICATIONS_FOR_SERIES_SUCCESS,
        payload: { userComicData }
      });
    }

    return userComicData;
  } catch (error: any) {
    const errorMessage = error?.response?.data?.error || 
                        error?.message || 
                        'Failed to enable notifications for series';
    
    if (dispatch) {
      dispatch({ 
        type: ComicSeriesActionType.ENABLE_NOTIFICATIONS_FOR_SERIES_ERROR, 
        payload: errorMessage 
      });
    }
    return null;
  }
}

export async function disableNotificationsForSeries(
  { userClient, seriesUuid, userId }: DisableNotificationsProps,
  dispatch?: Dispatch<ComicSeriesAction>
): Promise<UserComicData | null> {
  if (dispatch) dispatch({ type: ComicSeriesActionType.DISABLE_NOTIFICATIONS_FOR_SERIES_START });

  try {
    const result = await userClient.mutate<DisableNotificationsForSeriesMutation, DisableNotificationsForSeriesMutationVariables>({
      mutation: DisableNotificationsForSeries,
      variables: { seriesUuid }
    });

    if (!result.data?.disableNotificationsForSeries) {
      throw new Error('Failed to disable notifications for series');
    }
    
    const userComicData: UserComicData = {
      isSubscribed: result.data.disableNotificationsForSeries.isSubscribed,
      isRecommended: result.data.disableNotificationsForSeries.isRecommended,
      hasNotificationEnabled: result.data.disableNotificationsForSeries.hasNotificationEnabled,
      likedComicIssueUuids: result.data.disableNotificationsForSeries.likedComicIssueUuids?.filter((uuid): uuid is string => uuid !== null),
    };

    if (dispatch) {
      dispatch({
        type: ComicSeriesActionType.DISABLE_NOTIFICATIONS_FOR_SERIES_SUCCESS,
        payload: { userComicData }
      });
    }

    return userComicData;
  } catch (error: any) {
    const errorMessage = error?.response?.data?.error || 
                        error?.message || 
                        'Failed to disable notifications for series';
    
    if (dispatch) {
      dispatch({ 
        type: ComicSeriesActionType.DISABLE_NOTIFICATIONS_FOR_SERIES_ERROR, 
        payload: errorMessage 
      });
    }
    return null;
  }
}

/* Like Comic Issue in Series Actions */
interface LikeComicIssueInSeriesProps {
  userClient: ApolloClient;
  issueUuid: string;
  seriesUuid: string;
}

export async function likeComicIssueInSeries(
  { userClient, issueUuid, seriesUuid }: LikeComicIssueInSeriesProps,
  dispatch?: Dispatch<ComicSeriesAction>
): Promise<UserComicData | null> {
  if (dispatch) dispatch({ type: ComicSeriesActionType.LIKE_COMIC_ISSUE_START, payload: { issueUuid } });

  try {
    const result = await userClient.mutate<LikeComicIssueMutation, LikeComicIssueMutationVariables>({
      mutation: LikeComicIssue,
      variables: { issueUuid, seriesUuid },
      refetchQueries: [
        { query: GetComicSeriesDynamic, variables: { seriesUuid } },
        { query: GetComicIssueDynamic, variables: { issueUuid } }
      ],
      awaitRefetchQueries: true
    });

    if (!result.data?.likeComicIssue) {
      throw new Error('Failed to like comic issue');
    }

    // Read fresh stats from cache after refetch
    const statsData = userClient.readQuery<GetComicSeriesDynamicQuery, GetComicSeriesDynamicQueryVariables>({
      query: GetComicSeriesDynamic,
      variables: { seriesUuid }
    });

    const userComicData: UserComicData = {
      isSubscribed: result.data.likeComicIssue.isSubscribed,
      isRecommended: result.data.likeComicIssue.isRecommended,
      hasNotificationEnabled: result.data.likeComicIssue.hasNotificationEnabled,
      likedComicIssueUuids: result.data.likeComicIssue.likedComicIssueUuids?.filter((uuid): uuid is string => uuid !== null) || [],
    };

    // Get the fresh totals from the refetched series stats
    const likeCount = statsData?.getStatsForComicSeries?.likeCount ?? 0;
    const commentCount = statsData?.getStatsForComicSeries?.commentCount ?? 0;

    if (dispatch) {
      dispatch({
        type: ComicSeriesActionType.LIKE_COMIC_ISSUE_SUCCESS,
        payload: { issueUuid, userComicData, likeCount, commentCount }
      });
    }

    return userComicData;
  } catch (error: any) {
    const errorMessage = error?.response?.data?.error ||
                        error?.message ||
                        'Failed to like comic issue';

    if (dispatch) {
      dispatch({
        type: ComicSeriesActionType.LIKE_COMIC_ISSUE_ERROR,
        payload: { issueUuid, error: errorMessage }
      });
    }
    return null;
  }
}

export async function unlikeComicIssueInSeries(
  { userClient, issueUuid, seriesUuid }: LikeComicIssueInSeriesProps,
  dispatch?: Dispatch<ComicSeriesAction>
): Promise<UserComicData | null> {
  if (dispatch) dispatch({ type: ComicSeriesActionType.UNLIKE_COMIC_ISSUE_START, payload: { issueUuid } });

  try {
    const result = await userClient.mutate<UnlikeComicIssueMutation, UnlikeComicIssueMutationVariables>({
      mutation: UnlikeComicIssue,
      variables: { issueUuid, seriesUuid },
      refetchQueries: [
        { query: GetComicSeriesDynamic, variables: { seriesUuid } },
        { query: GetComicIssueDynamic, variables: { issueUuid } }
      ],
      awaitRefetchQueries: true
    });

    if (!result.data?.unlikeComicIssue) {
      throw new Error('Failed to unlike comic issue');
    }

    // Read fresh stats from cache after refetch
    const statsData = userClient.readQuery<GetComicSeriesDynamicQuery, GetComicSeriesDynamicQueryVariables>({
      query: GetComicSeriesDynamic,
      variables: { seriesUuid }
    });

    const userComicData: UserComicData = {
      isSubscribed: result.data.unlikeComicIssue.isSubscribed,
      isRecommended: result.data.unlikeComicIssue.isRecommended,
      hasNotificationEnabled: result.data.unlikeComicIssue.hasNotificationEnabled,
      likedComicIssueUuids: result.data.unlikeComicIssue.likedComicIssueUuids?.filter((uuid): uuid is string => uuid !== null) || [],
    };

    // Get the fresh totals from the refetched series stats
    const likeCount = statsData?.getStatsForComicSeries?.likeCount ?? 0;
    const commentCount = statsData?.getStatsForComicSeries?.commentCount ?? 0;

    if (dispatch) {
      dispatch({
        type: ComicSeriesActionType.UNLIKE_COMIC_ISSUE_SUCCESS,
        payload: { issueUuid, userComicData, likeCount, commentCount }
      });
    }

    return userComicData;
  } catch (error: any) {
    const errorMessage = error?.response?.data?.error ||
                        error?.message ||
                        'Failed to unlike comic issue';

    if (dispatch) {
      dispatch({
        type: ComicSeriesActionType.UNLIKE_COMIC_ISSUE_ERROR,
        payload: { issueUuid, error: errorMessage }
      });
    }
    return null;
  }
}

export function parseLoaderComicSeries(data: GetComicSeriesQuery): Partial<ComicSeriesLoaderData> {
  return {
    isComicSeriesLoading: false,
    comicseries: data.getComicSeries || null,
    issues: data.getIssuesForComicSeries?.issues?.filter(
      (issue: ComicIssue | null): issue is ComicIssue => issue !== null
    ) || [],
  };
}

/* Load Comic Series Dynamic Data (stats) */
interface LoadComicSeriesDynamicProps {
  publicClient: ApolloClient;
  seriesUuid: string;
  forceRefresh?: boolean;
}

export async function loadComicSeriesDynamic(
  { publicClient, seriesUuid, forceRefresh = false }: LoadComicSeriesDynamicProps,
  dispatch?: Dispatch<ComicSeriesAction>
): Promise<Partial<ComicSeriesLoaderData> | null> {
  try {
    const result = await publicClient.query<GetComicSeriesDynamicQuery, GetComicSeriesDynamicQueryVariables>({
      query: GetComicSeriesDynamic,
      variables: { seriesUuid },
      ...(!!forceRefresh && { fetchPolicy: 'network-only' })
    });

    const likeCount = result.data?.getStatsForComicSeries?.likeCount ?? 0;
    const commentCount = result.data?.getStatsForComicSeries?.commentCount ?? 0;

    const payload: Partial<ComicSeriesLoaderData> = { likeCount, commentCount };

    if (dispatch) {
      dispatch({
        type: ComicSeriesActionType.GET_COMICSERIES_SUCCESS,
        payload,
      });
    }

    return payload;
  } catch (error: any) {
    console.error('Failed to load comic series dynamic data:', error?.message);
    return null;
  }
}

export function parseLoaderUserComicSeries(data: GetUserComicSeriesQuery | undefined): Partial<ComicSeriesLoaderData> {
  return {
    isUserDataLoading: false,
    userComicData: data?.getUserComicSeries ? {
      isSubscribed: data.getUserComicSeries?.isSubscribed || false,
      isRecommended: data.getUserComicSeries?.isRecommended || false,
      hasNotificationEnabled: data.getUserComicSeries?.hasNotificationEnabled || false,
      likedComicIssueUuids: data.getUserComicSeries?.likedComicIssueUuids?.filter((uuid): uuid is string => uuid !== null) || [] as string[],
    } : null
  };
}

/* Reducer */
export function comicSeriesReducer(
  state: Partial<ComicSeriesLoaderData>,
  action: ComicSeriesAction
): Partial<ComicSeriesLoaderData> {
  switch (action.type) {
    // Comic Series Loading
    case ComicSeriesActionType.GET_COMICSERIES_START:
      return {
        ...state,
        isComicSeriesLoading: true,
      };
    case ComicSeriesActionType.GET_COMICSERIES_SUCCESS:
      return {
        ...state,
        ...action.payload,
        isComicSeriesLoading: false,
      };
    case ComicSeriesActionType.GET_COMICSERIES_ERROR:
      return {
        ...state,
        isComicSeriesLoading: false,
        // Could add a general error field if needed
      };
      
    // User Comic Data
    case ComicSeriesActionType.GET_USER_COMIC_DATA_START:
      return {
        ...state,
        isUserDataLoading: true,
        userDataError: null,
      };
    case ComicSeriesActionType.GET_USER_COMIC_DATA_SUCCESS:
      return {
        ...state,
        ...action.payload,
        isUserDataLoading: false,
        userDataError: null,
      };
    case ComicSeriesActionType.GET_USER_COMIC_DATA_ERROR:
      return {
        ...state,
        isUserDataLoading: false,
        userDataError: action.payload,
      };
      
    // Subscription Management
    case ComicSeriesActionType.SUBSCRIBE_TO_SERIES_START:
      return {
        ...state,
        isSubscriptionLoading: true,
        subscriptionError: null,
      };
    case ComicSeriesActionType.SUBSCRIBE_TO_SERIES_SUCCESS:
      return {
        ...state,
        userComicData: action.payload.userComicData,
        isSubscriptionLoading: false,
        subscriptionError: null,
      };
    case ComicSeriesActionType.SUBSCRIBE_TO_SERIES_ERROR:
      return {
        ...state,
        isSubscriptionLoading: false,
        subscriptionError: action.payload,
      };
      
    case ComicSeriesActionType.UNSUBSCRIBE_FROM_SERIES_START:
      return {
        ...state,
        isSubscriptionLoading: true,
        subscriptionError: null,
      };
    case ComicSeriesActionType.UNSUBSCRIBE_FROM_SERIES_SUCCESS:
      return {
        ...state,
        userComicData: action.payload.userComicData,
        isSubscriptionLoading: false,
        subscriptionError: null,
      };
    case ComicSeriesActionType.UNSUBSCRIBE_FROM_SERIES_ERROR:
      return {
        ...state,
        isSubscriptionLoading: false,
        subscriptionError: action.payload,
      };
      
    // Notification Management
    case ComicSeriesActionType.ENABLE_NOTIFICATIONS_FOR_SERIES_START:
      return {
        ...state,
        isNotificationLoading: true,
        notificationError: null,
      };
    case ComicSeriesActionType.ENABLE_NOTIFICATIONS_FOR_SERIES_SUCCESS:
      return {
        ...state,
        userComicData: action.payload.userComicData,
        isNotificationLoading: false,
        notificationError: null,
      };
    case ComicSeriesActionType.ENABLE_NOTIFICATIONS_FOR_SERIES_ERROR:
      return {
        ...state,
        isNotificationLoading: false,
        notificationError: action.payload,
      };
      
    case ComicSeriesActionType.DISABLE_NOTIFICATIONS_FOR_SERIES_START:
      return {
        ...state,
        isNotificationLoading: true,
        notificationError: null,
      };
    case ComicSeriesActionType.DISABLE_NOTIFICATIONS_FOR_SERIES_SUCCESS:
      return {
        ...state,
        userComicData: action.payload.userComicData,
        isNotificationLoading: false,
        notificationError: null,
      };
    case ComicSeriesActionType.DISABLE_NOTIFICATIONS_FOR_SERIES_ERROR:
      return {
        ...state,
        isNotificationLoading: false,
        notificationError: action.payload,
      };

    // Like Management (for individual issues in series page)
    case ComicSeriesActionType.LIKE_COMIC_ISSUE_START:
      return {
        ...state,
        issueLikeLoadingMap: {
          ...state.issueLikeLoadingMap,
          [action.payload.issueUuid]: true,
        },
      };
    case ComicSeriesActionType.LIKE_COMIC_ISSUE_SUCCESS: {
      return {
        ...state,
        userComicData: action.payload.userComicData,
        likeCount: action.payload.likeCount,
        commentCount: action.payload.commentCount,
        issueLikeLoadingMap: {
          ...state.issueLikeLoadingMap,
          [action.payload.issueUuid]: false,
        },
      };
    }
    case ComicSeriesActionType.LIKE_COMIC_ISSUE_ERROR:
      return {
        ...state,
        issueLikeLoadingMap: {
          ...state.issueLikeLoadingMap,
          [action.payload.issueUuid]: false,
        },
      };

    case ComicSeriesActionType.UNLIKE_COMIC_ISSUE_START:
      return {
        ...state,
        issueLikeLoadingMap: {
          ...state.issueLikeLoadingMap,
          [action.payload.issueUuid]: true,
        },
      };
    case ComicSeriesActionType.UNLIKE_COMIC_ISSUE_SUCCESS: {
      return {
        ...state,
        userComicData: action.payload.userComicData,
        likeCount: action.payload.likeCount,
        commentCount: action.payload.commentCount,
        issueLikeLoadingMap: {
          ...state.issueLikeLoadingMap,
          [action.payload.issueUuid]: false,
        },
      };
    }
    case ComicSeriesActionType.UNLIKE_COMIC_ISSUE_ERROR:
      return {
        ...state,
        issueLikeLoadingMap: {
          ...state.issueLikeLoadingMap,
          [action.payload.issueUuid]: false,
        },
      };

    default:
      return state;
  }
}