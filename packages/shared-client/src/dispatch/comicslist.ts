import type { ApolloClient } from '@apollo/client';
import type { Dispatch } from 'react';
import { mergeItemsWithUuid } from './utils.js';
import { type SearchQuery, type SearchQueryVariables, type ComicSeries, type Genre, Search } from "../graphql/operations.js";

/* Action Type Enum */
export enum ComicsListActionType {
  // Comics List Loading
  COMICS_LIST_START = 'COMICS_LIST_START',
  COMICS_LIST_SUCCESS = 'COMICS_LIST_SUCCESS',
  COMICS_LIST_ERROR = 'COMICS_LIST_ERROR',
}

/* Action Types */
export type ComicsListAction =
  // Comics List Loading
  | { type: ComicsListActionType.COMICS_LIST_START; payload: { page: number; isLoadingMore: boolean } }
  | { type: ComicsListActionType.COMICS_LIST_SUCCESS; payload: ComicsListLoaderData; meta: { page: number } }
  | { type: ComicsListActionType.COMICS_LIST_ERROR; payload: string }

export type ComicsListLoaderData = {
  isLoading: boolean;
  isLoadingMore: boolean;
  comics: ComicSeries[];
  hasMore: boolean;
  error?: string | null;
};

export const comicsListInitialState: ComicsListLoaderData = {
  isLoading: false,
  isLoadingMore: false,
  comics: [],
  hasMore: false,
  error: null,
}

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

export async function fetchComics(
  { 
    publicClient, 
    page = 1, 
    limitPerPage = 30, 
    filterForTypes = ["COMICSERIES"],
    filterForTags,
    filterForGenres,
    isLoadingMore = false,
    forceRefresh = false,
  }: ComicsListProps,
  dispatch?: Dispatch<ComicsListAction>
): Promise<ComicsListLoaderData | null> {
  
  if (dispatch) {
    dispatch({ 
      type: ComicsListActionType.COMICS_LIST_START, 
      payload: { page, isLoadingMore } 
    });
  }

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

    if (dispatch) {
      // Include the page in the success action metadata
      dispatch({ 
        type: ComicsListActionType.COMICS_LIST_SUCCESS, 
        payload: parsedData, 
        meta: { page } 
      });
    }
    
    return parsedData;
  } catch (error: any) {
    const errorMessage = error?.response?.data?.error || 
                        error?.message || 
                        'Failed to fetch comics';
    
    if (dispatch) {
      dispatch({ 
        type: ComicsListActionType.COMICS_LIST_ERROR, 
        payload: errorMessage 
      });
    }
    return null;
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

/* Reducer */
export function comicsListReducer(
  state: ComicsListLoaderData = comicsListInitialState,
  action: ComicsListAction
): ComicsListLoaderData {
  switch (action.type) {
    case ComicsListActionType.COMICS_LIST_START:
      const { isLoadingMore } = action.payload;
      
      return {
        ...state,
        isLoading: !isLoadingMore,
        isLoadingMore: isLoadingMore,
        error: null,
      };
      
    case ComicsListActionType.COMICS_LIST_SUCCESS:
      const isPaginationRequest = action.meta.page > 1;

      // For pagination, append new results to existing ones
      if (isPaginationRequest) {
        return {
          ...state,
          ...action.payload,
          comics: mergeItemsWithUuid(state.comics, action.payload.comics),
          isLoading: false,
          isLoadingMore: false,
          error: null,
        };
      } 
      
      // For new searches, replace the results
      return {
        ...state,
        ...action.payload,
        isLoading: false,
        isLoadingMore: false,
        error: null,
      };
      
    case ComicsListActionType.COMICS_LIST_ERROR:
      return {
        ...state,
        isLoading: false,
        isLoadingMore: false,
        error: action.payload,
      };

    default:
      return state;
  }
}

// Legacy reducer for backwards compatibility - use comicsListReducer instead
export const comicsListReducerDefault = comicsListReducer;