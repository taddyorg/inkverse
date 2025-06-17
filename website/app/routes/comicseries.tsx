import type { LoaderFunctionArgs, MetaFunction } from 'react-router-dom';
import { useLoaderData } from 'react-router';
import { useReducer, useEffect } from 'react';

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
  comicSeriesReducer, 
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
  const [comicSeriesState, dispatch] = useReducer(comicSeriesReducer, comicSeriesData);
  
  const {
    comicseries,
    issues,
    isComicSeriesLoading,
    userComicData, 
    isUserDataLoading, 
    isSubscriptionLoading, 
    isNotificationLoading,
  } = comicSeriesState;
  
  // Load user-specific data if authenticated
  useEffect(() => {
    const currentUser = getUserDetails();
    if (currentUser && comicseries?.uuid) {
      const userClient = getUserApolloClient();
      loadUserComicData({ 
        userClient, 
        seriesUuid: comicseries.uuid 
      }, dispatch);
    }
  }, [comicseries?.uuid]);

  const handleAddToProfile = async () => {
    if (!isAuthenticated()) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('openSignupModal'));
      }
      return;
    }

    if (!comicseries) return;

    try {
      const userClient = getUserApolloClient();
      const isCurrentlySubscribed = userComicData?.isSubscribed || false;
      
      if (isCurrentlySubscribed) {
        await unsubscribeFromSeries({ 
          userClient, 
          seriesUuid: comicseries.uuid 
        }, dispatch);
      } else {
        await subscribeToSeries({ 
          userClient, 
          seriesUuid: comicseries.uuid 
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

    if (!comicseries) return;

    try {
      const userClient = getUserApolloClient();
      const hasNotifications = userComicData?.hasNotificationEnabled || false;
      
      if (hasNotifications) {
        await disableNotificationsForSeries({ 
          userClient, 
          seriesUuid: comicseries.uuid 
        }, dispatch);
      } else {
        await enableNotificationsForSeries({ 
          userClient, 
          seriesUuid: comicseries.uuid 
        }, dispatch);
      }
    } catch (error) {
      console.error('Error updating notifications:', error);
    }
  };
  
  if (!isComicSeriesLoading && !comicseries) {
    return (
      <div className="max-w-3xl mx-auto sm:p-6 lg:p-8 h-96 flex items-center justify-center">
        <p className="text-lg font-medium text-center">
          Comic series not found
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="max-w-3xl mx-auto sm:p-6 lg:p-8">
        <ComicSeriesDetails 
          comicseries={comicseries} 
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
                  isLoading={isSubscriptionLoading || isUserDataLoading || false}
                  onPress={handleAddToProfile}
                  selectedText='SAVED'
                  unselectedText='SAVE'
                />
                <NotificationButton
                  isReceivingNotifications={userComicData?.hasNotificationEnabled || false}
                  isLoading={isNotificationLoading || isUserDataLoading || false}
                  onPress={handleGetNotifications}
                />
              </div>
            </div>
          </div>
        </div>
        <ComicIssuesList 
          comicseries={comicseries} 
          issues={issues?.filter((issue) => issue !== null)}
          currentIssueUuid={issues?.[0]?.uuid}
        />
        {comicseries && (
          <ComicSeriesInfo comicseries={comicseries} />
        )}
        {comicseries && issues?.[0] && issues?.length > 3 && (
          <div className="px-4 lg:px-8 pb-8">
            <ReadNextEpisode 
              comicissue={issues[0]}
              comicseries={comicseries}
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