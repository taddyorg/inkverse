import axios from 'axios';
import type { AuthResponse, User } from '../graphql/types';

export interface AuthState {
  user: any | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Interface for token storage functions that will be passed to authentication methods
 * Each client (web, mobile) can implement these differently based on their storage mechanism
 */
export interface StorageFunctions {
  /** Function to save the access token (e.g., to localStorage, SecureStore, etc.) */
  saveAccessToken: (token: string) => Promise<void> | void;
  /** Function to save the refresh token */
  saveRefreshToken: (token: string) => Promise<void> | void;
  /** Optional function to save user details */
  saveUserDetails: (user: Partial<User>) => Promise<void> | void;
}

export const authInitialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

export enum AuthActionType {
  AUTH_START = 'AUTH_START',
  AUTH_SUCCESS = 'AUTH_SUCCESS',
  AUTH_ERROR = 'AUTH_ERROR',
  AUTH_LOGOUT = 'AUTH_LOGOUT',
  AUTH_RESET = 'AUTH_RESET',
  AUTH_CLEAR_ERROR = 'AUTH_CLEAR_ERROR',
}

type AuthAction =
  | { type: AuthActionType.AUTH_START }
  | { type: AuthActionType.AUTH_SUCCESS; payload: AuthResponse }
  | { type: AuthActionType.AUTH_ERROR; payload: string }
  | { type: AuthActionType.AUTH_LOGOUT }
  | { type: AuthActionType.AUTH_RESET }
  | { type: AuthActionType.AUTH_CLEAR_ERROR };

export const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case AuthActionType.AUTH_START:
      return { ...state, isLoading: true, error: null };
    case AuthActionType.AUTH_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case AuthActionType.AUTH_ERROR:
      return { ...state, isLoading: false, error: action.payload };
    case AuthActionType.AUTH_RESET:
    case AuthActionType.AUTH_LOGOUT:
      return authInitialState;
    case AuthActionType.AUTH_CLEAR_ERROR:
      return { ...state, error: null };
    default:
      return state;
  }
};

interface DispatchLoginWithEmailParams {
  baseUrl: string;
  email: string;
}

export async function dispatchLoginWithEmail(
  { baseUrl, email }: DispatchLoginWithEmailParams,
  dispatch?: React.Dispatch<AuthAction>
): Promise<void> {
  if (dispatch) dispatch({ type: AuthActionType.AUTH_START });

  try {
    const response = await axios.post(`${baseUrl}/login-with-email`, { email });

    if (!response.data.success) {
      throw new Error('Failed to send magic link');
    }

    // Magic link sent successfully - no auth tokens yet
  } catch (error: any) {
    if (dispatch) {
      dispatch({ type: AuthActionType.AUTH_ERROR, payload: error.response?.data?.error || error.message });
    }
    throw error;
  }
}

interface DispatchExchangeOTPParams {
  baseUrl: string;
  otp: string;
}

export async function dispatchExchangeOTPForTokens(
  { baseUrl, otp }: DispatchExchangeOTPParams,
  dispatch?: React.Dispatch<AuthAction>
): Promise<void> {
  if (dispatch) dispatch({ type: AuthActionType.AUTH_START });

  try {
    const response = await axios.post(`${baseUrl}/exchange-otp`, { otp });

    if (!response.data.accessToken || !response.data.refreshToken || !response.data.user) {
      throw new Error('Failed to verify OTP');
    }

    if (dispatch) {
      dispatch({ type: AuthActionType.AUTH_SUCCESS, payload: response.data });
    }
  } catch (error: any) {
    if (dispatch) {
      dispatch({ type: AuthActionType.AUTH_ERROR, payload: error.response?.data?.error || error.message });
    }
    throw error;
  }
}

interface DispatchLoginWithGoogleParams {
  baseUrl: string;
  googleIdToken: string;
  storageFunctions?: StorageFunctions;
}

/**
 * Authenticates a user with Google and stores tokens using provided storage functions
 */
