import { useEffect, useState, useReducer, useRef } from 'react';
import { Link, useSearchParams } from 'react-router';
import { getUserApolloClient } from '@/lib/apollo/client.client';
import { isAuthenticated } from '@/lib/auth/user';
import { getCannySso, settingsReducer, settingsInitialState } from '@inkverse/shared-client/dispatch/settings';

export default function CannyLogin() {
  const [searchParams] = useSearchParams();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [settingsState, settingsDispatch] = useReducer(settingsReducer, settingsInitialState);
  const hasCheckedAuth = useRef(false);
  const hasRequestedSso = useRef(false);

  useEffect(() => {
    // Check authentication status on mount
    if (!hasCheckedAuth.current) {
      hasCheckedAuth.current = true;
      const authStatus = isAuthenticated();
      setIsLoggedIn(authStatus);
    }
  }, []);

  useEffect(() => {
    // If logged in and we have the required params, get SSO token and redirect
    const redirect = searchParams.get('redirect');
    const companyID = searchParams.get('companyID');
    
    if (isLoggedIn && redirect && companyID && !hasRequestedSso.current && !settingsState.cannySso.isLoading) {
      hasRequestedSso.current = true;
      
      const fetchCannySSO = async () => {
        try {
          const userClient = getUserApolloClient();
          if (!userClient) {
            throw new Error('User client not available');
          }

          const cannyData = await getCannySso({ userClient, redirectPath: redirect }, settingsDispatch);
          
          if (cannyData && cannyData.redirectUrl) {
            // Navigate to the Canny SSO URL
            window.location.href = cannyData.redirectUrl;
          }
        } catch (error) {
          console.error('Error getting Canny SSO:', error);
        }
      };

      fetchCannySSO();
    }
  }, [isLoggedIn, searchParams, settingsState.cannySso.isLoading]);

  // If not logged in, show the message
  if (!isLoggedIn) {
    return (
      <div className="max-w-3xl mx-auto sm:p-6 lg:p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">You need to be logged into Inkverse to access feedback portal. Please click 'Sign Up'</h1>
        </div>
      </div>
    );
  }

  // If logged in but missing params
  if (!searchParams.get('redirect') || !searchParams.get('companyID')) {
    return (
      <div className="max-w-3xl mx-auto sm:p-6 lg:p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Missing required parameters. Go to <a href="https://inkverse.canny.io" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">Inkverse Feedback</a> to try again.</h1>
        </div>
      </div>
    );
  }

  // Show loading state while checking auth or fetching SSO
  if (!hasCheckedAuth.current || settingsState.cannySso.isLoading) {
    return (
      <div className="max-w-3xl mx-auto sm:p-6 lg:p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
        </div>
      </div>
    );
  }

  // Show error if SSO failed
  if (settingsState.cannySso.error) {
    return (
      <div className="max-w-3xl mx-auto sm:p-6 lg:p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Error: {settingsState.cannySso.error}</h1>
        </div>
      </div>
    );
  }

  // Default case - waiting for redirect
  return (
    <div className="max-w-3xl mx-auto sm:p-6 lg:p-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Redirecting to feedback portal...</h1>
      </div>
    </div>
  );
}