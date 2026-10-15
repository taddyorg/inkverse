import type { LoaderFunctionArgs, MetaFunction } from 'react-router-dom';
import { Link, useLoaderData } from 'react-router';
import { useReducer, useEffect } from 'react';
import { MdPlayArrow } from 'react-icons/md';

import { ComicSeriesDetails } from '../components/comics/ComicSeriesDetails';
import { ComicIssuesList } from '../components/comics/ComicIssuesList';
import { ComicSeriesInfo } from '../components/comics/ComicSeriesInfo';
import { ReadNextEpisode } from '../components/comics/ReadNextEpisode';
import { AddToProfileButton, NotificationButton } from '../components/comics/ComicActionButtons';
import { NotFound } from '../components/ui/NotFound';

import { loadComicSeries } from '@/lib/loader/comicseries.server';
import { getMetaTags } from '@/lib/seo';
import { getInkverseUrl, inkverseWebsiteUrl } from '@inkverse/public/utils';
import { getBannerImageUrl } from '@inkverse/public/comicseries';
import { getUserDetails } from '@/lib/auth/user';
import { getUserApolloClient } from '@/lib/apollo/client.client';

import {
  loadUserComicData,
  loadComicSeriesDynamic,
  subscribeToSeries,
  unsubscribeFromSeries,
  enableNotificationsForSeries,
  disableNotificationsForSeries,
  likeComicIssueInSeries,
  unlikeComicIssueInSeries,
  comicSeriesReducer,
  type ComicSeriesLoaderData,
} from '@inkverse/shared-client/dispatch/comicseries';
import { getPublicApolloClient } from '@/lib/apollo/client.client';

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

export const loader = async (args: LoaderFunctionArgs) => {
  return await loadComicSeries(args);
};

const INITIAL_VISIBLE_ISSUES = 5;

export default function ComicSeries() {
  const comicSeriesData = useLoaderData<typeof loader>();
  const seriesKey = comicSeriesData.comicseries?.uuid || 'no-series';
  return <ComicSeriesContent key={seriesKey} initialData={comicSeriesData} />;
}

function ComicSeriesContent({ initialData }: { initialData: Partial<ComicSeriesLoaderData> & { loaderError?: boolean } }) {
  const [comicSeriesState, dispatch] = useReducer(comicSeriesReducer, initialData);
  
  const {
    comicseries,
    issues,
    isComicSeriesLoading,
    userComicData,
    isUserDataLoading,
    isSubscriptionLoading,
    isNotificationLoading,
    likeCount,
    commentCount,
    issueLikeLoadingMap,
  } = comicSeriesState;
  
  // Load dynamic data (stats) on mount
  useEffect(() => {
    if (comicseries?.uuid) {
      const publicClient = getPublicApolloClient();
      loadComicSeriesDynamic({ publicClient, seriesUuid: comicseries.uuid }, dispatch);
    }
  }, [comicseries?.uuid]);

  // Load user-specific data if authenticated
  useEffect(() => {
    const currentUser = getUserDetails();
    if (currentUser && comicseries?.uuid) {
      const userClient = getUserApolloClient();
      loadUserComicData({ userClient, seriesUuid: comicseries.uuid }, dispatch);
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

  if (initialData.loaderError) {
    return <NotFound message="Something went wrong" subtitle="Please try again later." />;
  }

  if (!isComicSeriesLoading && !comicseries) {
    return <NotFound message="Comic series not found" />;
  }

  const firstIssue = issues?.[0];
  const firstIssueUrl = comicseries && firstIssue
    ? getInkverseUrl({ type: "comicissue", shortUrl: comicseries.shortUrl, name: firstIssue.name, uuid: firstIssue.uuid })
    : undefined;

  return (
    <>
      <div className="max-w-3xl mx-auto sm:py-6 lg:py-8">
        <ComicSeriesDetails
          comicseries={comicseries}
          pageType={'comicseries-screen'}
          likeCount={likeCount}
          commentCount={commentCount}
          actions={
            <div className="flex items-center gap-2 m-4 sm:mx-auto sm:max-w-[420px]">
              {!!firstIssueUrl && (
                <Link
                  to={firstIssueUrl}
                  className="flex flex-1 items-center justify-center gap-1 h-10 rounded-full bg-brand-pink dark:bg-brand-purple text-white font-semibold hover:opacity-90 transition-opacity duration-200"
                >
                  <MdPlayArrow size={22} />
                  Start Reading
                </Link>
              )}
              <AddToProfileButton
                isSubscribed={userComicData?.isSubscribed || false}
                isLoading={isSubscriptionLoading || isUserDataLoading || false}
                onPress={handleAddToProfile}
              />
              <NotificationButton
                isReceivingNotifications={userComicData?.hasNotificationEnabled || false}
                isLoading={isNotificationLoading || isUserDataLoading || false}
                onPress={handleGetNotifications}
              />
            </div>
          }
        />
        {/* Section break before Episodes, larger than the gaps inside a section */}
        <div className="mt-6">
          <ComicIssuesList
            comicseries={comicseries}
            issues={issues?.filter((issue) => issue !== null)}
            currentIssueUuid={issues?.[0]?.uuid}
            likedIssueUuids={userComicData?.likedComicIssueUuids || []}
            issueLikeLoadingMap={issueLikeLoadingMap || {}}
            onLikeIssue={handleLikeIssue}
            initialVisibleCount={INITIAL_VISIBLE_ISSUES}
          />
        </div>
        {comicseries && (
          <ComicSeriesInfo comicseries={comicseries} />
        )}
        {comicseries && issues?.[0] && issues?.length > 3 && (
          <div className="px-4 pt-6 pb-8">
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
