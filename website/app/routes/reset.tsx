import { useEffect, useReducer, useState } from 'react';
import { redirect, useSearchParams, useNavigate } from 'react-router';
import { type LoaderFunctionArgs, type MetaFunction } from "react-router";
import { getApolloClient } from '@/lib/apollo/client.client';
import { 
  dispatchExchangeOTPForTokens,
  authReducer,
  authInitialState,
  AuthActionType
} from '@inkverse/shared-client/dispatch/authentication';
import { getMetaTags } from '@/lib/seo';
import config from '@/config';

export default function Reset() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [authState, dispatch] = useReducer(authReducer, authInitialState);
  const [hasAttempted, setHasAttempted] = useState(false);

  useEffect(() => {
    const handleTokenExchange = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        navigate('/');
        return;
      }

      if (hasAttempted) {
        return;
      }

      setHasAttempted(true);
      dispatch({ type: AuthActionType.AUTH_START });

      try {
        await dispatchExchangeOTPForTokens(
          { baseUrl: config.AUTH_URL, otp: token },
          (action) => dispatch(action as any)
        );
      } catch (error: any) {
        dispatch({ type: AuthActionType.AUTH_ERROR, payload: error.message });
      }
    };

    handleTokenExchange();
  }, [searchParams, navigate, hasAttempted]);

  useEffect(() => {
    if (authState.isAuthenticated && authState.user) {
      // Check if user needs to complete their profile
      if (!authState.user.username || !authState.user.ageRange) {
        navigate('/profile/setup');
      } else {
        navigate('/');
      }
    }
  }, [authState.isAuthenticated, authState.user, navigate]);

  if (authState.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Authentication Error</h1>
          <p className="text-gray-700 dark:text-gray-300 mb-6">{authState.error}</p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-brand-pink dark:bg-taddy-blue text-white py-2 px-4 rounded-lg hover:opacity-90 transition-opacity"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Verifying your email...</h1>
        <p className="text-gray-700 dark:text-gray-300">Please wait while we verify your authentication token.</p>
        <div className="mt-6 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-pink dark:border-taddy-blue"></div>
        </div>
      </div>
    </div>
  );
}

export const meta: MetaFunction = ({ data }) => {
  return getMetaTags(
    "Logging in...",
    "Please wait while we verify your authentication token.",
    "https://inkverse.co/reset"
  );

};