import { useState, useReducer, useRef, useEffect } from 'react';
import { useNavigate, type LoaderFunctionArgs, type MetaFunction } from 'react-router';
import { useLoaderData } from 'react-router';
import { loadProfileEdit } from '@/lib/loader/profile-edit.server';
import { getMetaTags } from '@/lib/seo';
import { inkverseWebsiteUrl } from '@inkverse/public/utils';
import { getUserApolloClient } from '@/lib/apollo/client.client';
import { 
  userDetailsReducer,
  userDetailsInitialState,
  saveBlueskyDid,
  verifyBlueskyHandle,
  followComicsFromBlueskyCreators,
  subscribeToComics,
  UserDetailsActionType
} from '@inkverse/shared-client/dispatch/user-details';
import { SetupBluesky } from '@/app/components/profile/SetupBluesky';
import { BlueskyConnected } from '@/app/components/profile/BlueskyConnected';
import { MdArrowBack } from 'react-icons/md';
import { isValidDomain } from '@inkverse/shared-client/utils/common';

export const meta: MetaFunction<typeof loader> = () => {
  return getMetaTags({
    title: 'Connect Bluesky',
    description: 'Connect your Bluesky account to find creators you follow',
    url: `${inkverseWebsiteUrl}/profile/edit/bluesky`,
  });
};

export const loader = async ({ params, request, context }: LoaderFunctionArgs) => {
  return await loadProfileEdit({ params, request, context });
};

type BlueskyStep = 'bluesky' | 'bluesky-verify' | 'bluesky-connected';

export default function EditBlueskyPage() {
  const { user } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<BlueskyStep>('bluesky');
  const [blueskyHandle, setBlueskyHandle] = useState('');
  const [userDetailsState, dispatch] = useReducer(userDetailsReducer, userDetailsInitialState);
  const userClientRef = useRef<ReturnType<typeof getUserApolloClient> | null>(null);

  useEffect(() => {
    const userClient = getUserApolloClient();
    userClientRef.current = userClient;
  }, []);

  if (!user) {
    return null; // Loader handles redirect
  }

  const handleBlueskyVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: UserDetailsActionType.USER_DETAILS_CLEAR_ERROR });

    if (!userClientRef.current) return;

    if (!isValidDomain(blueskyHandle)) {
      dispatch({ type: UserDetailsActionType.USER_DETAILS_ERROR, payload: 'Invalid Bluesky handle. Make sure you use your handle (ex: bsky.app/profile/yourhandle)' });
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
      await followComicsFromBlueskyCreators(
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
        navigate('/profile/edit');
        return;
      }

      const result = await subscribeToComics({ 
        userClient: userClientRef.current,
        seriesUuids,
        userId: user.id,
      }, dispatch);

      if (result.success) {
        navigate('/profile/edit');
      }
    } catch (err) {
      console.error('Error subscribing to Bluesky comics:', err);
      // Error is handled by dispatch
    }
  };

  const handleCancel = () => {
    navigate('/profile/edit');
  };

  const handleSkip = () => {
    navigate('/profile/edit');
  };

  const handleBack = () => {
    if (currentStep === 'bluesky-verify') {
      setCurrentStep('bluesky');
    } else {
      navigate('/profile/edit');
    }
    dispatch({ type: UserDetailsActionType.USER_DETAILS_CLEAR_ERROR });
  };

  return (
    <div className="mx-auto sm:p-6 lg:p-8 zoomed-in:max-w-3xl max-w-xl">
      <div className="p-8 rounded-lg w-full">
        <div className="flex items-center justify-center relative mb-2">
          <button
            onClick={handleBack}
            className="absolute left-0 p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <MdArrowBack size={24} />
          </button>
        </div>

        {/* Bluesky Connection Steps */}
        {(currentStep === 'bluesky' || currentStep === 'bluesky-verify') && (
          <SetupBluesky
            blueskyHandle={blueskyHandle}
            setBlueskyHandle={setBlueskyHandle}
            userDetailsState={userDetailsState}
            currentStep={currentStep}
            onVerify={handleBlueskyVerify}
            onConfirm={handleBlueskyDidSave}
            onBack={handleBack}
            onSkip={handleSkip}
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
            onSkip={handleSkip}
          />
        )}
      </div>
    </div>
  );
}