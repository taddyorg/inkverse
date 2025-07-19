import { useState, useEffect, useReducer, useRef } from 'react';
import { Link, useLoaderData, useSearchParams, type LoaderFunctionArgs, type MetaFunction } from 'react-router';
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
  verifyBlueskyHandle,
  followComicsFromBlueskyCreators,
  getComicsFromPatreonCreators,
  subscribeToComics,
  subscribeToPatreonComics,
  UserDetailsActionType,
  getComicsFromBlueskyCreators
} from '@inkverse/shared-client/dispatch/user-details';
import { getUserDetails, webStorageFunctions } from '@/lib/auth/user';
import { getAuthorizationCodeUrl } from '@inkverse/public/hosting-providers';
import { MdArrowBack } from 'react-icons/md';

import { SetupUsername } from '@/app/components/profile/SetupUsername';
import { SetupAge } from '@/app/components/profile/SetupAge';
import { SetupBluesky } from '@/app/components/profile/SetupBluesky';
import { SetupPatreon } from '@/app/components/profile/SetupPatreon';
import { SetupComplete } from '@/app/components/profile/SetupComplete';
import { PatreonConnected } from '@/app/components/profile/PatreonConnected';
import { BlueskyConnected } from '@/app/components/profile/BlueskyConnected';
import { isValidDomain } from '@inkverse/shared-client/utils/common';
import { localStorageSet } from '@/lib/storage/local';
import { inkverseWebsiteUrl } from '@inkverse/public/utils';
import { loadProfileEdit } from '@/lib/loader/profile-edit.server';

type SetupStep = 'username' | 'age' | 'patreon' | 'patreon-connected' | 'bluesky' | 'bluesky-verify' | 'bluesky-connected' | 'complete';
const TADDY_PROVIDER_UUID = 'e9957105-80e4-46e3-8e82-20472b9d7512'; // Needed just for this screen

export const loader = async ({ params, request, context }: LoaderFunctionArgs) => {
  return await loadProfileEdit({ params, request, context });
};

