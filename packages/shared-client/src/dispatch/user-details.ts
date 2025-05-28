import type { Dispatch } from 'react';
import type { ApolloClient, FetchResult } from '@apollo/client';
import { 
  UpdateUserProfile, 
  SaveBlueskyDid,
  GetBlueskyFollowers,
  GetBlueskyProfile,
  type UserAgeRange 
} from '../graphql/operations';
import type { 
  UpdateUserProfileMutation, 
  UpdateUserProfileMutationVariables,
  SaveBlueskyDidMutation,
  SaveBlueskyDidMutationVariables,
  GetBlueskyProfileQuery,
  GetBlueskyProfileQueryVariables,
  GetBlueskyFollowersQuery,
  GetBlueskyFollowersQueryVariables
} from '../graphql/operations';
import type { StorageFunctions } from './utils';

export interface UserDetailsState {
  userData: any | null;
  blueskyHandle: string | null;
  blueskyFollowers: any[] | null;
  blueskyProfile: any | null;
  isLoading: boolean;
  error: string | null;
}

export const userDetailsInitialState: UserDetailsState = {
  userData: null,
  blueskyHandle: null,
  blueskyFollowers: null,
  blueskyProfile: null,
  isLoading: false,
  error: null,
};

export enum UserDetailsActionType {
  USER_DETAILS_START = 'USER_DETAILS_START',
  USER_DETAILS_SUCCESS = 'USER_DETAILS_SUCCESS',
  USER_DETAILS_ERROR = 'USER_DETAILS_ERROR',
  USER_DETAILS_CLEAR_ERROR = 'USER_DETAILS_CLEAR_ERROR',
  BLUESKY_HANDLE_SUCCESS = 'BLUESKY_HANDLE_SUCCESS',
  BLUESKY_FOLLOWERS_SUCCESS = 'BLUESKY_FOLLOWERS_SUCCESS',
  BLUESKY_PROFILE_SUCCESS = 'BLUESKY_PROFILE_SUCCESS',
}

type UserDetailsAction =
  | { type: UserDetailsActionType.USER_DETAILS_START }
  | { type: UserDetailsActionType.USER_DETAILS_SUCCESS; payload: any }
  | { type: UserDetailsActionType.USER_DETAILS_ERROR; payload: string }
  | { type: UserDetailsActionType.USER_DETAILS_CLEAR_ERROR }
  | { type: UserDetailsActionType.BLUESKY_HANDLE_SUCCESS; payload: string }
  | { type: UserDetailsActionType.BLUESKY_FOLLOWERS_SUCCESS; payload: any[] }
  | { type: UserDetailsActionType.BLUESKY_PROFILE_SUCCESS; payload: any };

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
    case UserDetailsActionType.BLUESKY_HANDLE_SUCCESS:
      return {
        ...state,
        blueskyHandle: action.payload,
        isLoading: false,
        error: null,
      };
    case UserDetailsActionType.BLUESKY_FOLLOWERS_SUCCESS:
      return {
        ...state,
        blueskyFollowers: action.payload,
        isLoading: false,
        error: null,
      };
    case UserDetailsActionType.BLUESKY_PROFILE_SUCCESS:
      return {
        ...state,
        blueskyProfile: action.payload,
        isLoading: false,
        error: null,
      };
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

interface SaveBlueskyDidParams {
  userClient: ApolloClient<any>;
  did: string;
}

export async function saveBlueskyDid(
  { userClient, did }: SaveBlueskyDidParams,
  dispatch?: Dispatch<UserDetailsAction>
): Promise<any> {
  if (dispatch) dispatch({ type: UserDetailsActionType.USER_DETAILS_START });

  try {
    const result: FetchResult<SaveBlueskyDidMutation> = await userClient.mutate<
      SaveBlueskyDidMutation,
      SaveBlueskyDidMutationVariables
    >({
      mutation: SaveBlueskyDid,
      variables: { did },
    });

    const { data, errors } = result;

    if (errors) {
      throw new Error(errors[0]?.message || 'Failed to save Bluesky DID');
    }

    if (!data?.saveBlueskyDid) {
      throw new Error('Failed to save Bluesky DID');
    }

    if (dispatch) {
      dispatch({ type: UserDetailsActionType.BLUESKY_HANDLE_SUCCESS, payload: data.saveBlueskyDid.blueskyDid || '' });
    }

    return data.saveBlueskyDid;
  } catch (error: any) {
    if (dispatch) {
      dispatch({ type: UserDetailsActionType.USER_DETAILS_ERROR, payload: error?.message || 'Failed to save Bluesky DID' });
    }
    throw error;
  }
}

interface GetBlueskyFollowersParams {
  userClient: ApolloClient<any>;
}

export async function getBlueskyFollowers(
  { userClient }: GetBlueskyFollowersParams,
  dispatch?: Dispatch<UserDetailsAction>
): Promise<any[]> {
  if (dispatch) dispatch({ type: UserDetailsActionType.USER_DETAILS_START });

  try {
    const result = await userClient.query<
      GetBlueskyFollowersQuery,
      GetBlueskyFollowersQueryVariables
    >({
      query: GetBlueskyFollowers,
    });

    const { data, errors } = result;

    if (errors) {
      throw new Error(errors[0]?.message || 'Failed to get Bluesky followers');
    }

    if (!data?.getBlueskyFollowers) {
      throw new Error('Failed to get Bluesky followers');
    }

    const followers = data.getBlueskyFollowers;

    if (dispatch) {
      dispatch({ type: UserDetailsActionType.BLUESKY_FOLLOWERS_SUCCESS, payload: followers });
    }

    return followers;
  } catch (error: any) {
    if (dispatch) {
      dispatch({ type: UserDetailsActionType.USER_DETAILS_ERROR, payload: error?.message || 'Failed to get Bluesky followers' });
    }
    throw error;
  }
}

interface VerifyBlueskyHandleParams {
  userClient: ApolloClient<any>;
  handle: string;
}

export async function verifyBlueskyHandle(
  { userClient, handle }: VerifyBlueskyHandleParams,
  dispatch?: Dispatch<UserDetailsAction>
): Promise<any> {
  if (dispatch) dispatch({ type: UserDetailsActionType.USER_DETAILS_START });

  try {
    const result = await userClient.query<
      GetBlueskyProfileQuery,
      GetBlueskyProfileQueryVariables
    >({
      query: GetBlueskyProfile,
      variables: { handle: handle.trim() },
      fetchPolicy: 'network-only'
    });

    const { data, errors } = result;

    if (errors) {
      throw new Error(errors[0]?.message || 'Failed to verify Bluesky handle');
    }

    if (!data?.getBlueskyProfile) {
      throw new Error('Profile not found');
    }

    const profile = data.getBlueskyProfile;

    if (dispatch) {
      dispatch({ type: UserDetailsActionType.BLUESKY_PROFILE_SUCCESS, payload: profile });
    }

    return profile;
  } catch (error: any) {
    if (dispatch) {
      dispatch({ type: UserDetailsActionType.USER_DETAILS_ERROR, payload: error?.message || 'Failed to verify Bluesky handle' });
    }
    throw error;
  }
}