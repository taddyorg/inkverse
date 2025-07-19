import type { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import type { Dispatch } from 'react';
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

/* Action Type Enum */
export enum HostingProviderActionType {
  FETCH_USER_TOKENS_START = 'FETCH_USER_TOKENS_START',
  FETCH_USER_TOKENS_SUCCESS = 'FETCH_USER_TOKENS_SUCCESS',
  FETCH_USER_TOKENS_ERROR = 'FETCH_USER_TOKENS_ERROR',
  FETCH_USER_TOKENS_CLEAR_ERROR = 'FETCH_USER_TOKENS_CLEAR_ERROR',
}

/* Action Types */
export type HostingProviderAction =
  // Fetch User Tokens
  | { type: HostingProviderActionType.FETCH_USER_TOKENS_START }
  | { type: HostingProviderActionType.FETCH_USER_TOKENS_SUCCESS; payload: { refreshToken: string | null } }
  | { type: HostingProviderActionType.FETCH_USER_TOKENS_ERROR; payload: string }
  | { type: HostingProviderActionType.FETCH_USER_TOKENS_CLEAR_ERROR }
/* Action Creators */
interface FetchUserTokensParams {
  userClient: ApolloClient<any>;
  hostingProviderUuid: string;
}

export async function fetchRefreshTokenForHostingProvider(
  { userClient, hostingProviderUuid }: FetchUserTokensParams,
  dispatch?: Dispatch<HostingProviderAction>
): Promise<string | null> {
  if (dispatch) dispatch({ type: HostingProviderActionType.FETCH_USER_TOKENS_START });

  try {
    const { data } = await userClient.mutate<
      FetchRefreshTokenForHostingProviderMutation,
      FetchRefreshTokenForHostingProviderMutationVariables
    >({
      mutation: FetchRefreshTokenForHostingProvider,
      variables: { hostingProviderUuid },
      fetchPolicy: 'no-cache'
    });

    const refreshToken = data?.fetchRefreshTokenForHostingProvider || null;
    
    if (dispatch) {
      dispatch({ 
        type: HostingProviderActionType.FETCH_USER_TOKENS_SUCCESS, 
        payload: { refreshToken }
      });
    }
    
    return refreshToken;
  } catch (error: any) {
    const errorMessage = error?.response?.data?.error || 
                        error?.message || 
                        'Failed to fetch refresh token';
    
    if (dispatch) {
      dispatch({ 
        type: HostingProviderActionType.FETCH_USER_TOKENS_ERROR, 
        payload: errorMessage 
      });
    }
    return null;
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


/* Reducer */
export function hostingProviderReducer(
  state: HostingProviderState = hostingProviderInitialState,
  action: HostingProviderAction
): HostingProviderState {
  switch (action.type) {
    case HostingProviderActionType.FETCH_USER_TOKENS_START:
      return { ...state, isLoading: true, error: null };
    case HostingProviderActionType.FETCH_USER_TOKENS_SUCCESS:
      return { 
        ...state, 
        isLoading: false, 
        refreshToken: action.payload.refreshToken
      };
    case HostingProviderActionType.FETCH_USER_TOKENS_ERROR:
      return { 
        ...state, 
        isLoading: false, 
        error: action.payload
      };
    case HostingProviderActionType.FETCH_USER_TOKENS_CLEAR_ERROR:
      return { ...state, error: null };
    default:
      return state;
  }
} 