export const headers = () => {
  return {
    'Cache-Control': 'private, no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  };
};

export default function AccountSetup() {
  const { user } = useLoaderData<typeof loader>();
  
  if (!user) {
    return (
      <div className="max-w-3xl mx-auto sm:p-6 lg:p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">You must be logged in to complete your profile</h1>
          <Link to="/" className="text-brand-pink dark:text-taddy-blue mt-4 inline-block">
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  const [searchParams, setSearchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState<SetupStep>('username');
  const [username, setUsername] = useState(user.username || '');
  const [ageRange, setAgeRange] = useState<UserAgeRange | ''>(user.ageRange || '');
  const [birthYear, setBirthYear] = useState(user.birthYear?.toString() || '');
  const [blueskyHandle, setBlueskyHandle] = useState('');
  const [userDetailsState, dispatch] = useReducer(userDetailsReducer, userDetailsInitialState);
  
  // All Bluesky state is now handled by dispatch
  
  const userClientRef = useRef<ReturnType<typeof getUserApolloClient> | null>(null);

  // Fetch user details on mount to determine current step
  useEffect(() => {
    const stepParam = searchParams.get('step') as SetupStep;
    const validSteps: SetupStep[] = ['username', 'age', 'patreon', 'patreon-connected', 'bluesky', 'bluesky-verify', 'bluesky-connected', 'complete'];
    
    const userClient = getUserApolloClient();
    userClientRef.current = userClient;

    // If there's a valid step in URL params, go directly to that step
    if (stepParam && validSteps.includes(stepParam)) {
      setCurrentStep(stepParam);
      
      // If user just connected Patreon, fetch comics from Patreon creators
      if (stepParam === 'patreon-connected') {
        handlePatreonConnected();
      }
      
      return;
    }
  }, [searchParams]);

  // Update URL when step changes
  useEffect(() => {
    setSearchParams({ step: currentStep });
  }, [currentStep, setSearchParams]);

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
      localStorageSet('patreon-from-screen', '/profile/setup');
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
    } else if (currentStep === 'patreon-connected') {
      setCurrentStep('patreon');
    } else if (currentStep === 'bluesky') {
      setCurrentStep('patreon');
    } else if (currentStep === 'bluesky-verify') {
      setCurrentStep('bluesky');
    } else if (currentStep === 'bluesky-connected') {
      setCurrentStep('bluesky');
    }
    dispatch({ type: UserDetailsActionType.USER_DETAILS_CLEAR_ERROR });
  };

  const handleBlueskyVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: UserDetailsActionType.USER_DETAILS_CLEAR_ERROR });

    if (!userClientRef.current) return;

    const trimmedHandle = blueskyHandle.trim().replace(/[^a-zA-Z0-9.-]/g, '');

    if (!isValidDomain(trimmedHandle)) {
      dispatch({ type: UserDetailsActionType.USER_DETAILS_ERROR, payload: 'Invalid Bluesky handle. Make sure you use your handle (ex: bsky.app/profile/yourhandle)' });
      return;
    }

    try {
      // Verify the Bluesky handle
      await verifyBlueskyHandle(
        { 
          userClient: userClientRef.current,
          handle: trimmedHandle 
        },
        dispatch
      );

      setCurrentStep('bluesky-verify');
    } catch (err: any) {
      // Error is handled by the dispatch function
    }
  };

  const handleBlueskyDidSave = async (did: string) => {
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

      // Step 1: Get comics from Bluesky creators after saving DID  
      await getComicsFromBlueskyCreators(
        { userClient: userClientRef.current },
        dispatch
      );
      
      setCurrentStep('bluesky-connected');
    } catch (err: any) {
      // Error is handled by the dispatch function
    }
  };

  const handleSubscribeToBlueskyComics = async () => {
    if (!userClientRef.current) return;

    try {
      // Extract UUIDs from the comic series
      const seriesUuids = (userDetailsState.blueskyComicSeries || []).map(series => series.uuid).filter(Boolean);
      
      if (seriesUuids.length === 0) {
        setCurrentStep('complete');
        return;
      }

      const result = await subscribeToComics({ 
        userClient: userClientRef.current,
        seriesUuids,
        userId: user.id,
      }, dispatch);

      if (result.success) {
        setCurrentStep('complete');
      }
    } catch (err) {
      console.error('Error subscribing to Bluesky comics:', err);
      // Error is handled by dispatch
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

  const handlePatreonConnected = async () => {
    if (!userClientRef.current) return;

    try {
      // Fetch comics from Patreon creators after successful OAuth connection
      await getComicsFromPatreonCreators(
        { userClient: userClientRef.current },
        dispatch
      );
    } catch (err: any) {
      console.error('Error fetching Patreon comics:', err);
      // Error is handled by dispatch
    }
  };

  const handleSubscribeToPatreonComics = async () => {
    if (!userClientRef.current) return;

    try {
      // Extract UUIDs from the comic series
      const seriesUuids = (userDetailsState.patreonComicSeries || []).map(series => series.uuid).filter(Boolean);
      
      if (seriesUuids.length === 0) {
        setCurrentStep('bluesky');
        return;
      }

      const result = await subscribeToPatreonComics({ 
        userClient: userClientRef.current,
        seriesUuids,
        userId: user.id,
      }, dispatch);

      if (result.success) {
        setCurrentStep('bluesky');
      }
    } catch (err) {
      console.error('Error subscribing to Patreon comics:', err);
      // Error is handled by dispatch
    }
  };

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
        {currentStep === 'patreon' && (
          <SetupPatreon
            currentStep={currentStep}
            onConnect={handlePatreonConnect}
            onSkip={() => {
              setCurrentStep('bluesky');
              dispatch({ type: UserDetailsActionType.USER_DETAILS_CLEAR_ERROR });
            }}
            onBack={handleBack}
            onContinue={() => {
              setCurrentStep('bluesky');
              dispatch({ type: UserDetailsActionType.USER_DETAILS_CLEAR_ERROR });
            }}
          />
        )}

        {/* Patreon Connected Step */}
        {currentStep === 'patreon-connected' && (
          <PatreonConnected 
            loading={userDetailsState.isLoading || userDetailsState.patreonSubscriptionLoading}
            error={userDetailsState.error || userDetailsState.patreonSubscriptionError}
            comicSeries={userDetailsState.patreonComicSeries}
            onContinue={handleSubscribeToPatreonComics}
            onSkip={() => {
              setCurrentStep('bluesky');
              dispatch({ type: UserDetailsActionType.USER_DETAILS_CLEAR_ERROR });
            }}
          />
        )}

        {/* Bluesky Steps */}
        {(currentStep === 'bluesky' || currentStep === 'bluesky-verify') && (
          <SetupBluesky
            blueskyHandle={blueskyHandle}
            setBlueskyHandle={setBlueskyHandle}
            userDetailsState={userDetailsState}
            currentStep={currentStep}
            onVerify={handleBlueskyVerify}
            onConfirm={handleBlueskyDidSave}
            onBack={handleBack}
            onSkip={() => {
              setCurrentStep('complete');
              dispatch({ type: UserDetailsActionType.USER_DETAILS_CLEAR_ERROR });
            }}
          />
        )}

        {/* Bluesky Connected Step */}
        {currentStep === 'bluesky-connected' && (
          <BlueskyConnected 
            handle={blueskyHandle}
            loading={userDetailsState.isLoading || userDetailsState.blueskySubscriptionLoading}
            error={userDetailsState.error || userDetailsState.blueskySubscriptionError}
            comicSeries={userDetailsState.blueskyComicSeries}
            onContinue={handleSubscribeToBlueskyComics}
            onSkip={() => setCurrentStep('complete')}
          />
        )}

        {/* Complete Step */}
        {currentStep === 'complete' && <SetupComplete />}
      </div>
    </div>
  );
}

export const meta: MetaFunction = () => {
  return getMetaTags({
    title: 'Complete your profile',
    description: 'Complete your profile to get started',
    url: `${inkverseWebsiteUrl}/profile/setup`,
  });
};  