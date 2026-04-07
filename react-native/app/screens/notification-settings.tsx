import React, { useCallback, useEffect, useReducer } from 'react';
import { StyleSheet, SectionList, Switch, View, useColorScheme, Platform } from 'react-native';

import { Screen, ThemedView, ThemedText, HeaderBackButton, ThemedActivityIndicator } from '../components/ui';
import { Colors } from '@/constants/Colors';
import { getUserApolloClient } from '@/lib/apollo';
import {
  loadNotificationSettings,
  addOrUpdateNotificationSetting,
  notificationSettingsReducer,
  notificationSettingsInitialState,
} from '@inkverse/shared-client/dispatch/notification-settings';
import { NOTIFICATION_DEFAULTS } from '@inkverse/public/notifications';
import { NotificationEventType } from '@inkverse/public/graphql/types';

const EVENT_TYPE_LABELS: Record<string, string> = {
  NEW_EPISODE_RELEASED: 'When a new episode is released',
  COMMENT_REPLY: 'When someone replies to your comment',
  COMMENT_LIKED: 'When someone likes your comment',
  CREATOR_EPISODE_LIKED: 'When someone likes an episode of your comic',
  CREATOR_EPISODE_COMMENTED: 'When someone comments on one of your episodes',
};

const READER_EVENT_TYPES = ['NEW_EPISODE_RELEASED', 'COMMENT_REPLY', 'COMMENT_LIKED'];
const CREATOR_EVENT_TYPES = ['CREATOR_EPISODE_LIKED', 'CREATOR_EPISODE_COMMENTED'];

type SettingRow = {
  eventType: string;
  label: string;
  pushEnabled: boolean;
  emailEnabled: boolean;
};

type Section = {
  title: string;
  data: SettingRow[];
};

export function NotificationSettingsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const [state, dispatch] = useReducer(notificationSettingsReducer, notificationSettingsInitialState);
  const { settings, isCreator, isLoading } = state;

  const userClient = getUserApolloClient();

  useEffect(() => {
    if (!userClient) return;
    loadNotificationSettings({ userClient }, dispatch);
  }, [userClient]);

  const handleToggle = useCallback(async (eventType: string, channel: string, newValue: boolean) => {
    if (!userClient) return;
    await addOrUpdateNotificationSetting(
      { userClient, eventType, channel, isEnabled: newValue },
      dispatch
    );
  }, [userClient]);

  const buildSections = useCallback((): Section[] => {
    const buildRows = (eventTypes: string[]): SettingRow[] =>
      eventTypes.map((eventType) => {
        const defaults = NOTIFICATION_DEFAULTS[eventType as NotificationEventType] || { PUSH: false, EMAIL: false };
        const pushSetting = settings.find((s) => s.eventType === eventType && s.channel === 'PUSH');
        const emailSetting = settings.find((s) => s.eventType === eventType && s.channel === 'EMAIL');
        return {
          eventType,
          label: EVENT_TYPE_LABELS[eventType] || eventType,
          pushEnabled: pushSetting?.isEnabled ?? defaults.PUSH,
          emailEnabled: emailSetting?.isEnabled ?? defaults.EMAIL,
        };
      });

    const sections: Section[] = [
      { title: 'Reader Notifications', data: buildRows(READER_EVENT_TYPES) },
    ];

    if (isCreator) {
      sections.push({ title: 'Creator Notifications', data: buildRows(CREATOR_EVENT_TYPES) });
    }

    return sections;
  }, [settings, isCreator]);

  const renderItem = useCallback(({ item }: { item: SettingRow }) => {
    return (
      <ThemedView style={styles.settingRow}>
        <ThemedText style={styles.settingLabel}>{item.label}</ThemedText>
        <View style={styles.toggleColumns}>
          <Switch
            value={item.pushEnabled}
            onValueChange={(value) => handleToggle(item.eventType, 'PUSH', value)}
            trackColor={{ true: Colors[colorScheme].tint }}
            thumbColor={Colors[colorScheme].background}
          />
          <Switch
            value={item.emailEnabled}
            onValueChange={(value) => handleToggle(item.eventType, 'EMAIL', value)}
            trackColor={{ true: Colors[colorScheme].tint }}
            thumbColor={Colors[colorScheme].background}
          />
        </View>
      </ThemedView>
    );
  }, [handleToggle, colorScheme]);

  const renderSectionHeader = useCallback(({ section }: { section: Section }) => {
    return (
      <ThemedView style={styles.sectionHeader}>
        <ThemedText size="subtitle" style={styles.sectionTitle}>{section.title}</ThemedText>
        <View style={styles.columnHeaders}>
          <ThemedText style={styles.columnHeaderText}>App</ThemedText>
          <ThemedText style={styles.columnHeaderText}>Email</ThemedText>
        </View>
      </ThemedView>
    );
  }, []);

  return (
    <Screen>
      <View>
        <HeaderBackButton />
      </View>
      <ThemedView style={styles.titleContainer}>
        <ThemedText size="title">Notification Preferences</ThemedText>
      </ThemedView>
      <ThemedView style={styles.container}>
        {isLoading ? (
          <ThemedActivityIndicator style={styles.loadingIndicator} />
        ) : (
          <SectionList
            sections={buildSections()}
            renderItem={renderItem}
            renderSectionHeader={renderSectionHeader}
            keyExtractor={(item) => item.eventType}
            showsVerticalScrollIndicator={false}
            stickySectionHeadersEnabled={false}
          />
        )}
      </ThemedView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  titleContainer: {
    paddingHorizontal: 16,
    paddingTop: 90,
    paddingBottom: 12,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontWeight: '600',
  },
  columnHeaders: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  columnHeaderText: {
    fontSize: 12,
    width: 58,
    textAlign: 'center',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
    gap: 10,
  },
  settingLabel: {
    flex: 1,
    fontSize: 15,
  },
  toggleColumns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingIndicator: {
    marginTop: 40,
  },
});
