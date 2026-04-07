import { type LoaderFunctionArgs, type MetaFunction, redirect } from 'react-router';
import { useLoaderData, useNavigate } from 'react-router';
import { useEffect, useReducer, useCallback } from 'react';
import { MdArrowBack } from 'react-icons/md';
import { FaSpinner } from 'react-icons/fa';

import { loadProfileEdit } from '@/lib/loader/profile-edit.server';
import { getUserApolloClient } from '@/lib/apollo/client.client';
import { getMetaTags } from '@/lib/seo';
import { inkverseWebsiteUrl } from '@inkverse/public/utils';
import {
  loadNotificationSettings,
  addOrUpdateNotificationSetting,
  notificationSettingsReducer,
  notificationSettingsInitialState,
} from '@inkverse/shared-client/dispatch/notification-settings';
import { NOTIFICATION_DEFAULTS } from '@inkverse/public/notifications';
import { NotificationEventType } from '@inkverse/public/graphql/types';

export const meta: MetaFunction<typeof loader> = () => {
  return getMetaTags({
    title: 'Notification Preferences',
    description: 'Manage your Inkverse notification preferences',
    url: `${inkverseWebsiteUrl}/profile/notification-settings`,
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

const EVENT_TYPE_LABELS: Record<string, string> = {
  NEW_EPISODE_RELEASED: 'When a new episode is released',
  COMMENT_REPLY: 'When someone replies to your comment',
  COMMENT_LIKED: 'When someone likes your comment',
  CREATOR_EPISODE_LIKED: 'When someone likes an episode of your comic',
  CREATOR_EPISODE_COMMENTED: 'When someone comments on one of your episodes',
};

const READER_EVENT_TYPES = ['NEW_EPISODE_RELEASED', 'COMMENT_REPLY', 'COMMENT_LIKED'];
const CREATOR_EVENT_TYPES = ['CREATOR_EPISODE_LIKED', 'CREATOR_EPISODE_COMMENTED'];

export default function ProfileNotificationSettings() {
  const { user } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(notificationSettingsReducer, notificationSettingsInitialState);
  const { settings, isCreator, isLoading } = state;

  useEffect(() => {
    const userClient = getUserApolloClient();
    if (!userClient) return;
    loadNotificationSettings({ userClient }, dispatch);
  }, []);

  const handleToggle = useCallback(async (eventType: string, channel: string, newValue: boolean) => {
    const userClient = getUserApolloClient();
    if (!userClient) return;
    await addOrUpdateNotificationSetting(
      { userClient, eventType, channel, isEnabled: newValue },
      dispatch
    );
  }, []);

  const getSettingEnabled = (eventType: string, channel: 'PUSH' | 'EMAIL'): boolean => {
    const setting = settings.find((s) => s.eventType === eventType && s.channel === channel);
    if (setting) return setting.isEnabled;
    const defaults = NOTIFICATION_DEFAULTS[eventType as NotificationEventType];
    return defaults?.[channel] ?? false;
  };

  const renderToggle = (enabled: boolean, onToggle: () => void) => (
    <button
      role="switch"
      aria-checked={enabled}
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  const renderSection = (title: string, eventTypes: string[]) => (
    <div>
      <div className="flex items-center justify-between pt-6 pb-2 px-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        <div className="flex gap-4">
          <span className="text-xs text-gray-500 dark:text-gray-400 w-14 text-center">App</span>
          <span className="text-xs text-gray-500 dark:text-gray-400 w-14 text-center">Email</span>
        </div>
      </div>
      {eventTypes.map((eventType) => {
        const pushEnabled = getSettingEnabled(eventType, 'PUSH');
        const emailEnabled = getSettingEnabled(eventType, 'EMAIL');
        return (
          <div
            key={eventType}
            className="flex items-center justify-between py-3.5 px-4 border-b border-gray-100 dark:border-gray-800"
          >
            <span className="text-sm text-gray-900 dark:text-white flex-1 pr-4">
              {EVENT_TYPE_LABELS[eventType] || eventType}
            </span>
            <div className="flex gap-4">
              <div className="w-14 flex justify-center">
                {renderToggle(pushEnabled, () => handleToggle(eventType, 'PUSH', !pushEnabled))}
              </div>
              <div className="w-14 flex justify-center">
                {renderToggle(emailEnabled, () => handleToggle(eventType, 'EMAIL', !emailEnabled))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center mb-8">
        <button
          onClick={() => navigate('/profile/settings')}
          className="mr-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <MdArrowBack className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold">Notification Preferences</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center mt-10">
          <FaSpinner className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          {renderSection('Reader Notifications', READER_EVENT_TYPES)}
          {isCreator && renderSection('Creator Notifications', CREATOR_EVENT_TYPES)}
        </>
      )}
    </div>
  );
}
