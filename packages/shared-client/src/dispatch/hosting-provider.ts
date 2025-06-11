import type { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { asyncAction, ActionTypes, errorHandlerFactory, type Action, type Dispatch } from './utils.js';
import { FetchAllHostingProviderTokens, FetchRefreshTokenForHostingProvider, type FetchAllHostingProviderTokensMutation, type FetchAllHostingProviderTokensMutationVariables, type FetchRefreshTokenForHostingProviderMutation, type FetchRefreshTokenForHostingProviderMutationVariables } from '../graphql/operations';
import { jwtDecode } from 'jwt-decode';

export interface HostingProviderState {
  isLoading: boolean;
  error: string | null;
  refreshToken: string | null;
}

export const hostingProviderInitialState: HostingProviderState = {
  isLoading: false,
  error: null,
  refreshToken: null,
};

/* Actions */
export const FETCH_USER_TOKENS = asyncAction(ActionTypes.FETCH_USER_TOKENS);
export const CLEAR_HOSTING_PROVIDER_ERROR = 'CLEAR_HOSTING_PROVIDER_ERROR';

/* Action Creators */
interface FetchUserTokensParams {
  userClient: ApolloClient<any>;
  hostingProviderUuid: string;
}

export async function fetchRefreshTokenForHostingProvider(
  { userClient, hostingProviderUuid }: FetchUserTokensParams,
  dispatch: Dispatch
): Promise<void> {
  dispatch(FETCH_USER_TOKENS.request());

  try {
    const { data } = await userClient.mutate<
      FetchRefreshTokenForHostingProviderMutation,
      FetchRefreshTokenForHostingProviderMutationVariables
    >({
      mutation: FetchRefreshTokenForHostingProvider,
      variables: { hostingProviderUuid },
      fetchPolicy: 'no-cache'
    });

    dispatch(FETCH_USER_TOKENS.success({ 
      refreshToken: data?.fetchRefreshTokenForHostingProvider || null 
    }));
  } catch (error: Error | unknown) {
    errorHandlerFactory(dispatch, FETCH_USER_TOKENS)(error);
  }
}

/* Action Creators */
interface FetchAllHostingProviderTokensParams {
  userClient: ApolloClient<NormalizedCacheObject>;
  saveHostingProviderRefreshToken: (token: string, hostingProviderUuid: string) => void;
  refreshHostingProviderAccessToken: (hostingProviderUuid: string) => Promise<string | null>;
}

export async function fetchAllHostingProviderTokens(
  { userClient, saveHostingProviderRefreshToken, refreshHostingProviderAccessToken }: FetchAllHostingProviderTokensParams): Promise<void> {
  try {
    const { data } = await userClient.mutate<
      FetchAllHostingProviderTokensMutation,
      FetchAllHostingProviderTokensMutationVariables
    >({
      mutation: FetchAllHostingProviderTokens,
      fetchPolicy: 'no-cache'
    });

    const refreshTokens = data?.fetchAllHostingProviderTokens || [];
    refreshTokens.forEach((refreshToken) => {
      const decodedToken = jwtDecode(refreshToken);
      saveHostingProviderRefreshToken(refreshToken, decodedToken.iss as string);
    });

    for await (const refreshToken of refreshTokens) {
      const decodedToken = jwtDecode(refreshToken);
      await refreshHostingProviderAccessToken(decodedToken.iss as string);
    }
    
  } catch (error: Error | unknown) {
    console.error('Error fetching all hosting provider tokens:', error);
  } 
}

export function clearHostingProviderError(dispatch: Dispatch): void {
  dispatch({ type: CLEAR_HOSTING_PROVIDER_ERROR });
}

/* Reducer */
export function hostingProviderReducer(state = hostingProviderInitialState, action: Action): HostingProviderState {
  switch (action.type) {
    case FETCH_USER_TOKENS.REQUEST:
      return { ...state, isLoading: true, error: null };
    case FETCH_USER_TOKENS.SUCCESS:
      return { 
        ...state, 
        isLoading: false, 
        refreshToken: action.payload?.refreshToken || null 
      };
    case FETCH_USER_TOKENS.FAILURE:
      return { 
        ...state, 
        isLoading: false, 
        error: action.payload?.message || 'Failed to fetch user tokens' 
      };
    case CLEAR_HOSTING_PROVIDER_ERROR:
      return { ...state, error: null };
    default:
      return state;
  }
} 