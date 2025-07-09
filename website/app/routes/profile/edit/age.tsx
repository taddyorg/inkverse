import { useState, useReducer, useRef, useEffect } from 'react';
import { useNavigate, type LoaderFunctionArgs, type MetaFunction } from 'react-router';
import { useLoaderData } from 'react-router';
import { loadProfileEdit } from '@/lib/loader/profile-edit.server';
import { getMetaTags } from '@/lib/seo';
import { inkverseWebsiteUrl } from '@inkverse/public/utils';
import { getUserApolloClient } from '@/lib/apollo/client.client';
import { UserAgeRange } from '@inkverse/public/graphql/types';
import { 
  userDetailsReducer,
  userDetailsInitialState,
  updateAgeRange,
  UserDetailsActionType
} from '@inkverse/shared-client/dispatch/user-details';

import { SetupAge } from '@/app/components/profile/SetupAge';
import { MdArrowBack } from 'react-icons/md';

export const meta: MetaFunction<typeof loader> = () => {
  return getMetaTags({
    title: 'Edit your age',
    description: 'Update your age range on Inkverse',
    url: `${inkverseWebsiteUrl}/profile/edit/age`,
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

export default function EditAgePage() {
  const { user } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [ageRange, setAgeRange] = useState<UserAgeRange | ''>(user?.ageRange || '');
  const [birthYear, setBirthYear] = useState(user?.birthYear?.toString() || '');
  const [userDetailsState, dispatch] = useReducer(userDetailsReducer, userDetailsInitialState);
  const userClientRef = useRef<ReturnType<typeof getUserApolloClient> | null>(null);

  useEffect(() => {
    const userClient = getUserApolloClient();
    userClientRef.current = userClient;
  }, []);

  if (!user) {
    return null; // Loader handles redirect
  }

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

      // Navigate back to edit page on success
      navigate('/profile/edit');
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
            Edit your age
          </h1>
        </div>

        <SetupAge
          mode="edit"
          currentAgeRange={user.ageRange}
          currentBirthYear={user.birthYear}
          ageRange={ageRange}
          setAgeRange={setAgeRange}
          birthYear={birthYear}
          setBirthYear={setBirthYear}
          userDetailsState={userDetailsState}
          onSubmit={handleAgeSubmit}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}