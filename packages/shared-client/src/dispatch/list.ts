import { ApolloClient } from '@apollo/client';
import type { Dispatch } from 'react';
import { type GetListQuery, type GetListQueryVariables, GetList, type List } from "../graphql/operations.js";

/* Action Type Enum */
export enum ListActionType {
  // List Loading
  GET_LIST_START = 'GET_LIST_START',
  GET_LIST_SUCCESS = 'GET_LIST_SUCCESS',
  GET_LIST_ERROR = 'GET_LIST_ERROR',
}

/* Action Types */
export type ListAction =
  // List Loading
  | { type: ListActionType.GET_LIST_START }
  | { type: ListActionType.GET_LIST_SUCCESS; payload: ListLoaderData }
  | { type: ListActionType.GET_LIST_ERROR; payload: string }

export type ListLoaderData = {
  isListLoading: boolean;
  list: List | null;
  error?: string | null;
};

export const listInitialState: ListLoaderData = {
  isListLoading: false,
  list: null,
  error: null,
}

/* Action Creators */
interface GetListProps {
  publicClient: ApolloClient;
  id: string;
  forceRefresh?: boolean;
}

export async function loadList(
  { publicClient, id, forceRefresh = false }: GetListProps,
  dispatch?: Dispatch<ListAction>
): Promise<ListLoaderData | null> {
  if (dispatch) dispatch({ type: ListActionType.GET_LIST_START });

  try {
    // Get the list data
    const listResult = await publicClient.query<GetListQuery, GetListQueryVariables>({
      query: GetList,
      variables: { id },
      ...(!!forceRefresh && { fetchPolicy: 'network-only' })
    });

    if (!listResult.data?.getList) {
      throw new Error("List data not found");
    }

    const parsedData = parseLoaderList(listResult.data);

    if (dispatch) {
      dispatch({ 
        type: ListActionType.GET_LIST_SUCCESS, 
        payload: parsedData 
      });
    }
    
    return parsedData;
  } catch (error: any) {
    const errorMessage = error?.response?.data?.error || 
                        error?.message || 
                        'Failed to load list';
    
    if (dispatch) {
      dispatch({ 
        type: ListActionType.GET_LIST_ERROR, 
        payload: errorMessage 
      });
    }
    return null;
  }
}

export function parseLoaderList(data: GetListQuery): ListLoaderData {
  return {
    isListLoading: false,
    list: data.getList || null,
  };
}

/* Reducer */
export function listReducer(
  state: ListLoaderData = listInitialState,
  action: ListAction
): ListLoaderData {
  switch (action.type) {
    case ListActionType.GET_LIST_START:
      return {
        ...state,
        isListLoading: true,
        error: null,
      };
    case ListActionType.GET_LIST_SUCCESS:
      return {
        ...state,
        ...action.payload,
        isListLoading: false,
        error: null,
      };
    case ListActionType.GET_LIST_ERROR:
      return {
        ...state,
        isListLoading: false,
        error: action.payload,
      };
    default:
      return state;
  }
}