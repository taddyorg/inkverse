import type { LoaderFunctionArgs, MetaFunction } from 'react-router-dom';
import { useLoaderData } from 'react-router';

import { loadProfile } from '@/lib/loader/profile.server';
import { getMetaTags } from '@/lib/seo';
import { inkverseWebsiteUrl } from '@inkverse/public/utils';

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

  if (!profileData.user) {
    return (
      <div className="max-w-3xl mx-auto sm:p-6 lg:p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Profile not found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto sm:p-6 lg:p-8">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h1 className="text-2xl font-bold mb-4">
          {`${profileData.user.username}'s Profile`}
        </h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <p className="mt-1 text-sm text-gray-900">{profileData.user.username}</p>
          </div>
          
          {profileData.user.email && profileData.user.ageRange && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-sm text-gray-900">{profileData.user.email}</p>
              </div>
              
              {profileData.user.ageRange && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Age Range</label>
                  <p className="mt-1 text-sm text-gray-900">{profileData.user.ageRange}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfileScreen;