import type { Dispatch } from 'react';
import type { ApolloClient, FetchResult } from '@apollo/client';
import { 
  GetUserByUsername,
  UpdateUserProfile,
} from '../graphql/operations';
import type { 
  GetUserByUsernameQuery,
  GetUserByUsernameQueryVariables,
  UpdateUserProfileMutation, 
  UpdateUserProfileMutationVariables,
  UserAgeRange,
} from '../graphql/operations';
import type { StorageFunctions } from './utils';

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

interface GetUserByUsernameParams {
  userClient: ApolloClient<any>;
  username: string;
}

export async function getUserByUsername(
  { userClient, username }: GetUserByUsernameParams,
  dispatch?: Dispatch<ProfileAction>
): Promise<any> {
  if (dispatch) dispatch({ type: ProfileActionType.PROFILE_START });

  try {
    const result = await userClient.query<GetUserByUsernameQuery, GetUserByUsernameQueryVariables>({
      query: GetUserByUsername,
      variables: { username },
      fetchPolicy: 'network-only'
    });

    const { data, errors } = result;

    if (errors) {
      throw new Error(errors[0]?.message || 'Failed to get user');
    }

    if (!data?.getUserByUsername) {
      throw new Error('User not found');
    }

    if (dispatch) {
      dispatch({ type: ProfileActionType.PROFILE_SUCCESS, payload: data.getUserByUsername });
    }

    return data.getUserByUsername;
  } catch (error: any) {
    if (dispatch) {
      dispatch({ type: ProfileActionType.PROFILE_ERROR, payload: error?.message || 'Failed to get user' });
    }
    throw error;
  }
}

interface UpdateUserProfileParams {
  userClient: ApolloClient<any>;
  username?: string;
  ageRange?: UserAgeRange;
  birthYear?: number;
  storageFunctions: StorageFunctions;
}

export async function updateUserProfile(
  { userClient, username, ageRange, birthYear, storageFunctions }: UpdateUserProfileParams,
  dispatch?: Dispatch<ProfileAction>
): Promise<any> {
  if (dispatch) dispatch({ type: ProfileActionType.PROFILE_START });

  try {
    const result: FetchResult<UpdateUserProfileMutation> = await userClient.mutate<
      UpdateUserProfileMutation,
      UpdateUserProfileMutationVariables
    >({
      mutation: UpdateUserProfile,
      variables: { username, ageRange, birthYear },
    });

    const { data, errors } = result;

    if (errors) {
      throw new Error(errors[0]?.message || 'Failed to update profile');
    }

    if (!data?.updateUserProfile) {
      throw new Error('Failed to update profile');
    }

    if (dispatch) {
      dispatch({ type: ProfileActionType.PROFILE_SUCCESS, payload: data.updateUserProfile });
    }

    const user = data.updateUserProfile;

    storageFunctions.saveUserDetails(user);

    return user;
  } catch (error: any) {
    if (dispatch) {
      dispatch({ type: ProfileActionType.PROFILE_ERROR, payload: error?.message || 'Failed to update profile' });
    }
    throw error;
  }
}