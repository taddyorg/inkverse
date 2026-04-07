import type { LoaderFunctionArgs, MetaFunction } from 'react-router-dom';
import { useLoaderData, Link } from 'react-router';
import { useEffect, useReducer } from 'react';
import { IoSettingsOutline, IoNotificationsOutline } from 'react-icons/io5';

import { loadProfile } from '@/lib/loader/profile.server';
import { getUserApolloClient } from '@/lib/apollo/client.client';
import { getMetaTags } from '@/lib/seo';
import { inkverseWebsiteUrl } from '@inkverse/public/utils';
import { getUserDetails } from '@/lib/auth/user';
import type { ComicSeries } from '@inkverse/shared-client/graphql/operations';
import { loadUserProfileById, profileReducer, type ProfileState } from '@inkverse/shared-client/dispatch/profile';

import { ComicSeriesDetails } from '../components/comics/ComicSeriesDetails';
import { CreatorDetails } from '../components/creator/CreatorDetails';
import { NotFound } from '../components/ui';

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) { return []; }
  else if (!data.user) { return []; }
  
  const title = `${data.user.username}'s Profile`;
  const description = `View ${data.user.username}'s profile on Inkverse`;
  
  return getMetaTags({
      title, 
      description,
      url: `${inkverseWebsiteUrl}/${data.user.username}`,
    }
  );
};

export const loader = async (args: LoaderFunctionArgs) => {
  return await loadProfile(args);
};

export default function Profile() {
  const profileData = useLoaderData<typeof loader>();
  const profileKey = profileData.user?.username || 'no-user';
  return <ProfileContent key={profileKey} initialData={profileData} />;
}

function ProfileContent({ initialData }: { initialData: Partial<ProfileState> & { loaderError?: boolean } }) {

  const [profileState, dispatch] = useReducer(profileReducer, initialData);

  const {
    user,
    subscribedComics,
    creator,
    isLoading,
    error,
  } = profileState;


  useEffect(() => {
    const currentUser = getUserDetails();
    if (currentUser && user?.id) {
      const userClient = getUserApolloClient();
      loadUserProfileById({
        userClient,
        userId: user.id,
      }, dispatch);
    }
  }, [user?.id, dispatch]);

  const isOwnProfile = getUserDetails() && user && getUserDetails()?.username === user.username;

  if (initialData.loaderError) {
    return <NotFound message="Something went wrong" subtitle="Please try again later." />;
  }

  if (!user) {
    return <NotFound message="Profile not found" />;
  }

  const subscriptions = subscribedComics || [];
  const creatorComics = creator?.comics?.filter(Boolean) || [];

  return (
    <div className="max-w-3xl mx-auto sm:p-6 lg:p-8">
      <div className="rounded-lg p-6">
        {isOwnProfile && (
          <div className="flex justify-end gap-2 mb-4 sm:mb-2">
            <Link
              to="/profile/edit"
              className="bg-brand-pink dark:bg-taddy-blue text-white font-medium px-4 py-2 rounded-3xl transition-colors"
            >
              Edit your profile
            </Link>
            <Link
              to="/profile/notifications"
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center"
              title="Notifications"
            >
              <IoNotificationsOutline className="h-6 w-6 text-gray-800 dark:text-white" />
            </Link>
            <Link
              to="/profile/settings"
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center"
              title="Settings"
            >
              <IoSettingsOutline className="h-6 w-6 text-gray-800 dark:text-white" />
            </Link>
          </div>
        )}

        {creator ? (
          <CreatorDetails creator={creator} pageType="profile-screen" />
        ) : (
          <h1 className="text-2xl font-bold mb-4 sm:mb-2">
            {user.username}
          </h1>
        )}

        {/* My Comics Section */}
        {creatorComics.length > 0 && (
          <div className="mt-4 sm:mt-6">
            <h2 className="text-xl font-semibold mb-4 sm:mb-2">My Comics</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {creatorComics.map((comic) => comic && (
                <ComicSeriesDetails
                  key={comic.uuid}
                  comicseries={comic}
                  pageType="cover"
                />
              ))}
            </div>
          </div>
        )}

        {/* Subscriptions Section */}
        {subscriptions.length > 0 && (
          <div className={creatorComics.length > 0 ? "mt-10 sm:mt-8" : "mt-2"}>
            {creatorComics.length > 0 &&
              <h2 className="text-xl font-semibold mb-4 sm:mb-2">Comics I'm Reading</h2>
            }
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 mt-2 gap-6">
              {subscriptions.map((comic: ComicSeries) => (
                <ComicSeriesDetails
                  key={comic.uuid}
                  comicseries={comic}
                  pageType="cover"
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty state — only when profile has no comics at all */}
        {subscriptions.length === 0 && creatorComics.length === 0 && (
          <div className="mt-4 sm:mt-6 text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">
              {isOwnProfile
                ? "When you save a comic to your profile, it will show up here"
                : `No comics saved to ${user.username}'s profile, yet...`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}