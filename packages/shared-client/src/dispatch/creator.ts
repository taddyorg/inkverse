import { ApolloClient } from '@apollo/client';
import type { Dispatch } from 'react';
import { GetCreator, type GetCreatorQuery, type Creator, type ComicSeries, GetMiniCreator, type GetMiniCreatorQuery, type GetMiniCreatorQueryVariables } from '../graphql/operations.js';

/* Action Type Enum */
export enum CreatorActionType {
  // Creator Loading
  GET_CREATOR_START = 'GET_CREATOR_START',
  GET_CREATOR_SUCCESS = 'GET_CREATOR_SUCCESS',
  GET_CREATOR_ERROR = 'GET_CREATOR_ERROR',
}

/* Action Types */
export type CreatorAction =
  // Creator Loading
  | { type: CreatorActionType.GET_CREATOR_START }
  | { type: CreatorActionType.GET_CREATOR_SUCCESS; payload: CreatorLoaderData }
  | { type: CreatorActionType.GET_CREATOR_ERROR; payload: string }

/* Types */
export type CreatorLoaderData = {
  isLoading: boolean;
  creator: Creator | null;
  comicseries: ComicSeries[] | null;
  error?: string | null;
};

export const creatorInitialState: CreatorLoaderData = {
  isLoading: false,
  creator: null,
  comicseries: null,
  error: null,
};

/* Action Creators */
interface GetCreatorScreenProps {
  publicClient: ApolloClient;
  uuid: string;
  forceRefresh?: boolean;
}

interface WrappedGetCreatorProps {
  publicClient: ApolloClient;
  shortUrl: string;
}

export async function getCreatorScreen(
  { publicClient, uuid, forceRefresh = false }: GetCreatorScreenProps,
  dispatch?: Dispatch<CreatorAction>
): Promise<CreatorLoaderData> {
  if (dispatch) dispatch({ type: CreatorActionType.GET_CREATOR_START });

  try {
    // Get full creator data
    const creatorResult = await publicClient.query<GetCreatorQuery>({
      query: GetCreator,
      variables: { uuid },
      ...(!!forceRefresh && { fetchPolicy: 'network-only' })
    });

    if (!creatorResult.data?.getCreator) {
      throw new Error('Creator not found');
    }

    const parsedData = parseLoaderCreator(creatorResult.data);
    
    if (dispatch) {
      dispatch({ 
        type: CreatorActionType.GET_CREATOR_SUCCESS, 
        payload: parsedData 
      });
    }
    
    return parsedData;
  } catch (error: any) {
    const errorMessage = error?.response?.data?.error || 
                        error?.message || 
                        'Failed to load creator';
    
    if (dispatch) {
      dispatch({ 
        type: CreatorActionType.GET_CREATOR_ERROR, 
        payload: errorMessage 
      });
    }
    throw error;
  }
}

export async function loadCreatorUrl(
  { publicClient, shortUrl }: WrappedGetCreatorProps,
  dispatch?: Dispatch<CreatorAction>
): Promise<CreatorLoaderData> {
  if (dispatch) dispatch({ type: CreatorActionType.GET_CREATOR_START });

  try {
    // Get the creator UUID from shortUrl
    const getCreatorUuid = await publicClient.query<GetMiniCreatorQuery, GetMiniCreatorQueryVariables>({
      query: GetMiniCreator,
      variables: { shortUrl },
    });
    
    if (!getCreatorUuid.data?.getCreator?.uuid) {
      throw new Response("Not Found", { status: 404 });
    }

    const parsedData = parseLoaderCreator(getCreatorUuid.data as GetCreatorQuery);

    if (dispatch) {
      dispatch({ 
        type: CreatorActionType.GET_CREATOR_SUCCESS, 
        payload: parsedData 
      });
    }
    
    return parsedData;
  } catch (error: any) {
    const errorMessage = error?.response?.data?.error || 
                        error?.message || 
                        'Failed to load creator';
    
    if (dispatch) {
      dispatch({ 
        type: CreatorActionType.GET_CREATOR_ERROR, 
        payload: errorMessage 
      });
    }
    throw error;
  }
}

export function parseLoaderCreator(data: GetCreatorQuery): CreatorLoaderData {
  return {
    isLoading: false,
    creator: data.getCreator || null,
    comicseries: data.getCreator?.comics?.filter((comic): comic is ComicSeries => comic !== null) || null,
  };
}

/* Reducer */
export function creatorReducer(
  state: CreatorLoaderData = creatorInitialState,
  action: CreatorAction
): CreatorLoaderData {
  switch (action.type) {
    case CreatorActionType.GET_CREATOR_START:
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case CreatorActionType.GET_CREATOR_SUCCESS:
      return {
        ...state,
        ...action.payload,
        isLoading: false,
        error: null,
      };
    case CreatorActionType.GET_CREATOR_ERROR:
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };
    default:
      return state;
  }
}