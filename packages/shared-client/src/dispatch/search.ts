import { ApolloClient } from '@apollo/client';
import type { Dispatch } from 'react';
import { mergeItemsWithUuid } from './utils.js';
import { type SearchQuery, type SearchQueryVariables, Search, type ComicSeries, type Genre } from "../graphql/operations.js";

/* Action Type Enum */
export enum SearchActionType {
  SEARCH_START = 'SEARCH_START',
  SEARCH_SUCCESS = 'SEARCH_SUCCESS',
  SEARCH_ERROR = 'SEARCH_ERROR',
  CLEAR_SEARCH = 'CLEAR_SEARCH',
}

/* Action Types */
export type SearchAction =
  // Search Operations
  | { type: SearchActionType.SEARCH_START; payload: { page: number; isLoadingMore: boolean; requestId: number } }
  | { type: SearchActionType.SEARCH_SUCCESS; payload: SearchLoaderData; meta: { page: number; requestId: number } }
  | { type: SearchActionType.SEARCH_ERROR; payload: string; meta: { requestId: number } }
  | { type: SearchActionType.CLEAR_SEARCH }

export type SearchLoaderData = {
  isSearchLoading: boolean;
  isLoadingMore: boolean;
  searchResults: ComicSeries[];
  searchId: string;
  latestRequestId: number; // Track the latest request ID
};

export const searchInitialState: SearchLoaderData = {
  isSearchLoading: false,
  isLoadingMore: false,
  searchResults: [],
  searchId: '',
  latestRequestId: 0,
}

/* Action Creators */
interface SearchProps {
  publicClient: ApolloClient;
  term: string;
  page?: number;
  limitPerPage?: number;
  filterForTypes?: string[];
  filterForTags?: string[];
  filterForGenres?: Genre[];
  isLoadingMore?: boolean;
  forceRefresh?: boolean;
}

// Debounce utility
let searchDebounceTimer: NodeJS.Timeout | null = null;
let currentRequestId = 0;

// Debounced search function that shows loading state immediately
export function debouncedSearchComics(
  props: SearchProps,
  dispatch: Dispatch<SearchAction>,
  debounceMs: number = 300
): void {
  const { isLoadingMore = false, page = 1 } = props;
  
  // Generate a new request ID
  const requestId = ++currentRequestId;
  
  // Dispatch loading state immediately with the request ID
  dispatch({ 
    type: SearchActionType.SEARCH_START, 
    payload: { page, isLoadingMore, requestId } 
  });
  
  // Clear any existing timer
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer);
  }
  
  // Set a new timer for the actual API call
  searchDebounceTimer = setTimeout(() => {
    // Pass the request ID to searchComics
    searchComics({ ...props, requestId }, dispatch);
  }, debounceMs);
}

export async function searchComics(
  { 
    publicClient, 
    term, 
    page = 1, 
    limitPerPage = 20, 
    filterForTypes = ["COMICSERIES"],
    filterForTags,
    filterForGenres,
    isLoadingMore = false,
    forceRefresh = false,
    requestId, // Don't provide a default value here
  }: SearchProps & { requestId?: number },
  dispatch?: Dispatch<SearchAction>
): Promise<SearchLoaderData | null> {
  
  // Generate a new request ID if one wasn't provided
  // This ensures direct calls to searchComics also get proper request tracking
  const searchRequestId = requestId || ++currentRequestId;
  
  if (dispatch) {
    dispatch({ 
      type: SearchActionType.SEARCH_START, 
      payload: { page, isLoadingMore, requestId: searchRequestId } 
    });
  }

  // add a small delay to test the loading state
  // await new Promise(resolve => setTimeout(resolve, 3000));

  try {
    // Execute the search query
    const searchResult = await publicClient.query<SearchQuery, SearchQueryVariables>({
      query: Search,
      variables: { 
        term,
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

    const parsedData = parseSearchResults(searchResult.data);

    if (dispatch) {
      // Include the request ID in the success action metadata
      dispatch({ 
        type: SearchActionType.SEARCH_SUCCESS, 
        payload: parsedData, 
        meta: { page, requestId: searchRequestId } 
      });
    }
    
    return parsedData;
  } catch (error: any) {
    const errorMessage = error?.response?.data?.error || 
                        error?.message || 
                        'Failed to search comics';
    
    if (dispatch) {
      // Include the request ID in the error action metadata
      dispatch({ 
        type: SearchActionType.SEARCH_ERROR, 
        payload: errorMessage, 
        meta: { requestId: searchRequestId } 
      });
    }
    return null;
  }
}

export function parseSearchResults(data: SearchQuery): SearchLoaderData {
  return {
    isSearchLoading: false,
    isLoadingMore: false,
    searchResults: data.search?.comicSeries?.filter(Boolean) as ComicSeries[] || [],
    searchId: data.search?.searchId || '',
    latestRequestId: 0, // Initialize with 0
  };
}

/* Reducer */
export function searchReducer(
  state: SearchLoaderData = searchInitialState,
  action: SearchAction
): SearchLoaderData {
  switch (action.type) {
    case SearchActionType.SEARCH_START:
      const { isLoadingMore, requestId } = action.payload;
      
      // Only update state if this is a newer request
      if (requestId < state.latestRequestId) {
        return state; // Ignore older requests
      }
      
      return {
        ...state,
        isSearchLoading: !isLoadingMore,
        isLoadingMore: isLoadingMore,
        latestRequestId: requestId, // Store the latest request ID
      };
      
    case SearchActionType.SEARCH_SUCCESS:
      const isPaginationRequest = action.meta.page > 1;
      const successRequestId = action.meta.requestId;
      
      // Ignore results from older requests
      if (successRequestId < state.latestRequestId) {
        return state;
      }

      // For pagination, append new results to existing ones
      if (isPaginationRequest) {
        return {
          ...state,
          ...action.payload,
          searchResults: mergeItemsWithUuid(state.searchResults, action.payload.searchResults),
          isSearchLoading: false,
          isLoadingMore: false,
          latestRequestId: successRequestId, // Update the latest request ID
        };
      } 
      
      // For new searches, replace the results
      return {
        ...state,
        ...action.payload,
        isSearchLoading: false,
        isLoadingMore: false,
        latestRequestId: successRequestId, // Update the latest request ID
      };
      
    case SearchActionType.SEARCH_ERROR:
      const failureRequestId = action.meta.requestId;
      
      // Ignore errors from older requests
      if (failureRequestId < state.latestRequestId) {
        return state;
      }
      
      return {
        ...state,
        isSearchLoading: false,
        isLoadingMore: false,
        // Keep the latest request ID
      };
      
    case SearchActionType.CLEAR_SEARCH:
      return {
        ...searchInitialState,
        latestRequestId: state.latestRequestId, // Preserve request ID
      };
      
    default:
      return state;
  }
}