import type { ApolloClient, ApolloQueryResult } from '@apollo/client';
import { asyncAction, ActionTypes, errorHandlerFactory, type Dispatch, type Action } from './utils.js';
import { type GetComicSeriesQuery, type GetComicSeriesQueryVariables, SortOrder, GetComicSeries, type ComicIssue, type ComicSeries, GetMiniComicSeries, type GetMiniComicSeriesQuery, type GetMiniComicSeriesQueryVariables, type SubscribeToSeriesMutation, type SubscribeToSeriesMutationVariables, SubscribeToSeries, type UnsubscribeFromSeriesMutation, type UnsubscribeFromSeriesMutationVariables, UnsubscribeFromSeries, GetUserComicSeries, type GetUserComicSeriesQuery, type GetUserComicSeriesQueryVariables, type EnableNotificationsForSeriesMutation, type EnableNotificationsForSeriesMutationVariables, EnableNotificationsForSeries, type DisableNotificationsForSeriesMutation, type DisableNotificationsForSeriesMutationVariables, DisableNotificationsForSeries } from "../graphql/operations.js";

/* Actions */
export const GET_COMICSERIES = asyncAction(ActionTypes.GET_COMICSERIES);
export const GET_USER_COMIC_DATA = asyncAction(ActionTypes.GET_USER_COMIC_DATA);
export const SUBSCRIBE_TO_SERIES = asyncAction(ActionTypes.SUBSCRIBE_TO_SERIES);
export const UNSUBSCRIBE_FROM_SERIES = asyncAction(ActionTypes.UNSUBSCRIBE_FROM_SERIES);
export const ENABLE_NOTIFICATIONS_FOR_SERIES = asyncAction(ActionTypes.ENABLE_NOTIFICATIONS_FOR_SERIES);
export const DISABLE_NOTIFICATIONS_FOR_SERIES = asyncAction(ActionTypes.DISABLE_NOTIFICATIONS_FOR_SERIES);

export type ComicSeriesLoaderData = {
  isComicSeriesLoading: boolean;
  comicseries: ComicSeries | null;
  issues: ComicIssue[];
  userComicData: {
    isSubscribed: boolean;
    isRecommended: boolean;
    hasNotificationEnabled: boolean;
  } | null;
  isUserDataLoading: boolean;
  userDataError: string | null;
  isSubscriptionLoading: boolean;
  subscriptionError: string | null;
  isNotificationLoading: boolean;
  notificationError: string | null;
  apolloState?: Record<string, any>;
};

export const comicSeriesInitialState: ComicSeriesLoaderData = {
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
}

/* Action Creators */
interface GetComicSeriesProps {
  publicClient: ApolloClient<any>;
  uuid: string;
  forceRefresh?: boolean;
}

/* Action Creators */
interface WrappedGetComicSeriesProps {
  publicClient: ApolloClient<any>;
  shortUrl: string;
}

/* User Comic Data Actions */
interface GetUserComicDataProps {
  userClient: ApolloClient<any>;
  seriesUuid: string;
  forceRefresh?: boolean;
}

interface SubscribeToSeriesProps {
  userClient: ApolloClient<any>;
  seriesUuid: string;
}

interface UnsubscribeFromSeriesProps {
  userClient: ApolloClient<any>;
  seriesUuid: string;
}

/* Notification Actions */
interface EnableNotificationsProps {
  userClient: ApolloClient<any>;
  seriesUuid: string;
}

interface DisableNotificationsProps {
  userClient: ApolloClient<any>;
  seriesUuid: string;
}

export async function loadComicSeriesUrl({ publicClient, shortUrl }: WrappedGetComicSeriesProps, dispatch: Dispatch) {
  dispatch(GET_COMICSERIES.request());

  try {
    // Then get the full comic series data
    const getComicSeriesUuid: ApolloQueryResult<GetMiniComicSeriesQuery> = await publicClient.query<GetMiniComicSeriesQuery, GetMiniComicSeriesQueryVariables>({
      query: GetMiniComicSeries,
      variables: { shortUrl },
    });
    
    if (!getComicSeriesUuid.data?.getComicSeries?.uuid) {
      throw new Response("Not Found", { status: 404 });
    }

    const parsedData = parseLoaderComicSeries(getComicSeriesUuid.data);

    dispatch(GET_COMICSERIES.success(parsedData));
  } catch (error: Error | unknown) {
    errorHandlerFactory(dispatch, GET_COMICSERIES)(error);
  }
}

export async function loadComicSeries({ publicClient, uuid, forceRefresh = false }: GetComicSeriesProps, dispatch: Dispatch) {
  dispatch(GET_COMICSERIES.request());

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

    dispatch(GET_COMICSERIES.success(parsedData));
  } catch (error: Error | unknown) {
    errorHandlerFactory(dispatch, GET_COMICSERIES)(error);
  }
}