export async function dispatchLoginWithGoogle(
  { baseUrl, googleIdToken, storageFunctions }: DispatchLoginWithGoogleParams,
  dispatch?: React.Dispatch<AuthAction>
): Promise<void> {
  if (dispatch) dispatch({ type: AuthActionType.AUTH_START });

  try {
    const response = await axios.post(`${baseUrl}/login-with-google`, { googleIdToken });

    if (!response.data.accessToken || !response.data.refreshToken || !response.data.user) {
      throw new Error('Failed to login with Google');
    }

    // Store tokens using provided storage functions
    if (storageFunctions) {
      await Promise.all([
        storageFunctions.saveAccessToken(response.data.accessToken),
        storageFunctions.saveRefreshToken(response.data.refreshToken),
        storageFunctions.saveUserDetails(response.data.user)
      ].filter(Boolean)); // Filter out undefined promises
    }

    if (dispatch) {
      dispatch({ type: AuthActionType.AUTH_SUCCESS, payload: response.data });
    }
  } catch (error: any) {
    if (dispatch) {
      dispatch({ type: AuthActionType.AUTH_ERROR, payload: error.response?.data?.error || error.message });
    }
    throw error;
  }
}

interface DispatchLoginWithAppleParams {
  baseUrl: string;
  idToken: string;
  code?: string;
  storageFunctions?: StorageFunctions;
}

export async function dispatchLoginWithApple(
  { baseUrl, idToken, code, storageFunctions }: DispatchLoginWithAppleParams,
  dispatch?: React.Dispatch<AuthAction>
): Promise<void> {
  if (dispatch) dispatch({ type: AuthActionType.AUTH_START });

  try {
    const response = await axios.post(`${baseUrl}/login-with-apple`, { id_token: idToken, code });

    if (!response.data.accessToken || !response.data.refreshToken || !response.data.user) {
      throw new Error('Failed to login with Apple');
    }

    // Store tokens using provided storage functions
    if (storageFunctions) {
      await Promise.all([
        storageFunctions.saveAccessToken(response.data.accessToken),
        storageFunctions.saveRefreshToken(response.data.refreshToken),
        storageFunctions.saveUserDetails(response.data.user)
      ].filter(Boolean)); // Filter out undefined promises
    }

    if (dispatch) {
      dispatch({ type: AuthActionType.AUTH_SUCCESS, payload: response.data });
    }
  } catch (error: any) {
    if (dispatch) {
      dispatch({ type: AuthActionType.AUTH_ERROR, payload: error.response?.data?.error || error.message });
    }
    throw error;
  }
}

interface DispatchRefreshAccessTokenParams {
  baseUrl: string;
  refreshToken: string;
}

export async function dispatchRefreshAccessToken(
  { baseUrl, refreshToken }: DispatchRefreshAccessTokenParams
): Promise<string> {
  try {

    const response = await axios.post(`${baseUrl}/exchange-refresh-token-for-access-token`, {}, {
      headers: {
        'Authorization': `Bearer ${refreshToken}`
      }
    });

    if (!response.data.accessToken) {
      throw new Error('Failed to refresh access token');
    }

    return response.data.accessToken;
  } catch (error: any) {
    throw error;
  }
}

interface DispatchRefreshRefreshTokenParams {
  baseUrl: string;
  refreshToken: string;
}

export async function dispatchRefreshRefreshToken(
  { baseUrl, refreshToken }: DispatchRefreshRefreshTokenParams
): Promise<string> {
  try {
    const response = await axios.post(`${baseUrl}/exchange-refresh-token-for-refresh-token`, {}, {
      headers: {
        'Authorization': `Bearer ${refreshToken}`
      }
    });

    if (!response.data.refreshToken) {
      throw new Error('Failed to refresh refresh token');
    }

    return response.data.refreshToken;
  } catch (error: any) {
    throw error;
  }
}

export function logout(dispatch: React.Dispatch<AuthAction>): void {
  // Clear tokens from storage
  // TODO: Implement token storage clearing
  
  dispatch({ type: AuthActionType.AUTH_LOGOUT });
}

export function clearAuthError(dispatch: React.Dispatch<AuthAction>): void {
  dispatch({ type: AuthActionType.AUTH_CLEAR_ERROR });
}