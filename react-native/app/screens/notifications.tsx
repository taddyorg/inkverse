import React, { useCallback, useEffect, useMemo, useReducer } from 'react';
import { StyleSheet, View, useColorScheme } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';

import { Screen, ThemedView, ThemedText, HeaderBackButton, ThemedRefreshControl, ThemedActivityIndicator } from '../components/ui';
import { PressableOpacity } from '../components/ui/PressableOpacity';
import { Colors } from '@/constants/Colors';
import { getUserApolloClient } from '@/lib/apollo';
import { COMICISSUE_SCREEN, COMICSERIES_SCREEN, RootStackParamList } from '@/constants/Navigation';
import {
  loadNotifications,
  loadMoreNotifications,
  notificationsReducer,
  notificationsInitialState,
  type NotificationFeedItem,
  type NotificationSection,
} from '@inkverse/shared-client/dispatch/notifications';
import { prettyFormattedDate } from '@inkverse/shared-client/utils/date';

function relativeTimeFromEpoch(epoch: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - epoch;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800) return 'Yesterday';
  return prettyFormattedDate(new Date(epoch * 1000));
}

function bucketLabel(bucket: string): string {
  switch (bucket) {
    case 'TODAY': return 'Today';
    case 'THIS_WEEK': return 'This Week';
    case 'THIS_MONTH': return 'This Month';
    case 'EARLIER': return 'Earlier';
    default: return bucket;
  }
}

type ListItem =
  | { type: 'header'; bucket: string }
  | { type: 'item'; item: NotificationFeedItem };

