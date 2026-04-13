import { type LoaderFunctionArgs, type MetaFunction, redirect } from 'react-router';
import { useLoaderData, useNavigate } from 'react-router';
import { useEffect, useReducer, useCallback, useMemo } from 'react';
import { MdArrowBack } from 'react-icons/md';
import { IoBookOutline, IoChatbubbleOutline, IoHeartOutline, IoChatbubblesOutline, IoNotificationsOffOutline, IoNotificationsOutline } from 'react-icons/io5';
import { FaSpinner } from 'react-icons/fa';

import { loadProfileEdit } from '@/lib/loader/profile-edit.server';
import { getUserApolloClient } from '@/lib/apollo/client.client';
import { getMetaTags } from '@/lib/seo';
import { inkverseWebsiteUrl } from '@inkverse/public/utils';
import {
  loadNotifications,
  loadMoreNotifications,
  notificationsReducer,
  notificationsInitialState,
  type NotificationFeedItem,
} from '@inkverse/shared-client/dispatch/notifications';
import {
  relativeTimeFromEpoch,
  bucketLabel,
  getCreatedAt,
  getNotificationText,
} from '@inkverse/shared-client/utils/notifications';

export const meta: MetaFunction<typeof loader> = () => {
  return getMetaTags({
    title: 'Notifications',
    description: 'Your Inkverse notifications',
    url: `${inkverseWebsiteUrl}/profile/notifications`,
  });
};

export const loader = async (args: LoaderFunctionArgs) => {
  const data = await loadProfileEdit(args);
  if (!data.user) {
    return redirect('/');
  }
  return data;
};

export const headers = () => ({
  'Cache-Control': 'private, no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
});

function getNotificationIcon(eventType: string) {
  switch (eventType) {
    case 'NEW_EPISODE_RELEASED':
      return { Icon: IoBookOutline, color: '#567CD6', bg: 'rgba(86, 124, 214, 0.15)' };
    case 'COMMENT_REPLY':
      return { Icon: IoChatbubbleOutline, color: '#A372F2', bg: 'rgba(163, 114, 242, 0.15)' };
    case 'COMMENT_LIKED':
    case 'CREATOR_EPISODE_LIKED':
      return { Icon: IoHeartOutline, color: '#ED5959', bg: 'rgba(237, 89, 89, 0.15)' };
    case 'CREATOR_EPISODE_COMMENTED':
      return { Icon: IoChatbubblesOutline, color: '#A372F2', bg: 'rgba(163, 114, 242, 0.15)' };
    default:
      return { Icon: IoNotificationsOutline, color: '#6366F1', bg: 'rgba(99, 102, 241, 0.1)' };
  }
}

export default function ProfileNotifications() {
  const { user } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(notificationsReducer, notificationsInitialState);

  useEffect(() => {
    const userClient = getUserApolloClient();
    if (!userClient) return;
    loadNotifications({ userClient }, dispatch);
  }, []);

  const handleLoadMore = useCallback(async () => {
    const userClient = getUserApolloClient();
    if (!userClient || !state.hasMore || state.isLoadingMore) return;
    await loadMoreNotifications({
      userClient,
      currentBucketIndex: state.currentBucketIndex,
      currentOffset: state.currentOffset,
    }, dispatch);
  }, [state.hasMore, state.isLoadingMore, state.currentBucketIndex, state.currentOffset]);

  const handleItemPress = useCallback((item: NotificationFeedItem) => {
    const targetItem = item.targetItem;
    const parentItem = item.parentItem;

    switch (item.eventType) {
      case 'NEW_EPISODE_RELEASED':
      case 'CREATOR_EPISODE_LIKED':
      case 'CREATOR_EPISODE_COMMENTED': {
        const shortUrl = parentItem?.comicSeries?.shortUrl;
        if (!targetItem?.uuid || !shortUrl) return;
        navigate(`/comics/${shortUrl}/${targetItem.uuid}`);
        return;
      }
      case 'COMMENT_REPLY':
      case 'COMMENT_LIKED': {
        const shortUrl = parentItem?.comicSeries?.shortUrl;
        if (!parentItem?.uuid || !shortUrl) return;
        navigate(`/comics/${shortUrl}/${parentItem.uuid}`);
        return;
      }
      default:
        return;
    }
  }, [navigate]);

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center mb-8">
        <button
          onClick={() => navigate(`/${user.username}`)}
          className="mr-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <MdArrowBack className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold">Notifications</h1>
      </div>

      {/* Loading state */}
      {state.isLoading && state.sections.length === 0 && (
        <div className="flex justify-center mt-10">
          <FaSpinner className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      )}

      {/* Empty state */}
      {!state.isLoading && state.sections.length === 0 && !state.hasMore && (
        <div className="flex flex-col items-center justify-center pt-20">
          <IoNotificationsOffOutline className="w-12 h-12 text-gray-400" />
          <p className="text-gray-500 dark:text-gray-400 mt-3">No notifications yet</p>
        </div>
      )}

      {/* Notification sections */}
      {state.sections.map((section) => (
        <div key={section.bucket}>
          <p className="text-sm font-semibold uppercase text-gray-500 dark:text-gray-400 tracking-wide px-4 pt-7 pb-2">
            {bucketLabel(section.bucket)}
          </p>
          {section.items.map((item) => {
            const icon = getNotificationIcon(item.eventType);
            return (
              <button
                key={item.id}
                onClick={() => handleItemPress(item)}
                className="flex items-center w-full text-left py-3.5 px-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer border-b border-gray-100 dark:border-gray-800 rounded-lg transition-colors"
              >
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center mr-3 shrink-0"
                  style={{ backgroundColor: icon.bg }}
                >
                  <icon.Icon className="w-6 h-6" style={{ color: icon.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2">
                    {getNotificationText(item)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {relativeTimeFromEpoch(getCreatedAt(item))}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      ))}

      {/* Load more */}
      {state.isLoadingMore && (
        <div className="flex justify-center py-5">
          <FaSpinner className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      )}
      {state.hasMore && !state.isLoadingMore && !state.isLoading && (
        <button
          onClick={handleLoadMore}
          className="w-full py-4 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Load more notifications
        </button>
      )}
    </div>
  );
}
