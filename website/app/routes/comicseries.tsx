import type { LoaderFunctionArgs, MetaFunction } from 'react-router-dom';
import { useLoaderData } from 'react-router';
import { useReducer, useEffect } from 'react';

import { ComicSeriesDetails } from '../components/comics/ComicSeriesDetails';
import { ComicIssuesList } from '../components/comics/ComicIssuesList';
import { ComicSeriesInfo } from '../components/comics/ComicSeriesInfo';
import { ReadNextEpisode } from '../components/comics/ReadNextEpisode';

import { loadComicSeries } from '@/lib/loader/comicseries.server';
import { getMetaTags } from '@/lib/seo';
import { getInkverseUrl, inkverseWebsiteUrl } from '@inkverse/public/utils';
import { getBannerImageUrl } from '@inkverse/public/comicseries';
import { getUserDetails } from '@/lib/auth/user';
import { getUserApolloClient } from '@/lib/apollo/client.client';
import {
  loadUserComicData,
  subscribeToSeries,
  unsubscribeFromSeries,
  enableNotificationsForSeries,
  disableNotificationsForSeries,
  likeComicIssueInSeries,
  unlikeComicIssueInSeries,
  comicSeriesReducer,
  type ComicSeriesLoaderData,
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

export default function ComicSeries() {
  const comicSeriesData = useLoaderData<typeof loader>();
  const seriesKey = comicSeriesData.comicseries?.uuid || 'no-series';
  return <ComicSeriesContent key={seriesKey} initialData={comicSeriesData} />;
}

function ComicSeriesContent({ initialData }: { initialData: Partial<ComicSeriesLoaderData> }) {
  const [comicSeriesState, dispatch] = useReducer(comicSeriesReducer, initialData);
  
  const {
    comicseries,
    issues,
    isComicSeriesLoading,
    userComicData,
    isUserDataLoading,
    isSubscriptionLoading,
    isNotificationLoading,
    comicIssueStats,
    issueLikeLoadingMap,
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
    const currentUser = getUserDetails();
    if (!currentUser || !currentUser.id) {
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
          seriesUuid: comicseries.uuid,
          userId: currentUser?.id
        }, dispatch);
      } else {
        await subscribeToSeries({ 
          userClient, 
          seriesUuid: comicseries.uuid,
          userId: currentUser?.id
        }, dispatch);
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
    }
  };

  const handleGetNotifications = async () => {
    const currentUser = getUserDetails();
    if (!currentUser || !currentUser.id) {
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
          seriesUuid: comicseries.uuid,
          userId: currentUser?.id
        }, dispatch);
      } else {
        await enableNotificationsForSeries({ 
          userClient, 
          seriesUuid: comicseries.uuid,
          userId: currentUser?.id
        }, dispatch);
      }
    } catch (error) {
      console.error('Error updating notifications:', error);
    }
  };

  const handleLikeIssue = async (issueUuid: string) => {
    const currentUser = getUserDetails();
    if (!currentUser || !currentUser.id) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('openSignupModal'));
      }
      return;
    }

    if (!comicseries) return;

    try {
      const userClient = getUserApolloClient();
      const isCurrentlyLiked = userComicData?.likedComicIssueUuids?.includes(issueUuid) || false;

      if (isCurrentlyLiked) {
        await unlikeComicIssueInSeries({
          userClient,
          issueUuid,
          seriesUuid: comicseries.uuid,
        }, dispatch);
      } else {
        await likeComicIssueInSeries({
          userClient,
          issueUuid,
          seriesUuid: comicseries.uuid,
        }, dispatch);
      }
    } catch (error) {
      console.error('Error updating like status:', error);
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
          userComicData={userComicData}
          isSubscriptionLoading={isSubscriptionLoading}
          isNotificationLoading={isNotificationLoading}
          isUserDataLoading={isUserDataLoading}
          onAddToProfile={handleAddToProfile}
          onGetNotifications={handleGetNotifications}
        />
        <ComicIssuesList
          comicseries={comicseries}
          issues={issues?.filter((issue) => issue !== null)}
          currentIssueUuid={issues?.[0]?.uuid}
          comicIssueStats={comicIssueStats}
          likedIssueUuids={userComicData?.likedComicIssueUuids || []}
          issueLikeLoadingMap={issueLikeLoadingMap || {}}
          onLikeIssue={handleLikeIssue}
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