export async function loadUserComicData({ userClient, seriesUuid, forceRefresh = false }: GetUserComicDataProps, dispatch: Dispatch) {
  dispatch(GET_USER_COMIC_DATA.request());

  try {
    const result = await userClient.query<GetUserComicSeriesQuery, GetUserComicSeriesQueryVariables>({
      query: GetUserComicSeries,
      variables: { seriesUuid },
      ...(!!forceRefresh && { fetchPolicy: 'network-only' })
    });

    const parsedData = parseLoaderUserComicSeries(result.data);

    dispatch(GET_USER_COMIC_DATA.success(parsedData));
  } catch (error: Error | unknown) {
    errorHandlerFactory(dispatch, GET_USER_COMIC_DATA)(error);
  }
}

export async function subscribeToSeries({ userClient, seriesUuid }: SubscribeToSeriesProps, dispatch: Dispatch) {
  dispatch(SUBSCRIBE_TO_SERIES.request());

  try {
    const result = await userClient.mutate<SubscribeToSeriesMutation, SubscribeToSeriesMutationVariables>({
      mutation: SubscribeToSeries,
      variables: { seriesUuid }
    });

    if (result.data?.subscribeToSeries) {
      dispatch(SUBSCRIBE_TO_SERIES.success({ 
        userComicData: {
          isSubscribed: result.data.subscribeToSeries.isSubscribed,
          isRecommended: result.data.subscribeToSeries.isRecommended,
          hasNotificationEnabled: result.data.subscribeToSeries.hasNotificationEnabled,
        }
      }));
    } else {
      throw new Error('Failed to subscribe to series');
    }
  } catch (error: Error | unknown) {
    errorHandlerFactory(dispatch, SUBSCRIBE_TO_SERIES)(error);
  }
}

export async function unsubscribeFromSeries({ userClient, seriesUuid }: UnsubscribeFromSeriesProps, dispatch: Dispatch) {
  dispatch(UNSUBSCRIBE_FROM_SERIES.request());

  try {
    const result = await userClient.mutate<UnsubscribeFromSeriesMutation, UnsubscribeFromSeriesMutationVariables>({
      mutation: UnsubscribeFromSeries,
      variables: { seriesUuid }
    });

    if (result.data?.unsubscribeFromSeries) {
      dispatch(UNSUBSCRIBE_FROM_SERIES.success({ 
        userComicData: {
          isSubscribed: result.data.unsubscribeFromSeries.isSubscribed,
          isRecommended: result.data.unsubscribeFromSeries.isRecommended,
          hasNotificationEnabled: result.data.unsubscribeFromSeries.hasNotificationEnabled,
        }
      }));
    } else {
      throw new Error('Failed to unsubscribe from series');
    }
  } catch (error: Error | unknown) {
    errorHandlerFactory(dispatch, UNSUBSCRIBE_FROM_SERIES)(error);
  }
}


export async function enableNotificationsForSeries({ userClient, seriesUuid }: EnableNotificationsProps, dispatch: Dispatch) {
  dispatch(ENABLE_NOTIFICATIONS_FOR_SERIES.request());

  try {
    const result = await userClient.mutate<EnableNotificationsForSeriesMutation, EnableNotificationsForSeriesMutationVariables>({
      mutation: EnableNotificationsForSeries,
      variables: { seriesUuid }
    });

    if (result.data?.enableNotificationsForSeries) {
      dispatch(ENABLE_NOTIFICATIONS_FOR_SERIES.success({ 
        userComicData: {
          isSubscribed: result.data.enableNotificationsForSeries.isSubscribed,
          isRecommended: result.data.enableNotificationsForSeries.isRecommended,
          hasNotificationEnabled: result.data.enableNotificationsForSeries.hasNotificationEnabled,
        }
      }));
    } else {
      throw new Error('Failed to enable notifications for series');
    }
  } catch (error: Error | unknown) {
    errorHandlerFactory(dispatch, ENABLE_NOTIFICATIONS_FOR_SERIES)(error);
  }
}

export async function disableNotificationsForSeries({ userClient, seriesUuid }: DisableNotificationsProps, dispatch: Dispatch) {
  dispatch(DISABLE_NOTIFICATIONS_FOR_SERIES.request());

  try {
    const result = await userClient.mutate<DisableNotificationsForSeriesMutation, DisableNotificationsForSeriesMutationVariables>({
      mutation: DisableNotificationsForSeries,
      variables: { seriesUuid }
    });

    if (result.data?.disableNotificationsForSeries) {
      dispatch(DISABLE_NOTIFICATIONS_FOR_SERIES.success({ 
        userComicData: {
          isSubscribed: result.data.disableNotificationsForSeries.isSubscribed,
          isRecommended: result.data.disableNotificationsForSeries.isRecommended,
          hasNotificationEnabled: result.data.disableNotificationsForSeries.hasNotificationEnabled,
        }
      }));
    } else {
      throw new Error('Failed to disable notifications for series');
    }
  } catch (error: Error | unknown) {
    errorHandlerFactory(dispatch, DISABLE_NOTIFICATIONS_FOR_SERIES)(error);
  }
}

