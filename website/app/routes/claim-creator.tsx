import { useState, useEffect, useReducer } from 'react';
import type { LoaderFunctionArgs, MetaFunction } from 'react-router-dom';
import { useLoaderData, useMatches, Link } from 'react-router';
import { loadClaimCreator, type ClaimCreatorLoaderData } from '@/lib/loader/claim-creator.server';
import { getMetaTags } from '@/lib/seo';
import { inkverseWebsiteUrl } from '@inkverse/public/utils';
import { getAvatarImageUrl } from '@inkverse/public/creator';
import { getUserDetails, getAccessToken, isAuthenticated } from '@/lib/auth/user';
import {
  claimCreatorReducer,
  claimCreatorInitialState,
  fetchClaimStatus,
  initiateClaim,
  ClaimCreatorActionType,
} from '@inkverse/shared-client/dispatch/claim-creator';
import { getUserApolloClient } from '@/lib/apollo/client.client';
import { SignupModal } from '../components/profile/SignupModal';
import { NotFound } from '../components/ui';
import config from '@/config';

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data?.creator) { return []; }

  const title = `Claim ${data.creator.name} on Inkverse`;
  const providerName = data.hostingProviderName || 'hosting provider';
  const description = `Connect your ${providerName} and Inkverse accounts.`;

  return getMetaTags({
    title,
    description,
    url: `${inkverseWebsiteUrl}/claim-creator/${data.creator.uuid}`,
  });
};

export const loader = async (args: LoaderFunctionArgs) => {
  return await loadClaimCreator(args);
};

