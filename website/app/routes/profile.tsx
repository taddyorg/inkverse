import type { LoaderFunctionArgs, MetaFunction } from 'react-router-dom';
import { useLoaderData, Link } from 'react-router';
import { loadProfile } from '@/lib/loader/profile.server';
import { getMetaTags } from '@/lib/seo';
import { inkverseWebsiteUrl } from '@inkverse/public/utils';
import { getUserDetails } from '@/lib/auth/user';
import type { ComicSeries } from '@inkverse/shared-client/graphql/operations';
import { ComicSeriesDetails } from '../components/comics/ComicSeriesDetails';

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

export const loader = async ({ params, request, context }: LoaderFunctionArgs) => {
  return await loadProfile({ params, request, context });
};

function ProfileScreen() {
  const profileData = useLoaderData<typeof loader>();

  const isOwnProfile = getUserDetails() && profileData.user && getUserDetails()?.username === profileData.user.username;

  if (!profileData.user) {
    return (
      <div className="max-w-3xl mx-auto sm:p-6 lg:p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Profile not found</h1>
        </div>
      </div>
    );
  }

  const subscriptions = profileData.subscribedComics || [];

  return (
    <div className="max-w-3xl mx-auto sm:p-6 lg:p-8">
      <div className="rounded-lg p-6">
        <div className="flex justify-between items-start mb-4 sm:mb-2">
          <h1 className="text-2xl font-bold">
            {profileData.user.username}
          </h1>
          
          {isOwnProfile && (
            <Link
              to="/profile/edit"
              className="bg-brand-pink dark:bg-taddy-blue text-white font-medium px-4 py-2 rounded-3xl transition-colors"
            >
              Edit your profile
            </Link>
          )}
        </div>

        {/* Your Comics Section */}
        <div className="mt-4 sm:mt-6">          
          {subscriptions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">
                {isOwnProfile 
                  ? "When you save a comic to your profile, it will show up here"
                  : `No comics saved to ${profileData.user.username}'s profile, yet...`
                }
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold mb-4 sm:mb-2">Your Comics</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {subscriptions.map((comic: ComicSeries) => {
                  return (
                    <ComicSeriesDetails
                      key={comic.uuid}
                      comicseries={comic}
                      pageType="cover"
                    />
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfileScreen;