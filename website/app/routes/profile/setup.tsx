import { useState, useEffect, useReducer } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { type LoaderFunctionArgs } from "react-router";
import { getUserApolloClient } from '@/lib/apollo/client.client';
import { type ApolloClient } from '@apollo/client';
import { UserAgeRange } from '@inkverse/public/graphql/types';
import { getMetaTags } from '@/lib/seo';
import { 
  userDetailsReducer,
  userDetailsInitialState,
  updateUsername,
  updateAgeRange,
  UserDetailsActionType
} from '@inkverse/shared-client/dispatch/user-details';
import { GetCurrentUser } from '@inkverse/shared-client/graphql/operations';
import { getUserDetails, webStorageFunctions } from '@/lib/auth/user';
import { getAuthorizationCodeUrl } from '@inkverse/public/hosting-providers';
import config from '@/config';

type SetupStep = 'username' | 'age' | 'patreon' | 'complete';
const TADDY_PROVIDER_UUID = 'e9957105-80e4-46e3-8e82-20472b9d7512'; // Needed just for this screen

export default function AccountSetup() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState<SetupStep>('username');
  const [username, setUsername] = useState('');
  const [ageRange, setAgeRange] = useState<UserAgeRange | ''>('');
  const [birthYear, setBirthYear] = useState('');
  const [userDetailsState, dispatch] = useReducer(userDetailsReducer, userDetailsInitialState);
  const [savedUsername, setSavedUsername] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch user details on mount to determine current step
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const userClient = getUserApolloClient() as ApolloClient<any>;
        const { data } = await userClient.query({
          query: GetCurrentUser,
          fetchPolicy: 'network-only' // Always get fresh data
        });

        if (data?.me) {
          const user = data.me;
          setUserId(user.id);
          
          // If username is already set, move to age step
          if (user.username) {
            setSavedUsername(user.username);
            setUsername(user.username);
            
            // If age is also set, redirect to home
            if (user.ageRange) {
              navigate('/');
              return;
            }
            
            // Otherwise go to age step
            setCurrentStep('age');
          }
          // If no username, stay on username step
        }
      } catch (error) {
        // If there's an error fetching user (e.g., not authenticated),
        // stay on username step
        console.error('Error fetching user details:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    fetchUserDetails();
  }, [navigate]);

  // Update URL when step changes
  useEffect(() => {
    if (!isInitializing) {
      setSearchParams({ step: currentStep });
    }
  }, [currentStep, setSearchParams, isInitializing]);

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: UserDetailsActionType.USER_DETAILS_CLEAR_ERROR });

    try {
      // Validate username
      if (!username.trim()) {
        throw new Error('Username is required');
      }

      // Update username via API
      const userClient = getUserApolloClient() as ApolloClient<any>;
      await updateUsername(
        { 
          userClient,
          username: username.trim(),
          storageFunctions: webStorageFunctions,
        },
        dispatch
      );

      // Save username and move to next step
      setSavedUsername(username.trim());
      setCurrentStep('age');
    } catch (err: any) {
      // Error is handled by the dispatch function
    }
  };

  const handleAgeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: UserDetailsActionType.USER_DETAILS_CLEAR_ERROR });

    try {
      // Validate inputs
      if (!ageRange) {
        throw new Error('Age range is required');
      }
      if (ageRange === UserAgeRange.UNDER_18 && !birthYear) {
        throw new Error('Birth year is required for users under 18');
      }

      // Update age range via API
      const userClient = getUserApolloClient() as ApolloClient<any>;
      await updateAgeRange(
        { 
          userClient,
          ageRange,
          birthYear: birthYear ? parseInt(birthYear) : undefined,
        },
        dispatch
      );

      // Move to patreon step
      setCurrentStep('patreon');
    } catch (err: any) {
      // Error is handled by the dispatch function
    }
  };

  const handleBack = () => {
    if (currentStep === 'age') {
      setCurrentStep('username');
    } else if (currentStep === 'patreon') {
      setCurrentStep('age');
    }
  };

  const currentYear = new Date().getFullYear();
  const minYear = currentYear - 100;
  const maxYear = currentYear - 13; // Must be at least 13 years old

  // Progress indicator
  const steps = ['username', 'age', 'patreon'];
  const currentStepIndex = steps.indexOf(currentStep === 'complete' ? 'patreon' : currentStep);

  // Show loading state while fetching initial user data
  if (isInitializing) {
    return (
      <div className="mx-auto sm:p-6 lg:p-8 zoomed-in:max-w-3xl max-w-xl">
        <div className="p-8 rounded-lg w-full flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-pink dark:border-taddy-blue mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto sm:p-6 lg:p-8 zoomed-in:max-w-3xl max-w-xl">
      <div className="p-8 rounded-lg w-full">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 text-center">Complete Your Profile</h1>

        {/* Username Step */}
        {currentStep === 'username' && (
          <form onSubmit={handleUsernameSubmit} className="space-y-4">
            <div className="mt-4">
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mt-2 mb-1">
                Choose a username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 mb-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-pink dark:focus:ring-taddy-blue text-inkverse-black bg-white"
                placeholder="Enter your username"
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={userDetailsState.isLoading}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                userDetailsState.isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-brand-pink dark:bg-taddy-blue text-white hover:opacity-90'
              }`}
            >
              {userDetailsState.isLoading ? 'Saving...' : 'Continue'}
            </button>

            {userDetailsState.error && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">
                  {userDetailsState.error}
                </div>
              )}
          </form>
        )}

        {/* Age Step */}
        {currentStep === 'age' && (
          <form onSubmit={handleAgeSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 mt-4">
                Select your age range
              </label>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setAgeRange(UserAgeRange.UNDER_18)}
                  className={`p-4 rounded-lg font-medium transition-colors border-2 ${
                    ageRange === UserAgeRange.UNDER_18
                      ? 'border-brand-pink dark:border-taddy-blue bg-brand-pink/10 dark:bg-taddy-blue/10 text-brand-pink dark:text-taddy-blue'
                      : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  Under 18
                </button>
                <button
                  type="button"
                  onClick={() => setAgeRange(UserAgeRange.AGE_18_24)}
                  className={`p-4 rounded-lg font-medium transition-colors border-2 ${
                    ageRange === UserAgeRange.AGE_18_24
                      ? 'border-brand-pink dark:border-taddy-blue bg-brand-pink/10 dark:bg-taddy-blue/10 text-brand-pink dark:text-taddy-blue'
                      : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  18 to 24
                </button>
                <button
                  type="button"
                  onClick={() => setAgeRange(UserAgeRange.AGE_25_34)}
                  className={`p-4 rounded-lg font-medium transition-colors border-2 ${
                    ageRange === UserAgeRange.AGE_25_34
                      ? 'border-brand-pink dark:border-taddy-blue bg-brand-pink/10 dark:bg-taddy-blue/10 text-brand-pink dark:text-taddy-blue'
                      : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  25 to 34
                </button>
                <button
                  type="button"
                  onClick={() => setAgeRange(UserAgeRange.AGE_35_PLUS)}
                  className={`p-4 rounded-lg font-medium transition-colors border-2 ${
                    ageRange === UserAgeRange.AGE_35_PLUS
                      ? 'border-brand-pink dark:border-taddy-blue bg-brand-pink/10 dark:bg-taddy-blue/10 text-brand-pink dark:text-taddy-blue'
                      : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  35+
                </button>
              </div>
            </div>

            {ageRange === UserAgeRange.UNDER_18 && (
              <div>
                <label htmlFor="birthYear" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Birth Year
                </label>
                <select
                  id="birthYear"
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-pink dark:focus:ring-taddy-blue text-inkverse-black dark:text-white bg-white dark:bg-gray-700"
                  required
                >
                  <option value="">Select your birth year</option>
                  {Array.from({ length: 18 }, (_, i) => currentYear - 17 + i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 py-3 mt-4 px-4 rounded-lg font-medium transition-colors border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={userDetailsState.isLoading}
                className={`flex-1 py-3 px-4 mt-4 rounded-lg font-medium transition-colors ${
                  userDetailsState.isLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-brand-pink dark:bg-taddy-blue text-white hover:opacity-90'
                }`}
              >
                {userDetailsState.isLoading ? 'Saving...' : 'Complete Setup'}
              </button>
            </div>
          </form>
        )}

        {/* Patreon Connection Step */}
        {currentStep === 'patreon' && (
          <div className="space-y-4">
            <div className="text-center mt-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Connect with Patreon
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Follow the creators you support on Patreon to see their exclusive content on Inkverse
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={async () => {                  
                  const user  = getUserDetails();
                  
                  if (!user || !user.id) {
                    console.error('User not found');
                    return;
                  }

                  const authUrl = getAuthorizationCodeUrl({
                    hostingProviderUuid: TADDY_PROVIDER_UUID,
                    clientId: config.TADDY_CLIENT_ID,
                    clientUserId: user.id,
                  });

                  //open auth url in new tab
                  window.open(authUrl, '_blank');

                }}
                className="w-full py-3 px-4 rounded-lg font-medium transition-colors bg-[#FF424D] text-white hover:bg-[#E63946] flex items-center justify-center gap-2"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7.003 3.5C5.897 3.5 5 4.397 5 5.503v13C5 19.607 5.897 20.5 7.003 20.5H8.5V3.5H7.003zm8.443 0c-2.734 0-4.947 2.213-4.947 4.946c0 2.734 2.213 4.947 4.947 4.947c2.734 0 4.948-2.213 4.948-4.947c0-2.733-2.214-4.946-4.948-4.946z"/>
                </svg>
                Connect with Patreon
              </button>

              <button
                onClick={() => {
                  // Skip Patreon connection
                  setCurrentStep('complete');
                  setTimeout(() => {
                    navigate('/');
                  }, 500);
                }}
                className="w-full py-3 px-4 rounded-lg font-medium transition-colors border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Skip for now
              </button>
            </div>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={handleBack}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 underline"
              >
                Back to previous step
              </button>
            </div>
          </div>
        )}

        {/* Complete Step */}
        {currentStep === 'complete' && (
          <div className="text-center py-8">
            <div className="mb-4">
              <svg className="w-16 h-16 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Profile setup complete!
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Redirecting you to the home page...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export async function loader({ params, request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const seoMetaData = getMetaTags(url.href);
  
  return {
    seoMetaData,
  };
}