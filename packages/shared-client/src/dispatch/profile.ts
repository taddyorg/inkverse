import type { Dispatch } from 'react';
import type { ApolloClient, FetchResult } from '@apollo/client';
import type { StorageFunctions } from './utils';
import { GetMeDetails, type GetMeDetailsQuery, type GetMeDetailsQueryVariables, type User } from '../graphql/operations';

export interface ProfileState {
  user: any | null;
  isLoading: boolean;
  error: string | null;
}

export const profileInitialState: ProfileState = {
  user: null,
  isLoading: false,
  error: null,
};

export enum ProfileActionType {
  PROFILE_START = 'PROFILE_START',
  PROFILE_SUCCESS = 'PROFILE_SUCCESS',
  PROFILE_ERROR = 'PROFILE_ERROR',
  PROFILE_CLEAR_ERROR = 'PROFILE_CLEAR_ERROR',
}

type ProfileAction =
  | { type: ProfileActionType.PROFILE_START }
  | { type: ProfileActionType.PROFILE_SUCCESS; payload: any }
  | { type: ProfileActionType.PROFILE_ERROR; payload: string }
  | { type: ProfileActionType.PROFILE_CLEAR_ERROR };

export const profileReducer = (state: ProfileState, action: ProfileAction): ProfileState => {
  switch (action.type) {
    case ProfileActionType.PROFILE_START:
      return { ...state, isLoading: true, error: null };
    case ProfileActionType.PROFILE_SUCCESS:
      return {
        ...state,
        user: action.payload,
        isLoading: false,
        error: null,
      };
    case ProfileActionType.PROFILE_ERROR:
      return { ...state, isLoading: false, error: action.payload };
    case ProfileActionType.PROFILE_CLEAR_ERROR:
      return { ...state, error: null };
    default:
      return state;
  }
};

export function clearProfileError(dispatch: Dispatch<ProfileAction>): void {
  dispatch({ type: ProfileActionType.PROFILE_CLEAR_ERROR });
}

export interface GetMeDetailsParams {
  userClient: ApolloClient<any>;
  storageFunctions: StorageFunctions;
}

export async function getMeDetails(
  { userClient, storageFunctions }: GetMeDetailsParams): Promise<User | null> {
  try {
    const { data } = await userClient.query<
      GetMeDetailsQuery,
      GetMeDetailsQueryVariables
    >({
      query: GetMeDetails,
    });

    const user = data?.me as User | null;

    if (user) {
      storageFunctions.saveUserDetails(user);
    }

    return user;
  } catch (error: Error | unknown) {
    console.error('Error fetching me details:', error);
    return null;
  } 
}