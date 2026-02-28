import type { Dispatch } from 'react';
import { ApolloClient } from '@apollo/client';
import axios from 'axios';
import {
  GetCreatorClaimStatus,
} from '../graphql/operations.js';
import type {
  GetCreatorClaimStatusQuery,
  GetCreatorClaimStatusQueryVariables,
} from '../graphql/operations.js';

export interface ClaimCreatorState {
  isLoading: boolean;
  error: string | null;
  claimStatus: string | null;
}

export const claimCreatorInitialState: ClaimCreatorState = {
  isLoading: true,
  error: null,
  claimStatus: null,
};

export enum ClaimCreatorActionType {
  FETCH_STATUS_START = 'FETCH_STATUS_START',
  FETCH_STATUS_SUCCESS = 'FETCH_STATUS_SUCCESS',
  FETCH_STATUS_ERROR = 'FETCH_STATUS_ERROR',
  INITIATE_CLAIM_START = 'INITIATE_CLAIM_START',
  INITIATE_CLAIM_SUCCESS = 'INITIATE_CLAIM_SUCCESS',
  INITIATE_CLAIM_ERROR = 'INITIATE_CLAIM_ERROR',
}

export type ClaimCreatorAction =
  | { type: ClaimCreatorActionType.FETCH_STATUS_START }
  | { type: ClaimCreatorActionType.FETCH_STATUS_SUCCESS; payload: string | null }
  | { type: ClaimCreatorActionType.FETCH_STATUS_ERROR; payload: string }
  | { type: ClaimCreatorActionType.INITIATE_CLAIM_START }
  | { type: ClaimCreatorActionType.INITIATE_CLAIM_SUCCESS }
  | { type: ClaimCreatorActionType.INITIATE_CLAIM_ERROR; payload: string };

export const claimCreatorReducer = (
  state: ClaimCreatorState,
  action: ClaimCreatorAction
): ClaimCreatorState => {
  switch (action.type) {
    case ClaimCreatorActionType.FETCH_STATUS_START:
      return { ...state, isLoading: true, error: null };
    case ClaimCreatorActionType.FETCH_STATUS_SUCCESS:
      return { ...state, isLoading: false, claimStatus: action.payload };
    case ClaimCreatorActionType.FETCH_STATUS_ERROR:
      return { ...state, isLoading: false, error: action.payload };
    case ClaimCreatorActionType.INITIATE_CLAIM_START:
      return { ...state, isLoading: true, error: null };
    case ClaimCreatorActionType.INITIATE_CLAIM_SUCCESS:
      return { ...state, isLoading: false };
    case ClaimCreatorActionType.INITIATE_CLAIM_ERROR:
      return { ...state, isLoading: false, error: action.payload };
    default:
      return state;
  }
};

interface FetchClaimStatusParams {
  userClient: ApolloClient;
  creatorUuid: string;
}

export async function fetchClaimStatus(
  { userClient, creatorUuid }: FetchClaimStatusParams,
  dispatch?: Dispatch<ClaimCreatorAction>
): Promise<string | null> {
  if (dispatch) dispatch({ type: ClaimCreatorActionType.FETCH_STATUS_START });

  try {
    const { data } = await userClient.query<
      GetCreatorClaimStatusQuery,
      GetCreatorClaimStatusQueryVariables
    >({
      query: GetCreatorClaimStatus,
      variables: { creatorUuid },
      fetchPolicy: 'network-only',
    });

    const status = data?.getCreatorClaimStatus || null;

    if (dispatch) {
      dispatch({ type: ClaimCreatorActionType.FETCH_STATUS_SUCCESS, payload: status });
    }


    return status;
  } catch (error: any) {
    console.error('Failed to fetch claim status', error);
    if (dispatch) {
      dispatch({ type: ClaimCreatorActionType.FETCH_STATUS_ERROR, payload: error?.message || 'Failed to fetch claim status' });
    }
    return null;
  }
}

interface InitiateClaimParams {
  baseUrl: string;
  creatorUuid: string;
  accessToken: string;
}

export async function initiateClaim(
  { baseUrl, creatorUuid, accessToken }: InitiateClaimParams,
  dispatch?: Dispatch<ClaimCreatorAction>
): Promise<{ claimCreatorUrl: string } | null> {
  if (dispatch) dispatch({ type: ClaimCreatorActionType.INITIATE_CLAIM_START });

  try {
    const response = await axios.post(
      `${baseUrl}/initiate`,
      { creatorUuid },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (dispatch) {
      dispatch({ type: ClaimCreatorActionType.INITIATE_CLAIM_SUCCESS });
    }

    if (response.data.claimCreatorUrl) {
      return { claimCreatorUrl: response.data.claimCreatorUrl };
    }

    return null;
  } catch (error: any) {
    const errorMessage = error?.response?.data?.error || error?.message || 'Failed to initiate claim';
    if (dispatch) {
      dispatch({ type: ClaimCreatorActionType.INITIATE_CLAIM_ERROR, payload: errorMessage });
    }
    return null;
  }
}
