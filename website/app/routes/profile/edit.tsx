import { type LoaderFunctionArgs, type MetaFunction } from 'react-router';
import { useLoaderData, Link, useNavigate, useOutletContext } from 'react-router';
import { loadProfileEdit } from '@/lib/loader/profile-edit.server';
import { getMetaTags } from '@/lib/seo';
import { inkverseWebsiteUrl } from '@inkverse/public/utils';
import { MdChevronRight, MdArrowBack } from 'react-icons/md';
import { prettyAgeRange } from '@inkverse/public/user';
import { useReducer, useRef, useEffect, useState } from 'react';
import { resendVerificationEmail, verificationReducer, verificationInitialState } from '@inkverse/shared-client/dispatch/verification';
import { getUserApolloClient } from '@/lib/apollo/client.client';
import { TADDY_HOSTING_PROVIDER_UUID } from '@inkverse/public/hosting-providers';
import { getConnectedHostingProviderUuids, getHostingProviderAccessToken } from '@/lib/auth/hosting-provider';
import { jwtDecode } from 'jwt-decode';

export const meta: MetaFunction<typeof loader> = () => {
  return getMetaTags({
    title: 'Edit Profile',
    description: 'Edit your Inkverse profile',
    url: `${inkverseWebsiteUrl}/profile/edit`,
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

interface ProfileProperty {
  type: 'list' | 'switch' | 'action';
  label: string;
  value: string | null | undefined;
  editPath?: string;
}

export default function ProfileEdit() {
  const { user } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [verificationState, verificationDispatch] = useReducer(verificationReducer, verificationInitialState);
  const userClientRef = useRef<ReturnType<typeof getUserApolloClient> | null>(null);
  const [isPatreonConnected, setIsPatreonConnected] = useState(false);
  const [isBlueskyConnected, setIsBlueskyConnected] = useState(false);

  useEffect(() => {
    const userClient = getUserApolloClient();
    userClientRef.current = userClient;
  }, []);


  useEffect(() => {
    const checkPatreonConnection = async () => {
    
      // Client-side only logic for connection status
    if (typeof window !== 'undefined') {
      const accessToken = await getHostingProviderAccessToken(TADDY_HOSTING_PROVIDER_UUID);
      const decodedToken = jwtDecode(accessToken || '') as { scope: string };
      const scopes = decodedToken.scope.split(' ');
      for (const scope of scopes) {
        if (scope.startsWith('patreon')) {
          setIsPatreonConnected(true);
          break;
        }
      }
      setIsBlueskyConnected(!!user.blueskyDid);
      }   
    };

  checkPatreonConnection();
}, [user.blueskyDid]);

  const handleResendVerificationEmail = async () => {
    if (!userClientRef.current) return;
    
    try {
      await resendVerificationEmail({ userClient: userClientRef.current }, verificationDispatch);
    } catch (error) {
      console.error('Failed to resend verification email:', error);
    }
  };


  if (!user) {
    return (
      <div className="max-w-3xl mx-auto sm:p-6 lg:p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">You must be logged in to edit your profile</h1>
          <Link to="/" className="text-brand-pink dark:text-taddy-blue mt-4 inline-block">
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  const profileProperties: ProfileProperty[] = [
    {
      type: 'list',
      label: 'Username',
      value: user.username,
      editPath: '/profile/edit/username',
    },
    {
      type: 'list',
      label: 'Age',
      value: prettyAgeRange(user.ageRange),
      editPath: '/profile/edit/age',
    },
    {
      type: 'list',
      label: 'Email',
      value: user.email,
      editPath: '/profile/edit/email'
    },
    {
      type: 'list',
      label: 'Patreon',
      value: isPatreonConnected ? 'Connected' : 'Not Connected',
      editPath: '/profile/edit/patreon?step=patreon',
    },
    {
      type: 'list',
      label: 'Bluesky',
      value: isBlueskyConnected ? 'Connected' : 'Not Connected',
      editPath: '/profile/edit/bluesky?step=bluesky',
    },
  ];

  function renderProperty(property: ProfileProperty) {
    if (property.type === 'switch') {
      return (
        <div key={property.label}>
          <p className="text-lg font-medium text-inkverse-black dark:text-white">
            {property.label}
          </p>
        </div>
      );
    }

    return (
      <div key={property.label}> 
          <Link
            to={property.editPath || ''}
            className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <p className="text-lg font-medium text-inkverse-black dark:text-white">
              {property.label}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-md text-gray-500 dark:text-gray-400">
                {property.value || 'Not set'}
              </span>
              <MdChevronRight size={20} className="text-inkverse-black dark:text-white" />
            </div>
          </Link>
          {property.label === 'Email' && !user.isEmailVerified && (
            <div className="px-4 pb-4 flex items-center justify-end gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Email not verified
              </span>
              <button 
                onClick={handleResendVerificationEmail}
                disabled={verificationState.isLoading}
                className="text-sm text-brand-pink dark:text-taddy-blue hover:underline disabled:opacity-50"
              >
                {verificationState.isLoading ? 'Sending...' : 'Resend verification email'}
              </button>
            </div>
        )}
        {verificationState.error && (
          <div className="px-4 pb-2 text-right text-sm text-red-500">
            {verificationState.error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto sm:p-6 lg:p-8">
      <div className="rounded-lg p-6">
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate(`/${user.username}`)}
            className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors mr-3"
          >
            <MdArrowBack size={24} />
          </button>
          <h1 className="text-2xl font-bold text-inkverse-black dark:text-white">
            Edit Profile
          </h1>
        </div>

        <div className="space-y-0">
          {profileProperties.map((property, index) => (
            renderProperty(property)
          ))}
        </div>
      </div>
    </div>
  );
}