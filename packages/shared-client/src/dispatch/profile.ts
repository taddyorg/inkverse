import type { Dispatch } from 'react';
import type { ApolloClient } from '@apollo/client';
import type { StorageFunctions, Dispatch as UtilsDispatch, Action } from './utils';
import { asyncAction, ActionTypes, errorHandlerFactory } from './utils';
import { 
  GetMeDetails, 
  type GetMeDetailsQuery, 
  type GetMeDetailsQueryVariables, 
  type User,
  GetUserByUsername,
  type GetUserByUsernameQuery,
  type GetUserByUsernameQueryVariables,
  GetMiniUserById,
  type GetMiniUserByIdQuery,
  type GetMiniUserByIdQueryVariables,
  GetUserById,
  type GetUserByIdQuery,
  type GetUserByIdQueryVariables,
} from '../graphql/operations';

/* Actions */
export const GET_PROFILE = asyncAction(ActionTypes.GET_PROFILE);

export interface ProfileState {
  user: any | null;
  isLoading: boolean;
  error: string | null;
  apolloState?: Record<string, any>;
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

// Action Creators
interface LoadProfileByUsernameProps {
  publicClient: ApolloClient<any>;
  username: string;
}

interface LoadProfileByIdProps {
  publicClient: ApolloClient<any>;
  userClient?: ApolloClient<any>;
  userId: string;
  currentUserId?: string;
}

// Parser function
export function parseProfileData(data: any): ProfileState {
  return {
    user: data?.user || null,
    isLoading: false,
    error: null,
  };
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

// Load profile by ID (for React Native)
export async function loadProfileById(
  { publicClient, userClient, userId, currentUserId }: LoadProfileByIdProps,
  dispatch: UtilsDispatch
) {
  dispatch(GET_PROFILE.request());
  
  try {
    await loadProfileByIdInternal({ publicClient, userClient, userId, currentUserId }, dispatch);
  } catch (error: Error | unknown) {
    errorHandlerFactory(dispatch, GET_PROFILE)(error);
  }
}

// Internal function to load profile by ID (shared logic)
async function loadProfileByIdInternal(
  props: LoadProfileByIdProps,
  dispatch: UtilsDispatch
) {
  const profileData = await fetchUserData(props);
  const parsedData = parseProfileData(profileData);
  dispatch(GET_PROFILE.success(parsedData));
}

// Helper function to fetch user data
export async function fetchUserData(
  { publicClient, userClient, userId, currentUserId }: LoadProfileByIdProps
): Promise<{ user: any }> {
  if (currentUserId && userClient && currentUserId === userId) {
    // It's the current user's profile
    const { data } = await userClient.query<
      GetMiniUserByIdQuery,
      GetMiniUserByIdQueryVariables
    >({
      query: GetMiniUserById,
      variables: { id: userId },
    });
    return { user: data?.getUserById };
  } else {
    // Unauthenticated user or viewing another user's profile
    const { data } = await publicClient.query<
      GetUserByIdQuery,
      GetUserByIdQueryVariables
    >({
      query: GetUserById,
      variables: { id: userId },
    });
    return { user: data?.getUserById };
  }
}

// New reducer for profile loading
export function profileLoaderReducer(state = profileInitialState, action: Action): ProfileState {
  switch (action.type) {
    case GET_PROFILE.REQUEST:
      return {
        ...state,
        isLoading: true,
      };
    case GET_PROFILE.SUCCESS:
      return {
        ...state,
        ...action.payload,
        isLoading: false,
      };
    case GET_PROFILE.FAILURE:
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };
    default:
      return state;
  }
}