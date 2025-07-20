import type { ApolloClient } from '@apollo/client';
import { CannySso } from '../graphql/operations';
import type { CannySsoQuery } from '../graphql/operations';

// Action types enum - structured to support multiple settings operations
export enum SettingsActionType {
  // Canny SSO actions
  GET_CANNY_SSO_START = 'GET_CANNY_SSO_START',
  GET_CANNY_SSO_SUCCESS = 'GET_CANNY_SSO_SUCCESS',
  GET_CANNY_SSO_ERROR = 'GET_CANNY_SSO_ERROR',
  // Add more settings actions here as needed in the future
}

// Action types union
export type SettingsAction =
  // Canny SSO actions
  | { type: SettingsActionType.GET_CANNY_SSO_START }
  | { type: SettingsActionType.GET_CANNY_SSO_SUCCESS; payload: CannySsoData }
  | { type: SettingsActionType.GET_CANNY_SSO_ERROR; payload: string };
  // Add more action types here as needed

// State type
export type SettingsState = {
  // Canny SSO state
  cannySso: {
    isLoading: boolean;
    error: string | null;
    redirectUrl: string | null;
    ssoToken: string | null;
  };
  // Add more settings state sections here as needed
};

// Data types
export type CannySsoData = {
  redirectUrl: string;
  ssoToken: string;
};

// Initial state
export const settingsInitialState: SettingsState = {
  cannySso: {
    isLoading: false,
    error: null,
    redirectUrl: null,
    ssoToken: null,
  },
  // Initialize more settings sections here as needed
};

// Props for the Canny SSO action creator
export type GetCannySsoProps = {
  userClient: ApolloClient<any>;
};

// Canny SSO action creator
export async function getCannySso(
  { userClient }: GetCannySsoProps,
  dispatch?: React.Dispatch<SettingsAction>
): Promise<CannySsoData | null> {
  if (dispatch) dispatch({ type: SettingsActionType.GET_CANNY_SSO_START });

  try {
    const result = await userClient.query<CannySsoQuery>({
      query: CannySso,
      fetchPolicy: 'network-only', // Always get fresh token
    });

    if (!result.data?.cannySso) {
      throw new Error('No SSO data returned');
    }

    const cannyData: CannySsoData = {
      redirectUrl: result.data.cannySso.redirectUrl,
      ssoToken: result.data.cannySso.ssoToken,
    };

    if (dispatch) {
      dispatch({ 
        type: SettingsActionType.GET_CANNY_SSO_SUCCESS, 
        payload: cannyData 
      });
    }
    
    return cannyData;
  } catch (error: any) {
    const errorMessage = error?.message || 'Failed to get Canny SSO token';
    
    if (dispatch) {
      dispatch({ 
        type: SettingsActionType.GET_CANNY_SSO_ERROR, 
        payload: errorMessage 
      });
    }
    return null;
  }
}

// Reducer
export function settingsReducer(
  state: SettingsState = settingsInitialState,
  action: SettingsAction
): SettingsState {
  switch (action.type) {
    // Canny SSO cases
    case SettingsActionType.GET_CANNY_SSO_START:
      return { 
        ...state, 
        cannySso: {
          ...state.cannySso,
          isLoading: true,
          error: null 
        }
      };
    case SettingsActionType.GET_CANNY_SSO_SUCCESS:
      return { 
        ...state, 
        cannySso: {
          isLoading: false,
          error: null,
          redirectUrl: action.payload.redirectUrl,
          ssoToken: action.payload.ssoToken
        }
      };
    case SettingsActionType.GET_CANNY_SSO_ERROR:
      return { 
        ...state, 
        cannySso: {
          isLoading: false,
          error: action.payload,
          redirectUrl: null,
          ssoToken: null
        }
      };
    // Add more cases here as needed
    default:
      return state;
  }
}