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
  getComicsFromPatreonCreators,
  subscribeToPatreonComics,
  UserDetailsActionType
} from '@inkverse/shared-client/dispatch/user-details';
import { SetupPatreon } from '@/app/components/profile/SetupPatreon';
import { PatreonConnected } from '@/app/components/profile/PatreonConnected';
import { MdArrowBack } from 'react-icons/md';
import { getUserDetails } from '@/lib/auth/user';
import { getAuthorizationCodeUrl } from '@inkverse/public/hosting-providers';
import { localStorageSet } from '@/lib/storage/local';
import config from '@/config';

const TADDY_PROVIDER_UUID = 'e9957105-80e4-46e3-8e82-20472b9d7512';

export const meta: MetaFunction<typeof loader> = () => {
  return getMetaTags({
    title: 'Connect Patreon',
    description: 'Connect your Patreon account to find creators you follow',
    url: `${inkverseWebsiteUrl}/profile/edit/patreon`,
  });
};

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

export default function EditPatreonPage() {
  const { user } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<'patreon' | 'patreon-connected'>('patreon');
  const [userDetailsState, dispatch] = useReducer(userDetailsReducer, userDetailsInitialState);
  const userClientRef = useRef<ReturnType<typeof getUserApolloClient> | null>(null);

  useEffect(() => {
    const userClient = getUserApolloClient();
    userClientRef.current = userClient;
  }, []);

  if (!user) {
    return null; // Loader handles redirect
  }

  const handlePatreonConnect = async () => {
    const userDetails = getUserDetails();
    
    if (!userDetails || !userDetails.id) {
      console.error('User not found');
      return;
    }

    const authUrl = getAuthorizationCodeUrl({
      hostingProviderUuid: TADDY_PROVIDER_UUID,
      clientId: config.TADDY_CLIENT_ID,
      clientUserId: userDetails.id,
    });

    // Set storage to return to this page after OAuth
    localStorageSet('patreon-from-screen', '/profile/edit/patreon');
    
    // Open auth URL in new tab
    window.open(authUrl, '_blank');
  };

  const handlePatreonConnected = async () => {
    if (!userClientRef.current) return;

    try {
      setCurrentStep('patreon-connected');

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
        navigate('/profile/edit');
        return;
      }

      const result = await subscribeToPatreonComics({ 
        userClient: userClientRef.current,
        seriesUuids
      }, dispatch);

      if (result.success) {
        navigate('/profile/edit');
      }
    } catch (err) {
      console.error('Error subscribing to Patreon comics:', err);
      // Error is handled by dispatch
    }
  };

  const handleCancel = () => {
    navigate('/profile/edit');
  };

  const handleSkip = () => {
    navigate('/profile/edit');
  };

  // Check if user just came back from OAuth (you may want to implement this check)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('step') === 'patreon-connected') {
      handlePatreonConnected();

    }
  }, []);

  return (
    <div className="mx-auto sm:p-6 lg:p-8 zoomed-in:max-w-3xl max-w-xl">
      <div className="p-8 rounded-lg w-full">
        <div className="flex items-center justify-center relative mb-2">
          <button
            onClick={handleCancel}
            className="absolute left-0 p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <MdArrowBack size={24} />
          </button>
        </div>

        {currentStep === 'patreon' && (
          <SetupPatreon
            currentStep={currentStep}
            onConnect={handlePatreonConnect}
            onSkip={handleSkip}
            onBack={handleCancel}
            onContinue={handleSkip}
          />
        )}

        {currentStep === 'patreon-connected' && (
          <PatreonConnected 
            loading={userDetailsState.isLoading || userDetailsState.patreonSubscriptionLoading}
            error={userDetailsState.error || userDetailsState.patreonSubscriptionError}
            comicSeries={userDetailsState.patreonComicSeries}
            onContinue={handleSubscribeToPatreonComics}
            onSkip={handleSkip}
          />
        )}
      </div>
    </div>
  );
}