export function NotificationsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const colorScheme = useColorScheme() ?? 'light';
  const [state, dispatch] = useReducer(notificationsReducer, notificationsInitialState);

  const userClient = getUserApolloClient();

  const loadData = useCallback(async (forceRefresh = false) => {
    if (!userClient) return;
    await loadNotifications({ userClient, forceRefresh }, dispatch);
  }, [userClient]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLoadMore = useCallback(async () => {
    if (!userClient || !state.hasMore || state.isLoadingMore) return;
    await loadMoreNotifications({
      userClient,
      currentBucketIndex: state.currentBucketIndex,
      currentOffset: state.currentOffset,
    }, dispatch);
  }, [userClient, state.hasMore, state.isLoadingMore, state.currentBucketIndex, state.currentOffset]);

  const handleRefresh = useCallback(async () => {
    await loadData(true);
  }, [loadData]);

  const handleItemPress = useCallback((item: NotificationFeedItem) => {
    const targetItem = item.targetItem;
    const parentItem = item.parentItem;

    if (targetItem?.type === 'COMICISSUE' && parentItem?.uuid) {
      navigation.navigate(COMICISSUE_SCREEN, {
        issueUuid: targetItem.uuid,
        seriesUuid: parentItem.uuid,
      });
    } else if (targetItem?.type === 'COMICSERIES') {
      navigation.navigate(COMICSERIES_SCREEN, {
        uuid: targetItem.uuid,
      });
    } else if (parentItem?.type === 'COMICISSUE' && parentItem?.uuid) {
      navigation.navigate(COMICISSUE_SCREEN, {
        issueUuid: parentItem.uuid,
        seriesUuid: parentItem.comicIssue?.seriesUuid || parentItem.uuid,
      });
    }
  }, [navigation]);

  const listData = useMemo((): ListItem[] => {
    const items: ListItem[] = [];
    for (const section of state.sections) {
      items.push({ type: 'header', bucket: section.bucket });
      for (const item of section.items) {
        items.push({ type: 'item', item });
      }
    }
    return items;
  }, [state.sections]);

  const getNotificationIcon = (eventType: string) => {
    switch (eventType) {
      case 'NEW_EPISODE_RELEASED':
        return { name: 'book-outline', color: '#567CD6', bg: 'rgba(86, 124, 214, 0.15)' };
      case 'COMMENT_REPLY':
        return { name: 'chatbubble-outline', color: '#A372F2', bg: 'rgba(163, 114, 242, 0.15)' };
      case 'COMMENT_LIKED':
      case 'CREATOR_EPISODE_LIKED':
        return { name: 'heart-outline', color: '#ED5959', bg: 'rgba(237, 89, 89, 0.15)' };
      case 'CREATOR_EPISODE_COMMENTED':
        return { name: 'chatbubbles-outline', color: '#A372F2', bg: 'rgba(163, 114, 242, 0.15)' };
      default:
        return { name: 'notifications-outline', color: Colors[colorScheme].tint, bg: 'rgba(99, 102, 241, 0.1)' };
    }
  };

  const getNotificationText = (item: NotificationFeedItem): string => {
    if (item.__typename === 'AggregatedNotification') {
      const name = item.parentItem?.comicSeries?.name || item.targetItem?.comicIssue?.name || '';
      switch (item.eventType) {
        case 'CREATOR_EPISODE_LIKED':
          return `${item.count} ${item.count === 1 ? 'person' : 'people'} liked your episode${name ? ` of ${name}` : ''}`;
        case 'CREATOR_EPISODE_COMMENTED':
          return `${item.count} new ${item.count === 1 ? 'comment' : 'comments'} on your episode${name ? ` of ${name}` : ''}`;
        case 'COMMENT_LIKED':
          return `${item.count} ${item.count === 1 ? 'person' : 'people'} liked your comment`;
        default:
          return `${item.count} new notifications`;
      }
    }

    if (item.__typename !== 'Notification') return 'New notification';

    const actorName = item.actor?.username || 'Someone';
    const seriesName = item.parentItem?.comicSeries?.name || item.targetItem?.comicSeries?.name || '';

    switch (item.eventType) {
      case 'NEW_EPISODE_RELEASED':
        return `New episode of ${seriesName || 'a series you follow'} is now available`;
      case 'COMMENT_REPLY':
        return `${actorName} replied to your comment`;
      default:
        return 'New notification';
    }
  };

  const getCreatedAt = (item: NotificationFeedItem): number => {
    if (item.__typename === 'AggregatedNotification') {
      return item.latestCreatedAt;
    }
    return (item as Extract<NotificationFeedItem, { __typename?: 'Notification' }>).createdAt;
  };

  const renderItem = useCallback(({ item: listItem }: { item: ListItem }) => {
    if (listItem.type === 'header') {
      return (
        <ThemedView style={styles.sectionHeader}>
          <ThemedText style={styles.sectionHeaderText}>
            {bucketLabel(listItem.bucket)}
          </ThemedText>
        </ThemedView>
      );
    }

    const item = listItem.item;
    const icon = getNotificationIcon(item.eventType);
    const borderColor = colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
    return (
      <PressableOpacity onPress={() => handleItemPress(item)}>
        <ThemedView style={[styles.notificationItem, { borderBottomColor: borderColor }]}>
          <View style={[styles.iconContainer, { backgroundColor: icon.bg }]}>
            <Ionicons
              name={icon.name as any}
              size={24}
              color={icon.color}
            />
          </View>
          <View style={styles.contentContainer}>
            <ThemedText style={styles.notificationText} numberOfLines={2}>
              {getNotificationText(item)}
            </ThemedText>
            <ThemedText style={styles.timeText}>
              {relativeTimeFromEpoch(getCreatedAt(item))}
            </ThemedText>
          </View>
        </ThemedView>
      </PressableOpacity>
    );
  }, [colorScheme, handleItemPress]);

  const renderEmptyState = useCallback(() => {
    if (state.isLoading) return null;
    return (
      <ThemedView style={styles.emptyState}>
        <Ionicons name="notifications-off-outline" size={48} color={Colors[colorScheme].icon} />
        <ThemedText style={styles.emptyStateText}>No notifications yet</ThemedText>
      </ThemedView>
    );
  }, [state.isLoading, colorScheme]);

  const renderFooter = useCallback(() => {
    if (state.isLoadingMore) {
      return <ThemedActivityIndicator style={styles.footerLoading} />;
    }
    if (state.hasMore && state.sections.length > 0) {
      return (
        <PressableOpacity onPress={handleLoadMore} style={styles.loadMoreButton}>
          <ThemedText style={styles.loadMoreText}>Load more notifications</ThemedText>
        </PressableOpacity>
      );
    }
    return null;
  }, [state.isLoadingMore, state.hasMore, state.sections.length, handleLoadMore]);

  return (
    <Screen>
      <View>
        <HeaderBackButton />
      </View>
      <ThemedView style={styles.titleContainer}>
        <ThemedText size="title">Notifications</ThemedText>
      </ThemedView>
      <ThemedView style={styles.container}>
        {state.isLoading && state.sections.length === 0 ? (
          <ThemedActivityIndicator style={styles.loadingIndicator} />
        ) : (
          <FlashList
            data={listData}
            renderItem={renderItem}
            keyExtractor={(listItem, index) => {
              if (listItem.type === 'header') {
                return `header-${listItem.bucket}`;
              }
              return listItem.item.id;
            }}
            getItemType={(listItem) => listItem.type}
            refreshControl={
              <ThemedRefreshControl refreshing={state.isLoading} onRefresh={handleRefresh} />
            }
            ListEmptyComponent={renderEmptyState}
            ListFooterComponent={renderFooter}
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
    paddingTop: 28,
    paddingBottom: 8,
  },
  sectionHeaderText: {
    fontSize: 14,
    fontFamily: 'SourceSans3-SemiBold',
    textTransform: 'uppercase',
    opacity: 0.6,
    letterSpacing: 0.5,
  },
  notificationItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  notificationText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'SourceSans3-SemiBold',
  },
  timeText: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyStateText: {
    fontSize: 16,
    opacity: 0.6,
    marginTop: 12,
  },
  loadingIndicator: {
    marginTop: 40,
  },
  footerLoading: {
    paddingVertical: 20,
  },
  loadMoreButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loadMoreText: {
    fontSize: 14,
    opacity: 0.6,
  },
});