export function parseLoaderComicSeries(data: GetComicSeriesQuery): Partial<ComicSeriesLoaderData> {
  return {
    isComicSeriesLoading: false,
    comicseries: data.getComicSeries || null,
    issues: data.getIssuesForComicSeries?.issues?.filter(
      (issue: ComicIssue | null): issue is ComicIssue => issue !== null
    ) || [],
    // Don't include user-related loading states to avoid overwriting them
  };
}

export function parseLoaderUserComicSeries(data: GetUserComicSeriesQuery): Partial<ComicSeriesLoaderData> {
  return {
    isUserDataLoading: false,
    userComicData: data.getUserComicSeries
  };
}

/* Reducers */
export function comicSeriesQueryReducerDefault(state = comicSeriesInitialState, action: Action): ComicSeriesLoaderData {
  switch (action.type) {
    case GET_COMICSERIES.REQUEST:
      return {
        ...state,
        isComicSeriesLoading: true,
      };
    case GET_COMICSERIES.SUCCESS:
      return {
        ...state,
        ...action.payload,
        isComicSeriesLoading: false,
      };
    case GET_USER_COMIC_DATA.REQUEST:
      return {
        ...state,
        isUserDataLoading: true,
        userDataError: null,
      };
    case GET_USER_COMIC_DATA.SUCCESS:
      return {
        ...state,
        ...action.payload,
        isUserDataLoading: false,
        userDataError: null,
      };
    case GET_USER_COMIC_DATA.FAILURE:
      return {
        ...state,
        isUserDataLoading: false,
        userDataError: action.payload?.message || 'Failed to load user comic data',
      };
    case SUBSCRIBE_TO_SERIES.REQUEST:
      return {
        ...state,
        isSubscriptionLoading: true,
        subscriptionError: null,
      };
    case SUBSCRIBE_TO_SERIES.SUCCESS:
      return {
        ...state,
        ...action.payload,
        isSubscriptionLoading: false,
        subscriptionError: null,
      };
    case SUBSCRIBE_TO_SERIES.FAILURE:
      return {
        ...state,
        isSubscriptionLoading: false,
        subscriptionError: action.payload?.message || 'Failed to subscribe to series',
      };
    case UNSUBSCRIBE_FROM_SERIES.REQUEST:
      return {
        ...state,
        isSubscriptionLoading: true,
        subscriptionError: null,
      };
    case UNSUBSCRIBE_FROM_SERIES.SUCCESS:
      return {
        ...state,
        ...action.payload,
        isSubscriptionLoading: false,
        subscriptionError: null,
      };
    case UNSUBSCRIBE_FROM_SERIES.FAILURE:
      return {
        ...state,
        isSubscriptionLoading: false,
        subscriptionError: action.payload?.message || 'Failed to unsubscribe from series',
      };
    case ENABLE_NOTIFICATIONS_FOR_SERIES.REQUEST:
      return {
        ...state,
        isNotificationLoading: true,
        notificationError: null,
      };
    case ENABLE_NOTIFICATIONS_FOR_SERIES.SUCCESS:
      return {
        ...state,
        ...action.payload,
        isNotificationLoading: false,
        notificationError: null,
      };
    case ENABLE_NOTIFICATIONS_FOR_SERIES.FAILURE:
      return {
        ...state,
        isNotificationLoading: false,
        notificationError: action.payload?.message || 'Failed to enable notifications for series',
      };
    case DISABLE_NOTIFICATIONS_FOR_SERIES.REQUEST:
      return {
        ...state,
        isNotificationLoading: true,
        notificationError: null,
      };
    case DISABLE_NOTIFICATIONS_FOR_SERIES.SUCCESS:
      return {
        ...state,
        ...action.payload,
        isNotificationLoading: false,
        notificationError: null,
      };
    case DISABLE_NOTIFICATIONS_FOR_SERIES.FAILURE:
      return {
        ...state,
        isNotificationLoading: false,
        notificationError: action.payload?.message || 'Failed to disable notifications for series',
      };
    default:
      console.log('No matching case for action type:', action.type);
      return state;
  }
}

export const comicSeriesQueryReducer = (state: ComicSeriesLoaderData, action: Action) => comicSeriesQueryReducerDefault(state, action); 