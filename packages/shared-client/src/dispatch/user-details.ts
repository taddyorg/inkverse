import type { Dispatch } from 'react';
import type { ApolloClient, FetchResult } from '@apollo/client';
import type { UserAgeRange } from '../graphql/types';
import { UpdateUserProfile } from '../graphql/operations';
import type { 
  UpdateUserProfileMutation, 
  UpdateUserProfileMutationVariables 
} from '../graphql/operations';
import type { StorageFunctions } from './utils';

export interface UserDetailsState {
  userData: any | null;
  isLoading: boolean;
  error: string | null;
}

export const userDetailsInitialState: UserDetailsState = {
  userData: null,
  isLoading: false,
  error: null,
};

export enum UserDetailsActionType {
  USER_DETAILS_START = 'USER_DETAILS_START',
  USER_DETAILS_SUCCESS = 'USER_DETAILS_SUCCESS',
  USER_DETAILS_ERROR = 'USER_DETAILS_ERROR',
  USER_DETAILS_CLEAR_ERROR = 'USER_DETAILS_CLEAR_ERROR',
}

type UserDetailsAction =
  | { type: UserDetailsActionType.USER_DETAILS_START }
  | { type: UserDetailsActionType.USER_DETAILS_SUCCESS; payload: any }
  | { type: UserDetailsActionType.USER_DETAILS_ERROR; payload: string }
  | { type: UserDetailsActionType.USER_DETAILS_CLEAR_ERROR };

export const userDetailsReducer = (state: UserDetailsState, action: UserDetailsAction): UserDetailsState => {
  switch (action.type) {
    case UserDetailsActionType.USER_DETAILS_START:
      return { ...state, isLoading: true, error: null };
    case UserDetailsActionType.USER_DETAILS_SUCCESS:
      return {
        ...state,
        userData: action.payload,
        isLoading: false,
        error: null,
      };
    case UserDetailsActionType.USER_DETAILS_ERROR:
      return { ...state, isLoading: false, error: action.payload };
    case UserDetailsActionType.USER_DETAILS_CLEAR_ERROR:
      return { ...state, error: null };
    default:
      return state;
  }
};

export function clearUserDetailsError(dispatch: Dispatch<UserDetailsAction>): void {
  dispatch({ type: UserDetailsActionType.USER_DETAILS_CLEAR_ERROR });
}

interface UpdateUsernameParams {
  userClient: ApolloClient<any>;
  username: string;
  storageFunctions: StorageFunctions;
}

export async function updateUsername(
  { userClient, username, storageFunctions }: UpdateUsernameParams,
  dispatch?: Dispatch<UserDetailsAction>
): Promise<any> {
  if (dispatch) dispatch({ type: UserDetailsActionType.USER_DETAILS_START });

  try {
    const result: FetchResult<UpdateUserProfileMutation> = await userClient.mutate<
      UpdateUserProfileMutation,
      UpdateUserProfileMutationVariables
    >({
      mutation: UpdateUserProfile,
      variables: { username },
    });

    const { data, errors } = result;

    if (errors) {
      throw new Error(errors[0]?.message || 'Failed to update username');
    }

    if (!data?.updateUserProfile) {
      throw new Error('Failed to update username');
    }

    if (dispatch) {
      dispatch({ type: UserDetailsActionType.USER_DETAILS_SUCCESS, payload: data.updateUserProfile });
    }

    const user = data.updateUserProfile;

    storageFunctions.saveUserDetails(user);

    return user;
  } catch (error: any) {
    if (dispatch) {
      dispatch({ type: UserDetailsActionType.USER_DETAILS_ERROR, payload: error?.message || 'Failed to update username' });
    }
    throw error;
  }
}

interface UpdateAgeRangeParams {
  userClient: ApolloClient<any>;
  ageRange: UserAgeRange;
  birthYear?: number;
}

export async function updateAgeRange(
  { userClient, ageRange, birthYear }: UpdateAgeRangeParams,
  dispatch?: Dispatch<UserDetailsAction>
): Promise<any> {
  if (dispatch) dispatch({ type: UserDetailsActionType.USER_DETAILS_START });

  try {
    const result: FetchResult<UpdateUserProfileMutation> = await userClient.mutate<
      UpdateUserProfileMutation,
      UpdateUserProfileMutationVariables
    >({
      mutation: UpdateUserProfile,
      variables: { ageRange, birthYear },
    });

    const { data, errors } = result;

    if (errors) {
      throw new Error(errors[0]?.message || 'Failed to update age range');
    }

    if (!data?.updateUserProfile) {
      throw new Error('Failed to update age range');
    }

    if (dispatch) {
      dispatch({ type: UserDetailsActionType.USER_DETAILS_SUCCESS, payload: data.updateUserProfile });
    }

    return data.updateUserProfile;
  } catch (error: any) {
    if (dispatch) {
      dispatch({ type: UserDetailsActionType.USER_DETAILS_ERROR, payload: error?.message || 'Failed to update age range' });
    }
    throw error;
  }
}