export default function ClaimCreator() {
  const { creator, errorParam, hostingProviderName, loaderError } = useLoaderData<typeof loader>() as ClaimCreatorLoaderData;
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [state, dispatch] = useReducer(claimCreatorReducer, claimCreatorInitialState);
  const { isLoading, error, claimStatus } = state;

  // Get hasRefreshToken from root loader to know if auth hydration may be in progress
  const matches = useMatches();
  const hasRefreshToken = (matches[0]?.data as { hasRefreshToken?: boolean })?.hasRefreshToken;

  // Wait for auth hydration, then fetch claim status or stop loading
  useEffect(() => {
    if (!creator?.uuid) return;

    // Already authenticated — fetch claim status immediately
    if (isAuthenticated()) {
      const client = getUserApolloClient();
      const currentUser = getUserDetails();
      fetchClaimStatus(
        { userClient: client, creatorUuid: creator.uuid, userId: currentUser?.id ? String(currentUser.id) : undefined },
        dispatch,
      );
      return;
    }

    // No refresh token — user is definitely not logged in, stop loading
    if (!hasRefreshToken) {
      dispatch({ type: ClaimCreatorActionType.FETCH_STATUS_SUCCESS, payload: null });
      return;
    }

    // Has refresh token but not yet authenticated — poll for root layout auth hydration
    const interval = setInterval(() => {
      if (isAuthenticated()) {
        clearInterval(interval);
        const client = getUserApolloClient();
        const currentUser = getUserDetails();
        fetchClaimStatus(
          { userClient: client, creatorUuid: creator.uuid, userId: currentUser?.id ? String(currentUser.id) : undefined },
          dispatch,
        );
      }
    }, 100);

    // Timeout after 5s — auth never resolved, stop loading to show login message
    const timeout = setTimeout(() => {
      clearInterval(interval);
      dispatch({ type: ClaimCreatorActionType.FETCH_STATUS_SUCCESS, payload: null });
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [creator?.uuid, hasRefreshToken]);

  if (loaderError) {
    return <NotFound message="Something went wrong" subtitle="Please try again later." />;
  }

  if (!creator) {
    return <NotFound message="Creator not found" />;
  }

  if (isLoading) {
    return <></>;
  }

  const user = getUserDetails();

  if (!user) {
    return <NotFound message="You must be logged in to access this page" />;
  }

  if (!user.username) {
    return <NotFound message="You must complete your profile to claim your creator page" />;
  }

  const avatarUrl = creator.avatarImageAsString
    ? getAvatarImageUrl({ avatarImageAsString: creator.avatarImageAsString })
    : undefined;

  const providerName = hostingProviderName || 'hosting provider';

  // Determine current status from GraphQL claim status
  const effectiveStatus = claimStatus?.toLowerCase() || null;

  const handleClaim = async () => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      setIsSignupOpen(true);
      return;
    }

    const accessToken = await getAccessToken();
    if (!accessToken) {
      setIsSignupOpen(true);
      return;
    }

    const result = await initiateClaim(
      { baseUrl: config.CLAIM_URL, creatorUuid: creator.uuid, accessToken },
      dispatch
    );

    if (result?.claimCreatorUrl) {
      window.location.href = result.claimCreatorUrl;
    }
  };

  const handleAuthSuccess = () => {
    // After successful auth, trigger the claim
    handleClaim();
  };

  return (
    <div className="max-w-3xl mx-auto sm:p-6 lg:p-8">
      <div className="p-6 rounded-lg max-w-xl mx-auto">
        {!effectiveStatus && (
          <div className="flex flex-col items-center text-center mb-8">
            {avatarUrl && (
              <img
                src={avatarUrl}
                alt={`${creator.name} avatar`}
                className="h-24 w-24 rounded-full object-cover object-center mb-4"
              />
            )}
            <h1 className="text-2xl font-bold">{creator.name}</h1>
            <p className="mt-6 text-lg text-center">
              Connect your {providerName} and Inkverse accounts:
            </p>
            <ul className="mt-6 space-y-2 text-left text-base text-gray-700 dark:text-gray-300">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-brand-pink dark:text-taddy-blue">&#10003;</span>
                <span>Combine your Inkverse {isAuthenticated() ? <Link to={`/creators/${creator.shortUrl}`} className="underline" target="_blank">creator page</Link> : <Link to={`/creators/${creator.shortUrl}`} className="underline" target="_blank">creator page</Link>} and your {isAuthenticated() ? <Link to={`/${getUserDetails()?.username}`} className="underline" target="_blank">profile</Link> : <Link to={`/${getUserDetails()?.username}`} className="underline" target="_blank">profile</Link>} into one verified profile</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-brand-pink dark:text-taddy-blue">&#10003;</span>
                Get notifications when someone likes or comments on your comic
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-brand-pink dark:text-taddy-blue">&#10003;</span>
                Get a verified badge when you reply or comment on your comic
              </li>
            </ul>
          </div>
        )}

        {/* Status Display */}
        {effectiveStatus === 'approved' && (
          <div className="text-center">
            <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-green-700 dark:text-green-400 font-medium">
                Successfully connected! Your Inkverse account is now linked to this creator profile.
              </p>
            </div>
            {getUserDetails()?.username && (
              <Link
                to={`/${getUserDetails()?.username}`}
                className="inline-block bg-brand-pink dark:bg-taddy-blue text-white font-medium px-6 py-3 rounded-3xl transition-colors hover:opacity-90"
              >
                View your new profile
              </Link>
            )}
          </div>
        )}

        {effectiveStatus === 'rejected' && (
          <div className="text-center">
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-red-700 dark:text-red-400 font-medium">
                The request was rejected. Contact danny@inkverse.co if you need help.
              </p>
            </div>
          </div>
        )}

        {effectiveStatus === 'pending' && (
          <div className="text-center">
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-yellow-700 dark:text-yellow-400 font-medium">
                Verification in progress. Please complete the verification on {providerName}'s dashboard.
              </p>
            </div>
          </div>
        )}

        {errorParam && (
          <div className="text-center">
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-red-700 dark:text-red-400 font-medium">
                {errorParam}
              </p>
            </div>
            <button
              onClick={handleClaim}
              disabled={isLoading}
              className="bg-brand-pink dark:bg-taddy-blue text-white font-medium px-6 py-3 rounded-3xl transition-colors hover:opacity-90"
            >
              Try again
            </button>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}
        {(!effectiveStatus || effectiveStatus === 'pending') && (
          <div className="text-center">
            <button
              onClick={handleClaim}
              disabled={isLoading}
              className={`mt-6 bg-brand-pink dark:bg-taddy-blue text-white font-medium px-6 py-3 rounded-3xl transition-colors ${
                isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
              }`}
            >
              {isLoading ? 'Connecting...' : 'Connect your account'}
            </button>
          </div>
        )}
      </div>

      <SignupModal
        isOpen={isSignupOpen}
        onClose={() => setIsSignupOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
