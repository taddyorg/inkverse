import { ApolloClient } from '@apollo/client';
import type { Dispatch } from 'react';
import { HomeScreen, GetTrendingComicSeries, TrendingMetric, TrendingPeriod, type ComicSeries, type HomeScreenQuery, type List, type GetTrendingComicSeriesQuery, type GetTrendingComicSeriesQueryVariables } from "../graphql/operations.js";

export const TRENDING_LIMIT_PER_PAGE = 25;

export const trendingMetricOptions = [
  { value: TrendingMetric.LIKED, label: 'Liked' },
  { value: TrendingMetric.DISCUSSED, label: 'Discussed' },
];

export const trendingPeriodOptions = [
  { value: TrendingPeriod.WEEK, label: 'This Week' },
  { value: TrendingPeriod.MONTH, label: 'This Month' },
  { value: TrendingPeriod.YEAR, label: 'This Year' },
];

export const trendingMetricTitles: Record<string, string> = {
  [TrendingMetric.LIKED]: 'Most Liked Comics',
  [TrendingMetric.DISCUSSED]: 'Most Discussed Comics',
};

export const trendingPeriodStringToEnum: Record<string, string> = {
  'this-week': TrendingPeriod.WEEK,
  'this-month': TrendingPeriod.MONTH,
  'this-year': TrendingPeriod.YEAR,
};

/* Action Type Enum */
export enum HomefeedActionType {
  GET_HOMESCREEN_START = 'GET_HOMESCREEN_START',
  GET_HOMESCREEN_SUCCESS = 'GET_HOMESCREEN_SUCCESS',
  GET_HOMESCREEN_ERROR = 'GET_HOMESCREEN_ERROR',
}

/* Action Types */
export type HomefeedAction =
  // Homescreen Loading
  | { type: HomefeedActionType.GET_HOMESCREEN_START }
  | { type: HomefeedActionType.GET_HOMESCREEN_SUCCESS; payload: HomeScreenLoaderData }
  | { type: HomefeedActionType.GET_HOMESCREEN_ERROR; payload: string }

export type HomeScreenLoaderData = {
  isHomeScreenLoading: boolean;
  featuredComicSeries: ComicSeries[] | null | undefined;
  curatedLists: List[] | null | undefined;
  recentlyAddedComicSeries: ComicSeries[] | null | undefined;
  recentlyUpdatedComicSeries: ComicSeries[] | null | undefined;
  error?: string | null;
};

export const homeScreenInitialState: HomeScreenLoaderData = {
  isHomeScreenLoading: false,
  featuredComicSeries: [],
  curatedLists: [],
  recentlyAddedComicSeries: [],
  recentlyUpdatedComicSeries: [],
  error: null,
}

/* Action Creators */
interface GetHomeScreenProps {
  publicClient: ApolloClient;
  forceRefresh?: boolean;
}

export async function loadHomeScreen(
  { publicClient, forceRefresh = false }: GetHomeScreenProps,
  dispatch?: Dispatch<HomefeedAction>
): Promise<HomeScreenLoaderData | null> {
  if (dispatch) dispatch({ type: HomefeedActionType.GET_HOMESCREEN_START });

  try {
    const result = await publicClient.query<HomeScreenQuery>({
      query: HomeScreen,
      ...(!!forceRefresh && { fetchPolicy: 'network-only' })
    });
    
    const data = parseLoaderHomeScreen(result?.data);
    
    if (dispatch) {
      dispatch({ 
        type: HomefeedActionType.GET_HOMESCREEN_SUCCESS, 
        payload: data 
      });
    }
    
    return data;
  } catch (error: any) {
    const errorMessage = error?.response?.data?.error || 
                        error?.message || 
                        'Failed to load home screen';
    
    if (dispatch) {
      dispatch({ 
        type: HomefeedActionType.GET_HOMESCREEN_ERROR, 
        payload: errorMessage 
      });
    }
    return null;
  }
}

export function parseLoaderHomeScreen(data: HomeScreenQuery | undefined): HomeScreenLoaderData {
  const featuredSeries = data?.getFeaturedComicSeries?.comicSeries?.filter(
    (series): series is ComicSeries => series !== null
  );

  const randomIndex = featuredSeries?.length ? Math.floor(Math.random() * featuredSeries.length) : -1;
  const randomSeries = randomIndex !== -1 && featuredSeries ? featuredSeries[randomIndex] : undefined;
  const randomFeaturedSeries = randomSeries ? [randomSeries] : [];

  return {
    isHomeScreenLoading: false,
    featuredComicSeries: randomFeaturedSeries,
    curatedLists: data?.getCuratedLists?.lists?.filter((list): list is List => list !== null) || [],
    recentlyAddedComicSeries: data?.getRecentlyAddedComicSeries?.comicSeries?.filter(
      (series): series is ComicSeries => series !== null) || [],
    recentlyUpdatedComicSeries: data?.getRecentlyUpdatedComicSeries?.comicSeries?.filter(
      (series): series is ComicSeries => series !== null) || [],
  };
}

