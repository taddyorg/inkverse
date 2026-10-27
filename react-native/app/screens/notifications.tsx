import React, { useCallback, useEffect, useMemo, useReducer } from 'react';
import { StyleSheet, View, useColorScheme } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Screen, ScreenHeader, ThemedView, ThemedText, HeaderBackButton, ThemedRefreshControl, ThemedActivityIndicator, useLayout } from '../components/ui';
import { PressableOpacity } from '../components/ui/PressableOpacity';
import { Colors } from '@/constants/Colors';
import { SPACING } from '@/constants/Spacing';
import { getUserApolloClient } from '@/lib/apollo';
import { COMICISSUE_SCREEN, COMMENTS_SCREEN, RootStackParamList } from '@/constants/Navigation';
import {
  loadNotifications,
  loadMoreNotifications,
  notificationsReducer,
  notificationsInitialState,
  type NotificationFeedItem,
  type NotificationSection,
} from '@inkverse/shared-client/dispatch/notifications';
import {
  relativeTimeFromEpoch,
  bucketLabel,
  getCreatedAt,
  getNotificationText,
} from '@inkverse/shared-client/utils/notifications';

type ListItem =
  | { type: 'header'; bucket: string }
  | { type: 'item'; item: NotificationFeedItem };

// Floating back button (24 icon + 2 * 8 padding)
const HEADER_BUTTON_SIZE = 40;
const TITLE_MARGIN_TOP = 16;
// On wider layouts (landscape, iPad), the back button hugs the screen edge beside the title,
// like the most liked / discussed screen, instead of sitting above it
const getBackButtonSideOffset = (isWide: boolean, contentInsetX: number) =>
  isWide ? SPACING.xl : contentInsetX + 16;

export function NotificationsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const colorScheme = useColorScheme() ?? 'light';
  const [state, dispatch] = useReducer(notificationsReducer, notificationsInitialState);
  // Centered content column on wider layouts (landscape, iPad); 0 on phones
  const { contentInsetX, isSm } = useLayout();
  const insets = useSafeAreaInsets();
  // On wider layouts the back button hugs the screen edge, so pull the list and title in past it
  const listPaddingX = isSm
    ? Math.max(16 + contentInsetX, getBackButtonSideOffset(true, contentInsetX) + HEADER_BUTTON_SIZE + SPACING.md)
    : 16 + contentInsetX;
  // Phone portrait: the button lines up with the list, above the title. On wider layouts it sits
  // level with the title (no extra header padding), so nothing moves down
  const backButtonStyle = isSm
    ? { top: insets.top + TITLE_MARGIN_TOP, left: getBackButtonSideOffset(true, contentInsetX) }
    : { left: getBackButtonSideOffset(false, contentInsetX) };

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

    switch (item.eventType) {
      case 'NEW_EPISODE_RELEASED':
      case 'CREATOR_EPISODE_LIKED': {
        if (!targetItem?.uuid || !parentItem?.uuid) return;
        navigation.navigate(COMICISSUE_SCREEN, {
          issueUuid: targetItem.uuid,
          seriesUuid: parentItem.uuid,
        });
        return;
      }
      case 'COMMENT_REPLY':
      case 'COMMENT_LIKED': {
        const issueUuid = parentItem?.uuid;
        const seriesUuid = parentItem?.comicIssue?.seriesUuid;
        if (!issueUuid || !seriesUuid) return;
        navigation.navigate(COMMENTS_SCREEN, { issueUuid, seriesUuid });
        return;
      }
      case 'CREATOR_EPISODE_COMMENTED': {
        if (!targetItem?.uuid || !parentItem?.uuid) return;
        navigation.navigate(COMMENTS_SCREEN, {
          issueUuid: targetItem.uuid,
          seriesUuid: parentItem.uuid,
        });
        return;
      }
      default:
        return;
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

  const renderHeader = useCallback(() => (
    <View style={styles.listHeader}>
      <ThemedText size="title" style={styles.title}>
        Notifications
      </ThemedText>
    </View>
  ), []);

  const renderEmptyState = useCallback(() => {
    if (state.isLoading || state.hasMore) return null;
    return (
      <ThemedView style={styles.emptyState}>
        <Ionicons name="notifications-off-outline" size={48} color={Colors[colorScheme].icon} />
        <ThemedText style={styles.emptyStateText}>No notifications yet</ThemedText>
      </ThemedView>
    );
  }, [state.isLoading, state.hasMore, colorScheme]);

  const renderFooter = useCallback(() => {
    if (state.isLoadingMore) {
      return <ThemedActivityIndicator style={styles.footerLoading} />;
    }
    if (state.hasMore && !state.isLoading) {
      return (
        <PressableOpacity onPress={handleLoadMore} style={styles.loadMoreButton}>
          <ThemedText style={styles.loadMoreText}>Load more notifications</ThemedText>
        </PressableOpacity>
      );
    }
    return null;
  }, [state.isLoadingMore, state.hasMore, state.isLoading, handleLoadMore]);

  return (
    <Screen>
      <View style={styles.headerContainer}>
        <ScreenHeader additionalTopPadding={isSm ? 0 : undefined} />
        <HeaderBackButton style={backButtonStyle} />
      </View>
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
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.listContent, { paddingHorizontal: listPaddingX }]}
            ListHeaderComponent={renderHeader}
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
  headerContainer: {
    paddingHorizontal: 16,
  },
  listHeader: {
    marginBottom: 8,
  },
  title: {
    marginTop: TITLE_MARGIN_TOP,
    marginBottom: 8,
  },
  listContent: {
    paddingBottom: 24,
  },
  sectionHeader: {
    paddingTop: SPACING.lg,
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
