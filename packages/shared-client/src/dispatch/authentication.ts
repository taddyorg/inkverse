import axios from 'axios';
import type { StorageFunctions } from './utils';
import type { User } from '@inkverse/shared-client/graphql/operations';
import { AuthProvider } from '@inkverse/public/graphql/types';

export interface AuthState {
  user: any | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loadingProvider: AuthProvider | null;
  error: string | null;
}

export const authInitialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  loadingProvider: null,
  error: null,
};

export enum AuthActionType {
  AUTH_START = 'AUTH_START',
  AUTH_START_PROVIDER = 'AUTH_START_PROVIDER',
  AUTH_SUCCESS = 'AUTH_SUCCESS',
  AUTH_ERROR = 'AUTH_ERROR',
  AUTH_LOGOUT = 'AUTH_LOGOUT',
  AUTH_RESET = 'AUTH_RESET',
  AUTH_CLEAR_ERROR = 'AUTH_CLEAR_ERROR',
}

type AuthAction =
  | { type: AuthActionType.AUTH_START }
  | { type: AuthActionType.AUTH_START_PROVIDER; payload: AuthProvider }
  | { type: AuthActionType.AUTH_SUCCESS; payload: { accessToken: string; refreshToken: string; user: User } }
  | { type: AuthActionType.AUTH_ERROR; payload: string }
  | { type: AuthActionType.AUTH_LOGOUT }
  | { type: AuthActionType.AUTH_RESET }
  | { type: AuthActionType.AUTH_CLEAR_ERROR };

export const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case AuthActionType.AUTH_START:
      return { ...state, isLoading: true, error: null };
    case AuthActionType.AUTH_START_PROVIDER:
      return { ...state, isLoading: true, loadingProvider: action.payload, error: null };
    case AuthActionType.AUTH_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
        isAuthenticated: true,
        isLoading: false,
        loadingProvider: null,
        error: null,
      };
    case AuthActionType.AUTH_ERROR:
      return { ...state, isLoading: false, loadingProvider: null, error: action.payload };
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
  storageFunctions?: StorageFunctions;
  onSuccessFunction?: () => void;
  includeCredentials?: boolean; // For web - to receive Set-Cookie headers
}

export async function dispatchExchangeOTPForTokens(
  { baseUrl, otp, storageFunctions, onSuccessFunction, includeCredentials = false }: DispatchExchangeOTPParams,
  dispatch?: React.Dispatch<AuthAction>
): Promise<void> {
  if (dispatch) dispatch({ type: AuthActionType.AUTH_START });

  try {
    const response = await axios.post(
      `${baseUrl}/exchange-otp`, 
      { otp },
      { withCredentials: includeCredentials }
    );

    if (!response.data.accessToken || !response.data.refreshToken || !response.data.user) {
      throw new Error('Failed to verify OTP');
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
      onSuccessFunction?.();
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
  source: 'ios' | 'android' | 'web';
  storageFunctions?: StorageFunctions;
  onSuccessFunction?: () => void;
  includeCredentials?: boolean; // For web - to receive Set-Cookie headers
}

/**
 * Authenticates a user with Google and stores tokens using provided storage functions
 */
export async function dispatchLoginWithGoogle(
  { baseUrl, googleIdToken, source, storageFunctions, onSuccessFunction, includeCredentials = false }: DispatchLoginWithGoogleParams,
  dispatch?: React.Dispatch<AuthAction>
): Promise<void> {
  if (dispatch) { dispatch({ type: AuthActionType.AUTH_START_PROVIDER, payload: AuthProvider.GOOGLE }); }

  try {
    const response = await axios.post(
      `${baseUrl}/login-with-google`, 
      { googleIdToken, source },
      { withCredentials: includeCredentials }
    );

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
      onSuccessFunction?.();
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
  storageFunctions?: StorageFunctions;
  includeCredentials?: boolean; // For web - to receive Set-Cookie headers
  onSuccessFunction?: () => void;
}

export async function dispatchLoginWithApple(
  { baseUrl, idToken, storageFunctions, includeCredentials = false, onSuccessFunction }: DispatchLoginWithAppleParams,
  dispatch?: React.Dispatch<AuthAction>
): Promise<void> {
  if (dispatch) dispatch({ type: AuthActionType.AUTH_START_PROVIDER, payload: AuthProvider.APPLE });

  try {
    const response = await axios.post(
      `${baseUrl}/login-with-apple`, 
      { id_token: idToken },
      { withCredentials: includeCredentials }
    );

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
      onSuccessFunction?.();
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
  refreshToken?: string; // Optional - for mobile/non-cookie environments
  includeCredentials?: boolean; // For web - includes cookies in request
}

export async function dispatchRefreshAccessToken(
  { baseUrl, refreshToken, includeCredentials = false }: DispatchRefreshAccessTokenParams
): Promise<string> {
  try {

    const response = await axios.post(
      `${baseUrl}/exchange-refresh-token-for-access-token`, 
      { token: refreshToken }, 
      { withCredentials: includeCredentials } // This ensures cookies are sent
    );

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
  refreshToken?: string; // Optional - for mobile/non-cookie environments
  includeCredentials?: boolean; // For web - includes cookies in request
}

export async function dispatchRefreshRefreshToken(
  { baseUrl, refreshToken, includeCredentials = false }: DispatchRefreshRefreshTokenParams
): Promise<string> {
  try {
    
    const response = await axios.post(
      `${baseUrl}/exchange-refresh-token-for-refresh-token`, 
      { token: refreshToken }, 
      { withCredentials: includeCredentials } // This ensures cookies are sent
    );

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