export async function loadTrendingComicSeries(
  { publicClient, metric, period, page = 1, limitPerPage = 6 }: { publicClient: ApolloClient; metric: string; period: string; page?: number; limitPerPage?: number }
): Promise<ComicSeries[] | null> {
  try {
    const result = await publicClient.query<GetTrendingComicSeriesQuery, GetTrendingComicSeriesQueryVariables>({
      query: GetTrendingComicSeries,
      variables: { metric: metric as GetTrendingComicSeriesQueryVariables['metric'], period: period as GetTrendingComicSeriesQueryVariables['period'], limitPerPage, page },
    });

    const series = result?.data?.getTrendingComicSeries?.comicSeries?.filter(
      (series): series is ComicSeries => series !== null
    );

    return series || null;
  } catch (error) {
    return null;
  }
}

/* Trending Action Type Enum */
export enum TrendingActionType {
  LOAD_MORE_START = 'TRENDING_LOAD_MORE_START',
  LOAD_MORE_SUCCESS = 'TRENDING_LOAD_MORE_SUCCESS',
  LOAD_MORE_ERROR = 'TRENDING_LOAD_MORE_ERROR',
}

/* Trending Action Types */
export type TrendingAction =
  | { type: TrendingActionType.LOAD_MORE_START }
  | { type: TrendingActionType.LOAD_MORE_SUCCESS; payload: { comicSeries: ComicSeries[]; limitPerPage: number } }
  | { type: TrendingActionType.LOAD_MORE_ERROR }

/* Trending Page State */
export type TrendingPageState = {
  comicSeries: ComicSeries[];
  page: number;
  isLoadingMore: boolean;
  hasMore: boolean;
  metric: string;
  period: string;
  limitPerPage: number;
};

/* Trending Initial State Factory */
export function makeTrendingInitialState(params: {
  metric: string;
  period: string;
  comicSeries?: ComicSeries[];
  limitPerPage?: number;
}): TrendingPageState {
  const { metric, period, comicSeries = [], limitPerPage = TRENDING_LIMIT_PER_PAGE } = params;
  return {
    comicSeries,
    page: 1,
    isLoadingMore: false,
    hasMore: comicSeries.length >= limitPerPage,
    metric,
    period,
    limitPerPage,
  };
}

/* Trending Reducer */
export function trendingReducer(
  state: TrendingPageState,
  action: TrendingAction
): TrendingPageState {
  switch (action.type) {
    case TrendingActionType.LOAD_MORE_START:
      return { ...state, isLoadingMore: true };
    case TrendingActionType.LOAD_MORE_SUCCESS: {
      const { comicSeries: newSeries, limitPerPage } = action.payload;
      return {
        ...state,
        comicSeries: [...state.comicSeries, ...newSeries],
        page: state.page + 1,
        isLoadingMore: false,
        hasMore: newSeries.length >= limitPerPage,
      };
    }
    case TrendingActionType.LOAD_MORE_ERROR:
      return { ...state, isLoadingMore: false, hasMore: false };
    default:
      return state;
  }
}

/* Trending Dispatch */
interface LoadMoreTrendingProps {
  publicClient: ApolloClient;
  state: TrendingPageState;
}

export async function loadMoreTrending(
  { publicClient, state }: LoadMoreTrendingProps,
  dispatch: Dispatch<TrendingAction>
): Promise<void> {
  dispatch({ type: TrendingActionType.LOAD_MORE_START });

  const result = await loadTrendingComicSeries({
    publicClient,
    metric: state.metric,
    period: trendingPeriodStringToEnum[state.period] || state.period,
    page: state.page + 1,
    limitPerPage: state.limitPerPage,
  });

  if (result && result.length > 0) {
    dispatch({
      type: TrendingActionType.LOAD_MORE_SUCCESS,
      payload: { comicSeries: result, limitPerPage: state.limitPerPage },
    });
  } else {
    dispatch({ type: TrendingActionType.LOAD_MORE_ERROR });
  }
}

/* Reducer */
export function homefeedReducer(
  state: HomeScreenLoaderData = homeScreenInitialState,
  action: HomefeedAction
): HomeScreenLoaderData {
  switch (action.type) {
    case HomefeedActionType.GET_HOMESCREEN_START:
      return {
        ...state,
        isHomeScreenLoading: true,
        error: null,
      };
    case HomefeedActionType.GET_HOMESCREEN_SUCCESS:
      return {
        ...state,
        ...action.payload,
        isHomeScreenLoading: false,
        error: null,
      };
    case HomefeedActionType.GET_HOMESCREEN_ERROR:
      return {
        ...state,
        isHomeScreenLoading: false,
        error: action.payload,
      };
    default:
      return state;
  }
}