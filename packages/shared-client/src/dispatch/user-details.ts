import type { Dispatch } from 'react';
import type { ApolloClient, FetchResult } from '@apollo/client';
import { 
  UpdateUserProfile, 
  SaveBlueskyDid,
  GetComicsFromBlueskyCreators,
  GetComicsFromPatreonCreators,
  GetBlueskyProfile,
  SubscribeToMultipleComicSeries,
  UserAgeRange,
} from '../graphql/operations';
import type { 
  UpdateUserProfileMutation, 
  UpdateUserProfileMutationVariables,
  SaveBlueskyDidMutation,
  SaveBlueskyDidMutationVariables,
  GetBlueskyProfileQuery,
  GetBlueskyProfileQueryVariables,
  GetComicsFromBlueskyCreatorsQuery,
  GetComicsFromBlueskyCreatorsQueryVariables,
  GetComicsFromPatreonCreatorsQuery,
  GetComicsFromPatreonCreatorsQueryVariables,
  SubscribeToMultipleComicSeriesMutation,
  SubscribeToMultipleComicSeriesMutationVariables,
  ComicSeries
} from '../graphql/operations';
import type { StorageFunctions } from './utils';
import axios from 'axios';

export interface UserDetailsState {
  userData: any | null;
  blueskyHandle: string | null;
  blueskyFollowers: any[] | null;
  blueskyProfile: any | null;
  blueskyComicSeries: ComicSeries[] | null;
  blueskySubscriptionLoading: boolean;
  blueskySubscriptionError: string | null;
  patreonComicSeries: ComicSeries[] | null;
  patreonSubscriptionLoading: boolean;
  patreonSubscriptionError: string | null;
  isLoading: boolean;
  error: string | null;
}

export const userDetailsInitialState: UserDetailsState = {
  userData: null,
  blueskyHandle: null,
  blueskyFollowers: null,
  blueskyProfile: null,
  blueskyComicSeries: null,
  blueskySubscriptionLoading: false,
  blueskySubscriptionError: null,
  patreonComicSeries: null,
  patreonSubscriptionLoading: false,
  patreonSubscriptionError: null,
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
  BLUESKY_COMIC_SERIES_SUCCESS = 'BLUESKY_COMIC_SERIES_SUCCESS',
  BLUESKY_SUBSCRIPTION_START = 'BLUESKY_SUBSCRIPTION_START',
  BLUESKY_SUBSCRIPTION_SUCCESS = 'BLUESKY_SUBSCRIPTION_SUCCESS',
  BLUESKY_SUBSCRIPTION_ERROR = 'BLUESKY_SUBSCRIPTION_ERROR',
  PATREON_COMIC_SERIES_SUCCESS = 'PATREON_COMIC_SERIES_SUCCESS',
  PATREON_SUBSCRIPTION_START = 'PATREON_SUBSCRIPTION_START',
  PATREON_SUBSCRIPTION_SUCCESS = 'PATREON_SUBSCRIPTION_SUCCESS',
  PATREON_SUBSCRIPTION_ERROR = 'PATREON_SUBSCRIPTION_ERROR',
}

