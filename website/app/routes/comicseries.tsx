import type { LoaderFunctionArgs, MetaFunction } from 'react-router-dom';
import { useLoaderData } from 'react-router';
import { useReducer, useEffect } from 'react';

// import { SimpleLoadingComponent } from '@/components/ui';
import { ComicSeriesDetails } from '../components/comics/ComicSeriesDetails';
import { ComicIssuesList } from '../components/comics/ComicIssuesList';
import { ComicSeriesInfo } from '../components/comics/ComicSeriesInfo';
import { ReadNextEpisode } from '../components/comics/ReadNextEpisode';
import { AddToProfileButton, NotificationButton } from '../components/comics/ComicActionButtons';

import { loadComicSeries } from '@/lib/loader/comicseries.server';
import { getMetaTags } from '@/lib/seo';
import { getInkverseUrl, inkverseWebsiteUrl } from '@inkverse/public/utils';
import { getBannerImageUrl } from '@inkverse/public/comicseries';
import { getUserDetails, isAuthenticated } from '@/lib/auth/user';
import { getUserApolloClient } from '@/lib/apollo/client.client';
import { 
  loadUserComicData, 
  subscribeToSeries, 
  unsubscribeFromSeries, 
  enableNotificationsForSeries, 
  disableNotificationsForSeries, 
  comicSeriesQueryReducerDefault, 
  comicSeriesInitialState 
} from '@inkverse/shared-client/dispatch/comicseries';

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) { return []; }
  else if (!data.comicseries) { return []; }
  return getMetaTags({
      title: data.comicseries.name, 
      description: data.comicseries.description,
      url: `${inkverseWebsiteUrl}${getInkverseUrl({ type: "comicseries", shortUrl: data.comicseries.shortUrl })}`,
      imageURL: getBannerImageUrl({ bannerImageAsString: data.comicseries.bannerImageAsString }),
    }
  );
};

export const loader = async ({ params, request, context }: LoaderFunctionArgs) => {
  return await loadComicSeries({ params, request, context });
};

function ComicSeriesScreen() {
  const comicSeriesData = useLoaderData<typeof loader>();
  const [comicSeriesState, dispatch] = useReducer(comicSeriesQueryReducerDefault, comicSeriesInitialState);
  
  const { userComicData, isUserDataLoading, isSubscriptionLoading, isNotificationLoading } = comicSeriesState;
  
  // Load user-specific data if authenticated
  useEffect(() => {
    const currentUser = getUserDetails();
    if (currentUser && comicSeriesData?.comicseries?.uuid) {
      const userClient = getUserApolloClient();
      loadUserComicData({ 
        userClient, 
        seriesUuid: comicSeriesData.comicseries.uuid 
      }, dispatch);
    }
  }, [comicSeriesData?.comicseries?.uuid]);

  const handleAddToProfile = async () => {
    if (!isAuthenticated()) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('openSignupModal'));
      }
      return;
    }

    if (!comicSeriesData?.comicseries) return;

    try {
      const userClient = getUserApolloClient();
      const isCurrentlySubscribed = userComicData?.isSubscribed || false;
      
      if (isCurrentlySubscribed) {
        await unsubscribeFromSeries({ 
          userClient, 
          seriesUuid: comicSeriesData.comicseries.uuid 
        }, dispatch);
      } else {
        await subscribeToSeries({ 
          userClient, 
          seriesUuid: comicSeriesData.comicseries.uuid 
        }, dispatch);
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
    }
  };

  const handleGetNotifications = async () => {
    if (!isAuthenticated()) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('openSignupModal'));
      }
      return;
    }

    if (!comicSeriesData?.comicseries) return;

    try {
      const userClient = getUserApolloClient();
      const hasNotifications = userComicData?.hasNotificationEnabled || false;
      
      if (hasNotifications) {
        await disableNotificationsForSeries({ 
          userClient, 
          seriesUuid: comicSeriesData.comicseries.uuid 
        }, dispatch);
      } else {
        await enableNotificationsForSeries({ 
          userClient, 
          seriesUuid: comicSeriesData.comicseries.uuid 
        }, dispatch);
      }
    } catch (error) {
      console.error('Error updating notifications:', error);
    }
  };
  
  return (
    <>
      <div className="max-w-3xl mx-auto sm:p-6 lg:p-8">
        <ComicSeriesDetails 
          comicseries={comicSeriesData?.comicseries} 
          pageType={'comicseries-screen'} 
        />
        <div className="px-4 sm:px-6 lg:px-8 pb-3">
          <div className="flex flex-col sm:flex-row">
            {/* Invisible spacer to match cover art exact dimensions: h-60 aspect-4/6 = 160px width + mr-2 */}
            <div className="hidden sm:block w-[160px] mr-2 flex-shrink-0"></div>
            <div className="sm:w-2/3 sm:pl-4">
              <div className="flex items-start">
                <AddToProfileButton
                  isSubscribed={userComicData?.isSubscribed || false}
                  isLoading={isSubscriptionLoading || isUserDataLoading}
                  onPress={handleAddToProfile}
                  selectedText='SAVED'
                  unselectedText='SAVE'
                />
                <NotificationButton
                  isReceivingNotifications={userComicData?.hasNotificationEnabled || false}
                  isLoading={isNotificationLoading || isUserDataLoading}
                  onPress={handleGetNotifications}
                />
              </div>
            </div>
          </div>
        </div>
        <ComicIssuesList 
          comicseries={comicSeriesData?.comicseries} 
          issues={comicSeriesData?.issues?.filter((issue) => issue !== null)}
          currentIssueUuid={comicSeriesData?.issues?.[0]?.uuid}
        />
        {comicSeriesData?.comicseries && (
          <ComicSeriesInfo comicseries={comicSeriesData.comicseries} />
        )}
        {comicSeriesData.comicseries && comicSeriesData?.issues?.[0] && comicSeriesData?.issues?.length > 3 && (
          <div className="px-4 lg:px-8 pb-8">
            <ReadNextEpisode 
              comicissue={comicSeriesData.issues[0]}
              comicseries={comicSeriesData.comicseries}
              firstTextCTA="READ THE FIRST"
              secondTextCTA="EPISODE"
            />
          </div>
        )}
      </div>
    </>
  );
}

export default ComicSeriesScreen;