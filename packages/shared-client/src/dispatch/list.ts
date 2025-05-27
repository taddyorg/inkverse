import type { ApolloClient } from '@apollo/client';
import { asyncAction, ActionTypes, errorHandlerFactory, type Dispatch, type Action } from './utils.js';
import { type GetListQuery, type GetListQueryVariables, GetList, type List } from "../graphql/operations.js";

/* Actions */
export const GET_LIST = asyncAction(ActionTypes.GET_LIST);

/* Action Creators */
interface GetListProps {
  publicClient: ApolloClient<any>;
  id: string;
  forceRefresh?: boolean;
}

export async function loadList({ publicClient, id, forceRefresh = false }: GetListProps, dispatch: Dispatch) {
  dispatch(GET_LIST.request());

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

    dispatch(GET_LIST.success(parsedData));
  } catch (error: Error | unknown) {
    errorHandlerFactory(dispatch, GET_LIST)(error);
  }
}

export function parseLoaderList(data: GetListQuery): ListLoaderData {
  return {
    isListLoading: false,
    list: data.getList || null,
  };
}

export type ListLoaderData = {
  isListLoading: boolean;
  list: List | null;
  apolloState?: Record<string, any>;
};

export const listInitialState: ListLoaderData = {
  isListLoading: false,
  list: null,
}

/* Reducers */
export function listQueryReducerDefault(state = listInitialState, action: Action): ListLoaderData {
  switch (action.type) {
    case GET_LIST.REQUEST:
      return {
        ...state,
        isListLoading: true,
      };
    case GET_LIST.SUCCESS:
      return {
        ...state,
        ...action.payload,
        isListLoading: false,
      };
    default:
      return state;
  }
}

export const listQueryReducer = (state: ListLoaderData, action: Action) => listQueryReducerDefault(state, action); 