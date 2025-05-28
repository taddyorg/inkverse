import { useState, useEffect, useReducer, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { type LoaderFunctionArgs } from "react-router";
import config from '@/config';
import { getUserApolloClient } from '@/lib/apollo/client.client';
import { UserAgeRange } from '@inkverse/public/graphql/types';
import { getMetaTags } from '@/lib/seo';
import { 
  userDetailsReducer,
  userDetailsInitialState,
  updateUsername,
  updateAgeRange,
  saveBlueskyDid,
  getBlueskyFollowers,
  verifyBlueskyHandle,
  UserDetailsActionType
} from '@inkverse/shared-client/dispatch/user-details';
import { GetCurrentUser } from '@inkverse/shared-client/graphql/operations';
import { getUserDetails, webStorageFunctions } from '@/lib/auth/user';
import { getAuthorizationCodeUrl } from '@inkverse/public/hosting-providers';
import { MdArrowBack } from 'react-icons/md';

import { SetupUsername } from '@/app/components/profile/SetupUsername';
import { SetupAge } from '@/app/components/profile/SetupAge';
import { SetupBluesky } from '@/app/components/profile/SetupBluesky';
import { SetupPatreon } from '@/app/components/profile/SetupPatreon';
import { SetupComplete } from '@/app/components/profile/SetupComplete';
import { isValidDomain } from '@inkverse/shared-client/utils/common';

type SetupStep = 'username' | 'age' | 'patreon' | 'patreon-connected' | 'bluesky' | 'bluesky-verify' | 'bluesky-connected' | 'complete';
const TADDY_PROVIDER_UUID = 'e9957105-80e4-46e3-8e82-20472b9d7512'; // Needed just for this screen

export default function AccountSetup() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState<SetupStep>('username');
  const [username, setUsername] = useState('');
  const [ageRange, setAgeRange] = useState<UserAgeRange | ''>('');
  const [birthYear, setBirthYear] = useState('');
  const [blueskyHandle, setBlueskyHandle] = useState('');
  const [userDetailsState, dispatch] = useReducer(userDetailsReducer, userDetailsInitialState);
  const [isInitializing, setIsInitializing] = useState(true);
  const userClientRef = useRef<ReturnType<typeof getUserApolloClient> | null>(null);

  // Fetch user details on mount to determine current step
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const userClient = getUserApolloClient();
        userClientRef.current = userClient;
        
        const { data } = await userClient.query({
          query: GetCurrentUser,
          fetchPolicy: 'network-only' // Always get fresh data
        });

        if (data?.me) {
          const user = data.me;
          
          // If username is already set, move to age step
          if (user.username) {
            setUsername(user.username);
            
            // If age is also set, check for Bluesky
            if (user.ageRange) {
              setAgeRange(user.ageRange);
              
              // Otherwise go to Patreon step
              setCurrentStep('patreon');
            } else {
              // Otherwise go to age step
              setCurrentStep('age');
            }
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

    if (!userClientRef.current) return;

    try {
      // Validate username
      if (!username.trim()) {
        throw new Error('Username is required');
      }

      // Update username via API
      await updateUsername(
        { 
          userClient: userClientRef.current,
          username: username.trim(),
          storageFunctions: webStorageFunctions,
        },
        dispatch
      );

      // Save username and move to next step
      setCurrentStep('age');
    } catch (err: any) {
      // Error is handled by the dispatch function
    }
  };

  const handleAgeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: UserDetailsActionType.USER_DETAILS_CLEAR_ERROR });

    if (!userClientRef.current) return;

    try {
      // Validate inputs
      if (!ageRange) {
        throw new Error('Age range is required');
      }
      if (ageRange === UserAgeRange.UNDER_18 && !birthYear) {
        throw new Error('Birth year is required for users under 18');
      }

      // Update age range via API
      await updateAgeRange(
        { 
          userClient: userClientRef.current,
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
    } else if (currentStep === 'patreon' || currentStep === 'patreon-connected') {
      setCurrentStep('age');
    } else if (currentStep === 'bluesky') {
      setCurrentStep('patreon');
    } else if (currentStep === 'bluesky-verify') {
      setCurrentStep('bluesky');
    } else if (currentStep === 'bluesky-connected') {
      setCurrentStep('bluesky');
    }
  };

  const handleBlueskyVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: UserDetailsActionType.USER_DETAILS_CLEAR_ERROR });

    if (!userClientRef.current) return;

    if (!isValidDomain(blueskyHandle)) {
      dispatch({ type: UserDetailsActionType.USER_DETAILS_ERROR, payload: 'Invalid Bluesky handle. Make sure you use your full handle (ex: yourhandle.bsky.social)' });
      return;
    }

    try {
      // Verify the Bluesky handle
      await verifyBlueskyHandle(
        { 
          userClient: userClientRef.current,
          handle: blueskyHandle.trim() 
        },
        dispatch
      );

      setCurrentStep('bluesky-verify');
    } catch (err: any) {
      // Error is handled by the dispatch function
    }
  };

  const handleBlueskyConfirm = async (did: string) => {
    dispatch({ type: UserDetailsActionType.USER_DETAILS_CLEAR_ERROR });

    if (!userClientRef.current) return;

    try {
      console.log('Saving Bluesky DID:', did);
      // Save Bluesky DID
      await saveBlueskyDid(
        { 
          userClient: userClientRef.current,
          did,
        },
        dispatch
      );

      // Get followers after saving DID
      await getBlueskyFollowers(
        { userClient: userClientRef.current },
        dispatch
      );

      setCurrentStep('bluesky-connected');
    } catch (err: any) {
      // Error is handled by the dispatch function
    }
  };

  const handlePatreonConnect = async () => {
    const user = getUserDetails();
    
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
  };


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
        <div className="flex items-center justify-center relative mb-2">
          {currentStep !== 'username' && (
            <button
              onClick={handleBack}
              className="absolute left-0 p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <MdArrowBack size={24} />
            </button>
          )}
          {currentStep === 'username' && 
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Complete your profile</h1>
          }
        </div>

        {/* Username Step */}
        {currentStep === 'username' && (
          <SetupUsername
            username={username}
            setUsername={setUsername}
            userDetailsState={userDetailsState}
            onSubmit={handleUsernameSubmit}
          />
        )}

        {/* Age Step */}
        {currentStep === 'age' && (
          <SetupAge
            ageRange={ageRange}
            setAgeRange={setAgeRange}
            birthYear={birthYear}
            setBirthYear={setBirthYear}
            userDetailsState={userDetailsState}
            onSubmit={handleAgeSubmit}
          />
        )}

        {/* Patreon Steps */}
        {(currentStep === 'patreon' || currentStep === 'patreon-connected') && (
          <SetupPatreon
            currentStep={currentStep}
            onConnect={handlePatreonConnect}
            onSkip={() => {
              setCurrentStep('bluesky');
            }}
            onBack={handleBack}
            onContinue={() => {
              setCurrentStep('bluesky');
            }}
          />
        )}

        {/* Bluesky Steps */}
        {(currentStep === 'bluesky' || currentStep === 'bluesky-verify' || currentStep === 'bluesky-connected') && (
          <SetupBluesky
            blueskyHandle={blueskyHandle}
            setBlueskyHandle={setBlueskyHandle}
            userDetailsState={userDetailsState}
            currentStep={currentStep}
            onVerify={handleBlueskyVerify}
            onConfirm={handleBlueskyConfirm}
            onBack={handleBack}
            onSkip={() => setCurrentStep('complete')}
            onContinue={() => setCurrentStep('complete')}
          />
        )}

        {/* Complete Step */}
        {currentStep === 'complete' && <SetupComplete username={username} />}
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