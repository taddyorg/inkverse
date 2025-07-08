import type { Dispatch } from 'react';
import type { ApolloClient } from '@apollo/client';
import type { StorageFunctions } from './utils';
import { emit, EventNames } from '../pubsub';
import { 
  GetMeDetails, 
  type GetMeDetailsQuery, 
  type GetMeDetailsQueryVariables, 
  type User,
  GetUserByUsername,
  type GetUserByUsernameQuery,
  type GetUserByUsernameQueryVariables,
  GetProfileByUserId,
  type GetProfileByUserIdQuery,
  type GetProfileByUserIdQueryVariables,
  type ComicSeries,
} from '../graphql/operations';


/* Action Type Enum */
export enum ProfileActionType {
  GET_PROFILE_START = 'GET_PROFILE_START',
  GET_PROFILE_SUCCESS = 'GET_PROFILE_SUCCESS',
  GET_PROFILE_ERROR = 'GET_PROFILE_ERROR',
  LOGOUT_PROFILE = 'LOGOUT_PROFILE',
}

export interface ProfileState {
  user: any | null;
  subscribedComics: ComicSeries[] | null;
  isLoading: boolean;
  error: string | null;
  apolloState?: Record<string, any>;
}

export const profileInitialState: Partial<ProfileState> = {
  user: null,
  subscribedComics: null,
  isLoading: false,
  error: null,
};

/* Action Types */
export type ProfileAction =
  // Get Profile
  | { type: ProfileActionType.GET_PROFILE_START }
  | { type: ProfileActionType.GET_PROFILE_SUCCESS; payload: ProfileState }
  | { type: ProfileActionType.GET_PROFILE_ERROR; payload: string }
  | { type: ProfileActionType.LOGOUT_PROFILE };

export interface GetMeDetailsParams {
  userClient: ApolloClient<any>;
  storageFunctions: StorageFunctions;
}

export async function getAndSaveMeDetails(
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

// Action Creators
interface LoadProfileByUsernameProps {
  publicClient: ApolloClient<any>;
  username: string;
}

interface LoadPublicProfileByIdProps {
  publicClient: ApolloClient<any>;
  userId: string;
  forceRefresh?: boolean;
}

interface LoadUserProfileByIdProps {
  userClient: ApolloClient<any>;
  userId: string;
  forceRefresh?: boolean;
}

export async function loadProfileByUsername(
  { publicClient, username }: LoadProfileByUsernameProps): Promise<string | null> {
  try {
    // Step 1: Get user ID from username
    const { data: usernameData } = await publicClient.query<
      GetUserByUsernameQuery,
      GetUserByUsernameQueryVariables
    >({
      query: GetUserByUsername,
      variables: { username },
    });

    const userId = usernameData?.getUserByUsername?.id;
    if (!userId) {
      throw new Error('User not found');
    }

    return userId;
  } catch (error: Error | unknown) {
    return null;
  }
}

export async function loadPublicProfileById(
  { publicClient, userId, forceRefresh = false }: LoadPublicProfileByIdProps,
  dispatch?: Dispatch<ProfileAction>
): Promise<ProfileState | null> {
  if (dispatch) dispatch({ type: ProfileActionType.GET_PROFILE_START });
  
  try {
    const { data } = await publicClient.query<
      GetProfileByUserIdQuery,
      GetProfileByUserIdQueryVariables
    >({
      query: GetProfileByUserId,
      variables: { id: userId },
      ...(forceRefresh ? { fetchPolicy: 'network-only' } : {}),
    });

    const parsedData = parseProfileData(data);

    if (dispatch) {
      dispatch({ 
        type: ProfileActionType.GET_PROFILE_SUCCESS, 
        payload: parsedData 
      });
    }

    return parsedData;
  } catch (error: any) {
    const errorMessage = error?.response?.data?.error || 
                        error?.message || 
                        'Failed to load profile';
    
    if (dispatch) {
      dispatch({ 
        type: ProfileActionType.GET_PROFILE_ERROR, 
        payload: errorMessage 
      });
    }
    return null;
  }
}

export async function loadUserProfileById(
  { userClient, userId, forceRefresh = false }: LoadUserProfileByIdProps,
  dispatch?: Dispatch<ProfileAction>
): Promise<ProfileState | null> {
  if (dispatch) dispatch({ type: ProfileActionType.GET_PROFILE_START });
  
  try {
    const { data } = await userClient.query<
      GetProfileByUserIdQuery,
      GetProfileByUserIdQueryVariables
    >({
      query: GetProfileByUserId,
      variables: { id: userId },
      ...(forceRefresh ? { fetchPolicy: 'network-only' } : {}),
    });

    const parsedData = parseProfileData(data);

    if (dispatch) {
      dispatch({ 
        type: ProfileActionType.GET_PROFILE_SUCCESS, 
        payload: parsedData 
      });
    }

    return parsedData;
  } catch (error: any) {
    const errorMessage = error?.response?.data?.error || 
                        error?.message || 
                        'Failed to load profile';
    
    if (dispatch) {
      dispatch({ 
        type: ProfileActionType.GET_PROFILE_ERROR, 
        payload: errorMessage 
      });
    }
    return null;
  }
}

export async function logoutUserProfile(
  dispatch?: Dispatch<ProfileAction>
): Promise<void> {
  if (dispatch) dispatch({ type: ProfileActionType.LOGOUT_PROFILE });
}

export function parseProfileData(data: GetProfileByUserIdQuery): ProfileState {
  return {
    user: data?.getUserById,
    subscribedComics: data?.getUserSubscribedComics?.comicSeries?.filter((comic): comic is ComicSeries => comic !== null) || null,
    isLoading: false,
    error: null,
  };
}

/* Reducer */
export const profileReducer = (
  state: Partial<ProfileState> = profileInitialState,
  action: ProfileAction
): Partial<ProfileState> => {
  switch (action.type) {
    // Get Profile actions
    case ProfileActionType.GET_PROFILE_START:
      return { ...state, isLoading: true, error: null };
    case ProfileActionType.GET_PROFILE_SUCCESS:
      return {
        ...state,
        ...action.payload,
        isLoading: false,
        error: null,
      };
    case ProfileActionType.GET_PROFILE_ERROR:
      return { ...state, isLoading: false, error: action.payload };
    case ProfileActionType.LOGOUT_PROFILE:
      return { ...profileInitialState, isLoading: false, error: null };
    default:
      return state;
  }
};