import type { ApolloClient } from '@apollo/client';
import { asyncAction, ActionTypes, errorHandlerFactory, type Dispatch, type Action, mergeItemsWithUuid } from './utils.js';
import { type SearchQuery, type SearchQueryVariables, Search } from "../graphql/operations.js";
import type { ComicSeries, Genre } from "../graphql/types.js";

/* Actions */
export const SEARCH = asyncAction(ActionTypes.SEARCH);

/* Action Creators */
interface SearchProps {
  publicClient: ApolloClient<any>;
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
export function debouncedSearchComics(props: SearchProps, dispatch: Dispatch, debounceMs: number = 300) {
  const { isLoadingMore = false, page = 1 } = props;
  
  // Generate a new request ID
  const requestId = ++currentRequestId;
  
  // Dispatch loading state immediately with the request ID
  dispatch(SEARCH.request({ page, isLoadingMore, requestId }));
  
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

export async function searchComics({ 
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
}: SearchProps & { requestId?: number }, dispatch: Dispatch) {
  
  // Generate a new request ID if one wasn't provided
  // This ensures direct calls to searchComics also get proper request tracking
  const searchRequestId = requestId || ++currentRequestId;
  
  dispatch(SEARCH.request({ page, isLoadingMore, requestId: searchRequestId }));

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

    // Include the request ID in the success action metadata
    dispatch(SEARCH.success(parsedData, { page, requestId: searchRequestId }));
  } catch (error: Error | unknown) {
    // Include the request ID in the error action metadata
    errorHandlerFactory(dispatch, SEARCH)(error);
    // Manually dispatch with the request ID in meta
    dispatch(SEARCH.failure(error, { requestId: searchRequestId }));
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

export type SearchLoaderData = {
  isSearchLoading: boolean;
  isLoadingMore: boolean;
  searchResults: ComicSeries[];
  searchId: string;
  latestRequestId: number; // Track the latest request ID
  apolloState?: Record<string, any>;
};

export const searchInitialState: SearchLoaderData = {
  isSearchLoading: false,
  isLoadingMore: false,
  searchResults: [],
  searchId: '',
  latestRequestId: 0,
}

/* Reducers */
export function searchQueryReducerDefault(state = searchInitialState, action: Action): SearchLoaderData {
  switch (action.type) {
    case SEARCH.REQUEST:
      const isLoadingMore = !!action.payload?.isLoadingMore;
      const requestId = action.payload?.requestId || 0;
      
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
      
    case SEARCH.SUCCESS:
      const isPaginationRequest = action.meta?.page && action.meta.page > 1;
      const successRequestId = action.meta?.requestId || 0;
      
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
      
    case SEARCH.FAILURE:
      const failureRequestId = action.meta?.requestId || 0;
      
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
      
    default:
      return state;
  }
}

export const searchQueryReducer = (state: SearchLoaderData, action: Action) => searchQueryReducerDefault(state, action); 