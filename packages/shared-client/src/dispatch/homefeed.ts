import { ApolloClient } from '@apollo/client';
import type { Dispatch } from 'react';
import { HomeScreen, type ComicSeries, type HomeScreenQuery, type List } from "../graphql/operations.js";

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
  mostPopularComicSeries: ComicSeries[] | null | undefined;
  recentlyAddedComicSeries: ComicSeries[] | null | undefined;
  recentlyUpdatedComicSeries: ComicSeries[] | null | undefined;
  error?: string | null;
};

export const homeScreenInitialState: HomeScreenLoaderData = {
  isHomeScreenLoading: false,
  featuredComicSeries: [],
  curatedLists: [],
  mostPopularComicSeries: [],
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

  const mostPopularSeries = data?.getMostPopularComicSeries?.comicSeries?.filter(
    (series): series is ComicSeries => series !== null
  );

  return {
    isHomeScreenLoading: false,
    featuredComicSeries: randomFeaturedSeries,
    curatedLists: data?.getCuratedLists?.lists?.filter((list): list is List => list !== null) || [],
    mostPopularComicSeries: shuffleAndLimitMostPopular(mostPopularSeries),
    recentlyAddedComicSeries: data?.getRecentlyAddedComicSeries?.comicSeries?.filter(
      (series): series is ComicSeries => series !== null) || [],
    recentlyUpdatedComicSeries: data?.getRecentlyUpdatedComicSeries?.comicSeries?.filter(
      (series): series is ComicSeries => series !== null) || [],
  };
}

function shuffleAndLimitMostPopular(series: ComicSeries[] | null | undefined, limit = 6) {
  if (!series?.length) return [];
  return [...series]
    .filter(Boolean)
    .sort(() => Math.random() - 0.5)
    .slice(0, limit);
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