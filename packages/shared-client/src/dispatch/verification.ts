import type { Dispatch } from 'react';
import type { ApolloClient, FetchResult } from '@apollo/client';
import { 
  ResendVerificationEmail,
} from '../graphql/operations';
import type { 
  ResendVerificationEmailMutation,
  ResendVerificationEmailMutationVariables,
} from '../graphql/operations';

export interface VerificationState {
  isLoading: boolean;
  error: string | null;
}

export const verificationInitialState: VerificationState = {
  isLoading: false,
  error: null,
};

export enum VerificationActionType {
  VERIFICATION_START = 'VERIFICATION_START',
  VERIFICATION_SUCCESS = 'VERIFICATION_SUCCESS',
  VERIFICATION_ERROR = 'VERIFICATION_ERROR',
}

type VerificationAction =
  | { type: VerificationActionType.VERIFICATION_START }
  | { type: VerificationActionType.VERIFICATION_SUCCESS }
  | { type: VerificationActionType.VERIFICATION_ERROR; payload: string };

export const verificationReducer = (state: VerificationState, action: VerificationAction): VerificationState => {
  switch (action.type) {
    case VerificationActionType.VERIFICATION_START:
      return { ...state, isLoading: true, error: null };
    case VerificationActionType.VERIFICATION_SUCCESS:
      return { ...state, isLoading: false, error: null };
    case VerificationActionType.VERIFICATION_ERROR:
      return { ...state, isLoading: false, error: action.payload };
    default:
      return state;
  }
};

interface ResendVerificationEmailParams {
  userClient: ApolloClient<any>;
}

export async function resendVerificationEmail(
  { userClient }: ResendVerificationEmailParams,
  dispatch?: Dispatch<VerificationAction>
): Promise<boolean> {
  if (dispatch) dispatch({ type: VerificationActionType.VERIFICATION_START });

  try {
    const result: FetchResult<ResendVerificationEmailMutation> = await userClient.mutate<
      ResendVerificationEmailMutation,
      ResendVerificationEmailMutationVariables
    >({
      mutation: ResendVerificationEmail,
    });

    const { data, errors } = result;

    if (errors) {
      throw new Error(errors[0]?.message || 'Failed to resend verification email');
    }

    if (dispatch) {
      dispatch({ type: VerificationActionType.VERIFICATION_SUCCESS });
    }

    return data?.resendVerificationEmail || false;
  } catch (error: any) {
    if (dispatch) {
      dispatch({ type: VerificationActionType.VERIFICATION_ERROR, payload: error?.message || 'Failed to resend verification email' });
    }
    throw error;
  }
}