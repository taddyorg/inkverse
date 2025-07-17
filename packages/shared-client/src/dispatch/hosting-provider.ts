import type { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import type { Dispatch } from 'react';
import { FetchAllHostingProviderTokens, FetchRefreshTokenForHostingProvider, ExchangeHostingProviderOAuthCode, type FetchAllHostingProviderTokensMutation, type FetchAllHostingProviderTokensMutationVariables, type FetchRefreshTokenForHostingProviderMutation, type FetchRefreshTokenForHostingProviderMutationVariables, type ExchangeHostingProviderOAuthCodeMutation, type ExchangeHostingProviderOAuthCodeMutationVariables } from '../graphql/operations';
import { jwtDecode } from 'jwt-decode';

export interface HostingProviderState {
  isLoading: boolean;
  error: string | null;
  refreshToken: string | null;
  isExchangingCode: boolean;
  exchangeSuccess: boolean;
}

export const hostingProviderInitialState: HostingProviderState = {
  isLoading: false,
  error: null,
  refreshToken: null,
  isExchangingCode: false,
  exchangeSuccess: false,
};

/* Action Type Enum */
export enum HostingProviderActionType {
  FETCH_USER_TOKENS_START = 'FETCH_USER_TOKENS_START',
  FETCH_USER_TOKENS_SUCCESS = 'FETCH_USER_TOKENS_SUCCESS',
  FETCH_USER_TOKENS_ERROR = 'FETCH_USER_TOKENS_ERROR',
  FETCH_USER_TOKENS_CLEAR_ERROR = 'FETCH_USER_TOKENS_CLEAR_ERROR',
  EXCHANGE_OAUTH_CODE_START = 'EXCHANGE_OAUTH_CODE_START',
  EXCHANGE_OAUTH_CODE_SUCCESS = 'EXCHANGE_OAUTH_CODE_SUCCESS',
  EXCHANGE_OAUTH_CODE_ERROR = 'EXCHANGE_OAUTH_CODE_ERROR',
}

/* Action Types */
export type HostingProviderAction =
  // Fetch User Tokens
  | { type: HostingProviderActionType.FETCH_USER_TOKENS_START }
  | { type: HostingProviderActionType.FETCH_USER_TOKENS_SUCCESS; payload: { refreshToken: string | null } }
  | { type: HostingProviderActionType.FETCH_USER_TOKENS_ERROR; payload: string }
  | { type: HostingProviderActionType.FETCH_USER_TOKENS_CLEAR_ERROR }
  // Exchange OAuth Code
  | { type: HostingProviderActionType.EXCHANGE_OAUTH_CODE_START }
  | { type: HostingProviderActionType.EXCHANGE_OAUTH_CODE_SUCCESS }
  | { type: HostingProviderActionType.EXCHANGE_OAUTH_CODE_ERROR; payload: string }
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

/* Action Creators */
interface ExchangeOAuthCodeParams {
  userClient: ApolloClient<NormalizedCacheObject>;
  hostingProviderUuid: string;
  code: string;
}

export async function exchangeHostingProviderOAuthCode(
  { userClient, hostingProviderUuid, code }: ExchangeOAuthCodeParams,
  dispatch?: Dispatch<HostingProviderAction>
): Promise<{ success: boolean; error?: string } | null> {
  if (dispatch) dispatch({ type: HostingProviderActionType.EXCHANGE_OAUTH_CODE_START });

  try {
    const { data } = await userClient.mutate<
      ExchangeHostingProviderOAuthCodeMutation,
      ExchangeHostingProviderOAuthCodeMutationVariables
    >({
      mutation: ExchangeHostingProviderOAuthCode,
      variables: { hostingProviderUuid, code },
      fetchPolicy: 'no-cache'
    });

    const result = data?.exchangeHostingProviderOAuthCode;
    
    if (!result) {
      throw new Error('No response from server');
    }

    if (result.success) {
      if (dispatch) {
        dispatch({ type: HostingProviderActionType.EXCHANGE_OAUTH_CODE_SUCCESS });
      }
    } else {
      if (dispatch) {
        dispatch({ 
          type: HostingProviderActionType.EXCHANGE_OAUTH_CODE_ERROR, 
          payload: result.error || 'Unknown error occurred'
        });
      }
    }
    
    return {
      success: result.success,
      error: result.error || undefined
    };
  } catch (error: any) {
    const errorMessage = error?.message || 'Failed to exchange OAuth code';
    
    if (dispatch) {
      dispatch({ 
        type: HostingProviderActionType.EXCHANGE_OAUTH_CODE_ERROR, 
        payload: errorMessage 
      });
    }
    return null;
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
    case HostingProviderActionType.EXCHANGE_OAUTH_CODE_START:
      return { ...state, isExchangingCode: true, error: null, exchangeSuccess: false };
    case HostingProviderActionType.EXCHANGE_OAUTH_CODE_SUCCESS:
      return { ...state, isExchangingCode: false, exchangeSuccess: true };
    case HostingProviderActionType.EXCHANGE_OAUTH_CODE_ERROR:
      return { ...state, isExchangingCode: false, error: action.payload, exchangeSuccess: false };
    default:
      return state;
  }
} 