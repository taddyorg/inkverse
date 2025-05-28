import { getUserApolloClient } from '@/lib/apollo/client.client';
import { getMetaTags } from '@/lib/seo';
import { useEffect, useReducer } from 'react';
import type { MetaFunction } from 'react-router-dom';
import { useParams, useSearchParams, useNavigate } from 'react-router';
import { 
  hostingProviderReducer, 
  hostingProviderInitialState, 
  fetchRefreshTokenForHostingProvider,
  clearHostingProviderError,
  FETCH_USER_TOKENS,
  type HostingProviderState 
} from '@inkverse/shared-client/dispatch/hosting-provider';
import { saveHostingProviderRefreshToken } from '@/lib/auth/hosting-provider';

export const meta: MetaFunction = () => {
  return getMetaTags(
    'Connecting your account...', 
    'Please wait while we connect your hosting provider account.',
    ''
  );
};

function getErrorMessage(errorParam: string): string {
  switch (errorParam) {
    case 'missing_parameters':
      return 'Missing required parameters for connection.';
    case 'tokens_not_found':
      return 'Could not retrieve authentication tokens.';
    case 'incorrect_hosting_provider':
      return 'Incorrect hosting provider in response.';
    case 'token_invalid_or_expired':
      return 'Authentication token is invalid or expired.';
    case 'user_not_found':
      return 'User account not found.';
    case 'connection_failed':
      return 'Connection to hosting provider failed.';
    default:
      return 'Connection failed. Please try again.';
  }
}

export default function HostingProvider() {
  const { uuid } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(hostingProviderReducer, hostingProviderInitialState);

  const successParam = searchParams.get('success');
  const errorParam = searchParams.get('error');

  useEffect(() => {
    // Handle error from URL params
    if (errorParam) {
      const errorMessage = getErrorMessage(errorParam);
      dispatch(FETCH_USER_TOKENS.failure({ message: errorMessage }));
      return;
    }

    // Handle success case - fetch tokens
    if (successParam === 'true' && uuid && !state.isLoading && !state.refreshToken) {
      const userClient = getUserApolloClient();
      fetchRefreshTokenForHostingProvider({ userClient, hostingProviderUuid: uuid }, dispatch);
      return;
    }

    // Handle redirect after successful connection
    if (state.refreshToken && successParam === 'true' && uuid) {
      //save the refresh token to local storage for hosting provider
      saveHostingProviderRefreshToken(state.refreshToken, uuid);
      const timer = setTimeout(() => {
        navigate('/profile/setup?step=patreon-connected');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [errorParam, successParam, uuid, state.isLoading, state.refreshToken, navigate, dispatch]);

  const handleRetry = () => {
    clearHostingProviderError(dispatch);
    navigate('/profile/setup?step=patreon');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  if (state.error) {
    return (
      <div className="max-w-3xl mx-auto sm:p-6 lg:p-8">
        <div className="p-8 rounded-lg max-w-md w-full mx-auto">
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
            Connection Failed
          </h1>
          <p className="text-gray-700 dark:text-gray-300 mb-6">{state.error}</p>
          <div className="space-y-3">
            <button
              onClick={handleRetry}
              className="w-full bg-brand-pink dark:bg-taddy-blue text-white py-2 px-4 rounded-lg hover:opacity-90 transition-opacity"
            >
              Try Again
            </button>
            <button
              onClick={handleGoHome}
              className="w-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (state.refreshToken) {
    return (
      <div className="max-w-3xl mx-auto sm:p-6 lg:p-8">
        <div className="p-8 rounded-lg max-w-md w-full mx-auto text-center">
          <div className="mb-4">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-4">
            Successfully Connected!
          </h1>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Your hosting provider account has been connected successfully.
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Redirecting you back to setup...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto sm:p-6 lg:p-8">
      <div className="p-8 rounded-lg max-w-md w-full mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Connecting your account...
        </h1>
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          Please wait while we connect your hosting provider account.
        </p>
        <div className="mt-6 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-pink dark:border-taddy-blue"></div>
        </div>
      </div>
    </div>
  );
} 