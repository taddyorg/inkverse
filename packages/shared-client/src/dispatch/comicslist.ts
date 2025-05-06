import type { ApolloClient } from '@apollo/client';
import { asyncAction, ActionTypes, errorHandlerFactory, type Dispatch, type Action, mergeItemsWithUuid } from './utils.js';
import { type SearchQuery, type SearchQueryVariables, Search } from "../graphql/operations.js";
import type { ComicSeries, Genre } from "../graphql/types.js";

/* Actions */
export const COMICS_LIST = asyncAction(ActionTypes.COMICS_LIST);

/* Action Creators */
interface ComicsListProps {
  publicClient: ApolloClient<any>;
  page?: number;
  limitPerPage?: number;
  filterForTypes?: string[];
  filterForTags?: string[];
  filterForGenres?: Genre[];
  isLoadingMore?: boolean;
  forceRefresh?: boolean;
}

export async function fetchComics({ 
  publicClient, 
  page = 1, 
  limitPerPage = 30, 
  filterForTypes = ["COMICSERIES"],
  filterForTags,
  filterForGenres,
  isLoadingMore = false,
  forceRefresh = false,
}: ComicsListProps, dispatch: Dispatch) {
  
  dispatch(COMICS_LIST.request({ page, isLoadingMore }));

  try {
    // Execute the search query
    const searchResult = await publicClient.query<SearchQuery, SearchQueryVariables>({
      query: Search,
      variables: { 
        term: '', // Empty term as we're filtering by tag/genre
        page,
        limitPerPage,
        filterForTypes,
        filterForTags,
        filterForGenres
      },
      ...(!!forceRefresh && { fetchPolicy: 'network-only' })
    });

    if (!searchResult.data?.search) {
      throw new Error("Search data not found");
    }

    const parsedData = parseComicsListResults(searchResult.data, limitPerPage);

    // Include the page in the success action metadata
    dispatch(COMICS_LIST.success(parsedData, { page }));
  } catch (error: Error | unknown) {
    // Handle error
    errorHandlerFactory(dispatch, COMICS_LIST)(error);
    dispatch(COMICS_LIST.failure(error));
  }
}

export function parseComicsListResults(data: SearchQuery, limitPerPage: number): ComicsListLoaderData {
  const comics = data.search?.comicSeries?.filter(Boolean) as ComicSeries[] || [];
  const hasMore = comics.length === limitPerPage;
  
  return {
    isLoading: false,
    isLoadingMore: false,
    comics,
    hasMore,
  };
}

export type ComicsListLoaderData = {
  isLoading: boolean;
  isLoadingMore: boolean;
  comics: ComicSeries[];
  hasMore: boolean;
};

export const comicsListInitialState: ComicsListLoaderData = {
  isLoading: false,
  isLoadingMore: false,
  comics: [],
  hasMore: false,
}

/* Reducers */
export function comicsListReducerDefault(state = comicsListInitialState, action: Action): ComicsListLoaderData {
  switch (action.type) {
    case COMICS_LIST.REQUEST:
      const isLoadingMore = !!action.payload?.isLoadingMore;
      
      return {
        ...state,
        isLoading: !isLoadingMore,
        isLoadingMore: isLoadingMore,
      };
      
    case COMICS_LIST.SUCCESS:
      const isPaginationRequest = action.meta?.page && action.meta.page > 1;

      // For pagination, append new results to existing ones
      if (isPaginationRequest) {
        return {
          ...state,
          ...action.payload,
          comics: mergeItemsWithUuid(state.comics, action.payload.comics),
          isLoading: false,
          isLoadingMore: false,
        };
      } 
      
      // For new searches, replace the results
      return {
        ...state,
        ...action.payload,
        isLoading: false,
        isLoadingMore: false,
      };
      
    case COMICS_LIST.FAILURE:
      return {
        ...state,
        isLoading: false,
        isLoadingMore: false,
      };
        
    default:
      return state;
  }
}

export const comicsListReducer = (state: ComicsListLoaderData, action: Action) => comicsListReducerDefault(state, action);