type UserDetailsAction =
  | { type: UserDetailsActionType.USER_DETAILS_START }
  | { type: UserDetailsActionType.USER_DETAILS_SUCCESS; payload: any }
  | { type: UserDetailsActionType.USER_DETAILS_ERROR; payload: string }
  | { type: UserDetailsActionType.USER_DETAILS_CLEAR_ERROR }
  | { type: UserDetailsActionType.BLUESKY_HANDLE_SUCCESS; payload: string }
  | { type: UserDetailsActionType.BLUESKY_FOLLOWERS_SUCCESS; payload: any[] }
  | { type: UserDetailsActionType.BLUESKY_PROFILE_SUCCESS; payload: any }
  | { type: UserDetailsActionType.BLUESKY_COMIC_SERIES_SUCCESS; payload: ComicSeries[] }
  | { type: UserDetailsActionType.BLUESKY_SUBSCRIPTION_START }
  | { type: UserDetailsActionType.BLUESKY_SUBSCRIPTION_SUCCESS }
  | { type: UserDetailsActionType.BLUESKY_SUBSCRIPTION_ERROR; payload: string }
  | { type: UserDetailsActionType.PATREON_COMIC_SERIES_SUCCESS; payload: ComicSeries[] }
  | { type: UserDetailsActionType.PATREON_SUBSCRIPTION_START }
  | { type: UserDetailsActionType.PATREON_SUBSCRIPTION_SUCCESS }
  | { type: UserDetailsActionType.PATREON_SUBSCRIPTION_ERROR; payload: string };

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
        blueskyComicSeries: null,
        blueskySubscriptionLoading: false,
        blueskySubscriptionError: null,
        isLoading: false,
        error: null,
      };
    case UserDetailsActionType.BLUESKY_COMIC_SERIES_SUCCESS:
      return {
        ...state,
        blueskyComicSeries: action.payload,
        isLoading: false,
        error: null,
      };
    case UserDetailsActionType.BLUESKY_SUBSCRIPTION_START:
      return {
        ...state,
        blueskySubscriptionLoading: true,
        blueskySubscriptionError: null,
      };
    case UserDetailsActionType.BLUESKY_SUBSCRIPTION_SUCCESS:
      return {
        ...state,
        blueskySubscriptionLoading: false,
        blueskySubscriptionError: null,
      };
    case UserDetailsActionType.BLUESKY_SUBSCRIPTION_ERROR:
      return {
        ...state,
        blueskySubscriptionLoading: false,
        blueskySubscriptionError: action.payload,
      };
    case UserDetailsActionType.PATREON_COMIC_SERIES_SUCCESS:
      return {
        ...state,
        patreonComicSeries: action.payload,
        isLoading: false,
        error: null,
      };
    case UserDetailsActionType.PATREON_SUBSCRIPTION_START:
      return {
        ...state,
        patreonSubscriptionLoading: true,
        patreonSubscriptionError: null,
      };
    case UserDetailsActionType.PATREON_SUBSCRIPTION_SUCCESS:
      return {
        ...state,
        patreonSubscriptionLoading: false,
        patreonSubscriptionError: null,
      };
    case UserDetailsActionType.PATREON_SUBSCRIPTION_ERROR:
      return {
        ...state,
        patreonSubscriptionLoading: false,
        patreonSubscriptionError: action.payload,
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
      variables: { ageRange, birthYear: ageRange === UserAgeRange.UNDER_18 ? birthYear : null },
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

interface GetComicsFromBlueskyCreatorsParams {
  userClient: ApolloClient<any>;
}

export async function getComicsFromBlueskyCreators(
  { userClient }: GetComicsFromBlueskyCreatorsParams,
  dispatch?: Dispatch<UserDetailsAction>
): Promise<any[]> {
  if (dispatch) dispatch({ type: UserDetailsActionType.USER_DETAILS_START });

  try {
    const result = await userClient.query<
      GetComicsFromBlueskyCreatorsQuery,
      GetComicsFromBlueskyCreatorsQueryVariables
    >({
      query: GetComicsFromBlueskyCreators,
    });

    const { data, errors } = result;

    if (errors) {
      throw new Error(errors[0]?.message || 'Failed to get comics from Bluesky creators');
    }

    if (!data?.getComicsFromBlueskyCreators) {
      throw new Error('Failed to get comics from Bluesky creators');
    }

    const comicSeries = data.getComicsFromBlueskyCreators;

    if (dispatch) {
      dispatch({ type: UserDetailsActionType.BLUESKY_FOLLOWERS_SUCCESS, payload: comicSeries });
    }

    return comicSeries;
  } catch (error: any) {
    if (dispatch) {
      dispatch({ type: UserDetailsActionType.USER_DETAILS_ERROR, payload: error?.message || 'Failed to get comics from Bluesky creators' });
    }
    throw error;
  }
}

// Legacy function - kept for backward compatibility
export async function getBlueskyFollowers(
  { userClient }: GetComicsFromBlueskyCreatorsParams,
  dispatch?: Dispatch<UserDetailsAction>
): Promise<any[]> {
  return getComicsFromBlueskyCreators({ userClient }, dispatch);
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

interface FollowCreatorsFromPatreonResult {
  creatorsFollowed: number;
}

export async function followCreatorsFromPatreon(
  token: string,
  patreonApiUrl?: string
): Promise<FollowCreatorsFromPatreonResult> {
  try {
    
  } catch (error: any) {
    console.error('Failed to follow creators from Patreon:', error);
    throw new Error(error?.response?.data?.message || error?.message || 'Failed to follow creators from Patreon');
  }
}

interface FollowComicsFromBlueskyCreatorsParams {
  userClient: ApolloClient<any>;
}

interface FollowComicsFromBlueskyCreatorsResult {
  comicSeries: ComicSeries[] | undefined;
}

export async function followComicsFromBlueskyCreators(
  { userClient }: FollowComicsFromBlueskyCreatorsParams,
  dispatch?: Dispatch<UserDetailsAction>
): Promise<FollowComicsFromBlueskyCreatorsResult> {
  if (dispatch) dispatch({ type: UserDetailsActionType.USER_DETAILS_START });

  try {
    // First, get the comic series from Bluesky creators
    const comicsResult = await userClient.query<
      GetComicsFromBlueskyCreatorsQuery,
      GetComicsFromBlueskyCreatorsQueryVariables
    >({
      query: GetComicsFromBlueskyCreators,
      fetchPolicy: 'network-only'
    });
    
    const comicSeries = comicsResult.data?.getComicsFromBlueskyCreators?.filter((series): series is ComicSeries => series !== null) || [];

    if (dispatch) {
      dispatch({ type: UserDetailsActionType.BLUESKY_COMIC_SERIES_SUCCESS, payload: comicSeries });
    }
    
    return {
      comicSeries
    };

  } catch (error: any) {
    if (dispatch) {
      dispatch({ type: UserDetailsActionType.USER_DETAILS_ERROR, payload: error?.message || 'Failed to get comics from Bluesky creators' });
    }
    console.error('Failed to get comics from Bluesky creators:', error);
    throw new Error(error?.message || 'Failed to get comics from Bluesky creators');
  }
}

interface SubscribeToComicsParams {
  userClient: ApolloClient<any>;
  seriesUuids: string[];
}

interface SubscribeToComicsResult {
  success: boolean;
  subscribedCount: number;
}

export async function subscribeToComics(
  { userClient, seriesUuids }: SubscribeToComicsParams,
  dispatch?: Dispatch<UserDetailsAction>
): Promise<SubscribeToComicsResult> {
  if (dispatch) dispatch({ type: UserDetailsActionType.BLUESKY_SUBSCRIPTION_START });

  try {
    if (!seriesUuids || seriesUuids.length === 0) {
      if (dispatch) {
        dispatch({ type: UserDetailsActionType.BLUESKY_SUBSCRIPTION_SUCCESS });
      }
      return {
        success: false,
        subscribedCount: 0
      };
    }

    // Filter out null/undefined values and duplicate UUIDs
    const uniqueSeriesUuids = [...new Set(seriesUuids.filter(Boolean))];

    console.log('uniqueSeriesUuids', uniqueSeriesUuids);
    // Subscribe to all the comic series
    const result = await userClient.mutate<
      SubscribeToMultipleComicSeriesMutation,
      SubscribeToMultipleComicSeriesMutationVariables
    >({
      mutation: SubscribeToMultipleComicSeries,
      variables: {
        seriesUuids: uniqueSeriesUuids
      }
    });

    console.log('result', result);

    const success = !!result.data?.subscribeToMultipleComicSeries;

    if (dispatch) {
      if (success) {
        dispatch({ type: UserDetailsActionType.BLUESKY_SUBSCRIPTION_SUCCESS });
      } else {
        dispatch({ type: UserDetailsActionType.BLUESKY_SUBSCRIPTION_ERROR, payload: 'Failed to subscribe to comics' });
      }
    }

    return {
      success,
      subscribedCount: uniqueSeriesUuids.length
    };
  } catch (error: any) {
    if (dispatch) {
      dispatch({ type: UserDetailsActionType.BLUESKY_SUBSCRIPTION_ERROR, payload: error?.message || 'Failed to subscribe to comics' });
    }
    console.error('Failed to subscribe to comics:', error);
    throw new Error(error?.message || 'Failed to subscribe to comics');
  }
}

interface FollowComicsFromPatreonCreatorsParams {
  userClient: ApolloClient<any>;
}

interface FollowComicsFromPatreonCreatorsResult {
  comicSeries: ComicSeries[] | undefined;
}

export async function followComicsFromPatreonCreators(
  { userClient }: FollowComicsFromPatreonCreatorsParams,
  dispatch?: Dispatch<UserDetailsAction>
): Promise<FollowComicsFromPatreonCreatorsResult> {
  if (dispatch) dispatch({ type: UserDetailsActionType.USER_DETAILS_START });

  try {
    // Get the comic series from Patreon creators
    const comicsResult = await userClient.query<
      GetComicsFromPatreonCreatorsQuery,
      GetComicsFromPatreonCreatorsQueryVariables
    >({
      query: GetComicsFromPatreonCreators,
      fetchPolicy: 'network-only'
    });
    
    const comicSeries = comicsResult.data?.getComicsFromPatreonCreators?.filter((series): series is ComicSeries => series !== null) || [];

    if (dispatch) {
      dispatch({ type: UserDetailsActionType.PATREON_COMIC_SERIES_SUCCESS, payload: comicSeries });
    }
    
    return {
      comicSeries
    };

  } catch (error: any) {
    if (dispatch) {
      dispatch({ type: UserDetailsActionType.USER_DETAILS_ERROR, payload: error?.message || 'Failed to get comics from Patreon creators' });
    }
    console.error('Failed to get comics from Patreon creators:', error);
    throw new Error(error?.message || 'Failed to get comics from Patreon creators');
  }
}

interface SubscribeToPatreonComicsParams {
  userClient: ApolloClient<any>;
  seriesUuids: string[];
}

interface SubscribeToPatreonComicsResult {
  success: boolean;
  subscribedCount: number;
}

export async function subscribeToPatreonComics(
  { userClient, seriesUuids }: SubscribeToPatreonComicsParams,
  dispatch?: Dispatch<UserDetailsAction>
): Promise<SubscribeToPatreonComicsResult> {
  if (dispatch) dispatch({ type: UserDetailsActionType.PATREON_SUBSCRIPTION_START });

  try {
    if (!seriesUuids || seriesUuids.length === 0) {
      if (dispatch) {
        dispatch({ type: UserDetailsActionType.PATREON_SUBSCRIPTION_SUCCESS });
      }
      return {
        success: false,
        subscribedCount: 0
      };
    }

    // Filter out null/undefined values and duplicate UUIDs
    const uniqueSeriesUuids = [...new Set(seriesUuids.filter(Boolean))];

    // Subscribe to all the comic series
    const result = await userClient.mutate<
      SubscribeToMultipleComicSeriesMutation,
      SubscribeToMultipleComicSeriesMutationVariables
    >({
      mutation: SubscribeToMultipleComicSeries,
      variables: {
        seriesUuids: uniqueSeriesUuids
      }
    });

    const success = !!result.data?.subscribeToMultipleComicSeries;

    if (dispatch) {
      if (success) {
        dispatch({ type: UserDetailsActionType.PATREON_SUBSCRIPTION_SUCCESS });
      } else {
        dispatch({ type: UserDetailsActionType.PATREON_SUBSCRIPTION_ERROR, payload: 'Failed to subscribe to comics' });
      }
    }

    return {
      success,
      subscribedCount: uniqueSeriesUuids.length
    };
  } catch (error: any) {
    if (dispatch) {
      dispatch({ type: UserDetailsActionType.PATREON_SUBSCRIPTION_ERROR, payload: error?.message || 'Failed to subscribe to Patreon comics' });
    }
    console.error('Failed to subscribe to Patreon comics:', error);
    throw new Error(error?.message || 'Failed to subscribe to Patreon comics');
  }
}