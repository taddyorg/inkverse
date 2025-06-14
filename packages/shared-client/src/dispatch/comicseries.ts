import type { ApolloClient, ApolloQueryResult } from '@apollo/client';
import { asyncAction, ActionTypes, errorHandlerFactory, type Dispatch, type Action } from './utils.js';
import { type GetComicSeriesQuery, type GetComicSeriesQueryVariables, SortOrder, GetComicSeries, type ComicIssue, type ComicSeries, GetMiniComicSeries, type GetMiniComicSeriesQuery, type GetMiniComicSeriesQueryVariables, type GetUserComicDataQuery, type GetUserComicDataQueryVariables, GetUserComicData, type SubscribeToSeriesMutation, type SubscribeToSeriesMutationVariables, SubscribeToSeries, type UnsubscribeFromSeriesMutation, type UnsubscribeFromSeriesMutationVariables, UnsubscribeFromSeries } from "../graphql/operations.js";

/* Actions */
export const GET_COMICSERIES = asyncAction(ActionTypes.GET_COMICSERIES);
export const GET_USER_COMIC_DATA = asyncAction(ActionTypes.GET_USER_COMIC_DATA);
export const SUBSCRIBE_TO_SERIES = asyncAction(ActionTypes.SUBSCRIBE_TO_SERIES);
export const UNSUBSCRIBE_FROM_SERIES = asyncAction(ActionTypes.UNSUBSCRIBE_FROM_SERIES);

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

export async function loadUserComicData({ userClient, seriesUuid, forceRefresh = false }: GetUserComicDataProps, dispatch: Dispatch) {
  dispatch(GET_USER_COMIC_DATA.request());

  try {
    const result = await userClient.query<GetUserComicDataQuery, GetUserComicDataQueryVariables>({
      query: GetUserComicData,
      variables: { seriesUuid },
      ...(!!forceRefresh && { fetchPolicy: 'network-only' })
    });

    const userComicData = result.data?.userComicSeriesData ? {
      isSubscribed: result.data.userComicSeriesData.isSubscribed,
      isRecommended: result.data.userComicSeriesData.isRecommended,
    } : null;

    dispatch(GET_USER_COMIC_DATA.success({ userComicData }));
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
        userComicData: { isSubscribed: true } 
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
        userComicData: { isSubscribed: false } 
      }));
    } else {
      throw new Error('Failed to unsubscribe from series');
    }
  } catch (error: Error | unknown) {
    errorHandlerFactory(dispatch, UNSUBSCRIBE_FROM_SERIES)(error);
  }
}

export function parseLoaderComicSeries(data: GetComicSeriesQuery): ComicSeriesLoaderData {
  return {
    isComicSeriesLoading: false,
    comicseries: data.getComicSeries || null,
    issues: data.getIssuesForComicSeries?.issues?.filter(
      (issue: ComicIssue | null): issue is ComicIssue => issue !== null
    ) || [],
    userComicData: null,
    isUserDataLoading: false,
    userDataError: null,
    isSubscriptionLoading: false,
    subscriptionError: null,
  };
}

export type ComicSeriesLoaderData = {
  isComicSeriesLoading: boolean;
  comicseries: ComicSeries | null;
  issues: ComicIssue[];
  userComicData: {
    isSubscribed: boolean;
    isRecommended: boolean;
  } | null;
  isUserDataLoading: boolean;
  userDataError: string | null;
  isSubscriptionLoading: boolean;
  subscriptionError: string | null;
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
    default:
      return state;
  }
}

export const comicSeriesQueryReducer = (state: ComicSeriesLoaderData, action: Action) => comicSeriesQueryReducerDefault(state, action); 