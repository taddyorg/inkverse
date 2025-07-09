import { useState, useReducer, useRef, useEffect } from 'react';
import { useNavigate, type LoaderFunctionArgs, type MetaFunction } from 'react-router';
import { useLoaderData } from 'react-router';
import { loadProfileEdit } from '@/lib/loader/profile-edit.server';
import { getMetaTags } from '@/lib/seo';
import { inkverseWebsiteUrl } from '@inkverse/public/utils';
import { getUserApolloClient } from '@/lib/apollo/client.client';
import { webStorageFunctions } from '@/lib/auth/user';
import { 
  userDetailsReducer,
  userDetailsInitialState,
  updateUserEmail,
  UserDetailsActionType
} from '@inkverse/shared-client/dispatch/user-details';
import { SetupEmail } from '@/app/components/profile/SetupEmail';
import { MdArrowBack } from 'react-icons/md';

export const meta: MetaFunction<typeof loader> = () => {
  return getMetaTags({
    title: 'Edit your email',
    description: 'Change your Inkverse email address',
    url: `${inkverseWebsiteUrl}/profile/edit/email`,
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

export default function EditEmailPage() {
  const { user } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [email, setEmail] = useState(user?.email || '');
  const [userDetailsState, dispatch] = useReducer(userDetailsReducer, userDetailsInitialState);
  const userClientRef = useRef<ReturnType<typeof getUserApolloClient> | null>(null);

  useEffect(() => {
    const userClient = getUserApolloClient();
    userClientRef.current = userClient;
  }, []);

  if (!user) {
    return null; // Loader handles redirect
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: UserDetailsActionType.USER_DETAILS_CLEAR_ERROR });

    if (!userClientRef.current) return;

    try {
      // Validate email
      if (!email.trim()) {
        throw new Error('Email is required');
      }

      // Update email via API
      await updateUserEmail(
        { 
          userClient: userClientRef.current,
          email: email.trim(),
          storageFunctions: webStorageFunctions,
        },
        dispatch
      );

      // Navigate back to profile on success
      navigate(`/profile/edit`);
    } catch (err: any) {
      // Error is handled by the dispatch function
    }
  };

  const handleCancel = () => {
    navigate('/profile/edit');
  };

  return (
    <div className="mx-auto sm:p-6 lg:p-8 zoomed-in:max-w-3xl max-w-xl">
      <div className="p-8 rounded-lg w-full">
        <div className="flex items-center mb-6">
          <button
            onClick={handleCancel}
            className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors mr-3"
          >
            <MdArrowBack size={24} />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Edit Email
          </h1>
        </div>

        <SetupEmail
          mode="edit"
          currentEmail={user.email || undefined}
          email={email}
          setEmail={setEmail}
          userDetailsState={userDetailsState}
          onSubmit={handleEmailSubmit}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}