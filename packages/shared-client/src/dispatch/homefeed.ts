import type { ApolloClient } from '@apollo/client';
import { asyncAction, ActionTypes, errorHandlerFactory, type Dispatch, type Action } from './utils.js';
import { HomeScreen, type ComicSeries, type HomeScreenQuery, type List } from "../graphql/operations.js";

/* Actions */
export const GET_HOMESCREEN = asyncAction(ActionTypes.GET_HOMEFEED);

/* Action Creators */
interface GetHomeScreenProps {
  publicClient: ApolloClient<any>;
  forceRefresh?: boolean;
}

export async function loadHomeScreen({ publicClient, forceRefresh = false }: GetHomeScreenProps, dispatch: Dispatch) {
  dispatch(GET_HOMESCREEN.request());

  try {
    const result = await publicClient.query<HomeScreenQuery>({
      query: HomeScreen,
      ...(!!forceRefresh && { fetchPolicy: 'network-only' })
    });
    
    const data = parseLoaderHomeScreen(result?.data);
    dispatch(GET_HOMESCREEN.success(data));
  } catch (error: Error | unknown) {
    errorHandlerFactory(dispatch, GET_HOMESCREEN)(error);
  }
}

export function parseLoaderHomeScreen(data: HomeScreenQuery): HomeScreenLoaderData {
  const featuredSeries = data.getFeaturedComicSeries?.comicSeries?.filter(
    (series): series is ComicSeries => series !== null
  );

  const randomIndex = featuredSeries?.length ? Math.floor(Math.random() * featuredSeries.length) : -1;
  const randomSeries = randomIndex !== -1 && featuredSeries ? featuredSeries[randomIndex] : undefined;
  const randomFeaturedSeries = randomSeries ? [randomSeries] : [];

  const mostPopularSeries = data.getMostPopularComicSeries?.comicSeries?.filter(
    (series): series is ComicSeries => series !== null
  );

  return {
    isHomeScreenLoading: false,
    featuredComicSeries: randomFeaturedSeries,
    curatedLists: data.getCuratedLists?.lists?.filter((list): list is List => list !== null) || [],
    mostPopularComicSeries: shuffleAndLimitMostPopular(mostPopularSeries),
    recentlyAddedComicSeries: data.getRecentlyAddedComicSeries?.comicSeries?.filter(
      (series): series is ComicSeries => series !== null) || [],
    recentlyUpdatedComicSeries: data.getRecentlyUpdatedComicSeries?.comicSeries?.filter(
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

export type HomeScreenLoaderData = {
  isHomeScreenLoading: boolean;
  featuredComicSeries: ComicSeries[] | null | undefined;
  curatedLists: List[] | null | undefined;
  mostPopularComicSeries: ComicSeries[] | null | undefined;
  recentlyAddedComicSeries: ComicSeries[] | null | undefined;
  recentlyUpdatedComicSeries: ComicSeries[] | null | undefined;
  apolloState?: Record<string, any>;
};

export const homeScreenInitialState: HomeScreenLoaderData = {
  isHomeScreenLoading: false,
  featuredComicSeries: [],
  curatedLists: [],
  mostPopularComicSeries: [],
  recentlyAddedComicSeries: [],
  recentlyUpdatedComicSeries: [],
}

/* Reducers */
export function homefeedQueryReducerDefault(state = homeScreenInitialState, action: Action): HomeScreenLoaderData {
  switch (action.type) {
    case GET_HOMESCREEN.REQUEST:
      return {
        ...state,
        isHomeScreenLoading: true,
      };
    case GET_HOMESCREEN.SUCCESS:
      return {
        ...state,
        ...action.payload,
        isHomeScreenLoading: false,
      };
    default:
      return state;
  }
}

export const homefeedQueryReducer = (state: HomeScreenLoaderData, action: Action) => homefeedQueryReducerDefault(state, action);