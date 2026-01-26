import { useReducer, useState, useCallback, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';

import { Screen, HeaderBackButton, HeaderShareButton, ThemedActivityIndicator, ThemedRefreshControl } from '@/app/components/ui';
import { ComicSeriesDetails } from '@/app/components/comics/ComicSeriesDetails';
import { ComicIssuesList, ComicIssuesListProps } from '@/app/components/comics/ComicIssuesList';
import { ComicSeriesInfo } from '@/app/components/comics/ComicSeriesInfo';
import { AddToProfileButton, NotificationButton } from '@/app/components/comics/ComicActionButtons';

import { getPublicApolloClient, getUserApolloClient } from '@/lib/apollo';
import { getUserDetails } from '@/lib/auth/user';
import { ComicIssue, ComicSeries } from '@inkverse/shared-client/graphql/operations';
import { loadComicSeries, loadUserComicData, subscribeToSeries, unsubscribeFromSeries, enableNotificationsForSeries, disableNotificationsForSeries, comicSeriesReducer, comicSeriesInitialState, likeComicIssueInSeries, unlikeComicIssueInSeries } from '@inkverse/shared-client/dispatch/comicseries';
import { RootStackParamList, COMICSERIES_SCREEN, COMICISSUE_SCREEN, SIGNUP_SCREEN } from '@/constants/Navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ReadNextEpisode } from '../components/comics/ReadNextEpisode';
import { useAnalytics } from '@/lib/analytics';

export interface ComicSeriesScreenParams {
  uuid: string;
};

type ListItem = 
  | { type: 'header'; data: ComicSeries }
  | { type: 'action-buttons'; data: ComicSeries }
  | { type: 'info'; data: ComicSeries }
  | { type: 'issues'; data: ComicIssuesListProps }
  | { type: 'next-episode'; data: ComicIssue | null };

export function ComicSeriesScreen() {
  const route = useRoute<NativeStackScreenProps<RootStackParamList, typeof COMICSERIES_SCREEN>['route']>();
  const { uuid } = route.params;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const analytics = useAnalytics();
  
  // Authentication and clients
  const currentUser = getUserDetails();
  const isLoggedIn = !!currentUser;
  const publicClient = getPublicApolloClient();
  const userClient = isLoggedIn ? getUserApolloClient() : undefined;
  
  const [comicSeriesState, dispatch] = useReducer(comicSeriesReducer, comicSeriesInitialState);
  const [refreshing, setRefreshing] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  const { isComicSeriesLoading, comicseries, issues, userComicData, isUserDataLoading, isSubscriptionLoading, isNotificationLoading, comicIssueStats, issueLikeLoadingMap } = comicSeriesState;

  // Load public comic series data once on mount
  useEffect(() => {
    analytics.screen('Comic Series', { uuid });
  }, [uuid]);

  // Refetch user data and stats when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadComicSeries({ publicClient, uuid }, dispatch);
      if (isLoggedIn && userClient) {
        loadUserComicData({ userClient, seriesUuid: uuid }, dispatch);
      }
    }, [uuid, isLoggedIn, userClient, publicClient])
  )

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    
    // Refresh public data
    await loadComicSeries({ publicClient, uuid, forceRefresh: true }, dispatch);
    
    // Refresh user data if authenticated
    if (isLoggedIn && userClient) {
      await loadUserComicData({ userClient, seriesUuid: uuid, forceRefresh: true }, dispatch);
    }
    
    setRefreshing(false);
  }, [uuid, isLoggedIn]);

  const handleNavigateToIssue = useCallback((issueUuid: string, seriesUuid: string) => {
    navigation.navigate(COMICISSUE_SCREEN, { issueUuid, seriesUuid });
  }, [navigation]);

  const handleAddToProfile = useCallback(async () => {
    if (!isLoggedIn || !userClient || !currentUser?.id) {
      navigation.navigate(SIGNUP_SCREEN);
      return;
    }

    try {
      const isCurrentlySubscribed = userComicData?.isSubscribed || false;
      
      if (isCurrentlySubscribed) {
        await unsubscribeFromSeries({ userClient, seriesUuid: uuid, userId: currentUser?.id }, dispatch);
      } else {
        await subscribeToSeries({ userClient, seriesUuid: uuid, userId: currentUser?.id }, dispatch);
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
    }
  }, [isLoggedIn, userClient, userComicData?.isSubscribed, uuid]);

  const handleGetNotifications = useCallback(async () => {
    if (!isLoggedIn || !userClient || !currentUser?.id) {
      navigation.navigate(SIGNUP_SCREEN);
      return;
    }

    try {
      const hasNotifications = userComicData?.hasNotificationEnabled || false;
      
      if (hasNotifications) {
        await disableNotificationsForSeries({ userClient, seriesUuid: uuid, userId: currentUser?.id }, dispatch);
      } else {
        await enableNotificationsForSeries({ userClient, seriesUuid: uuid, userId: currentUser?.id }, dispatch);
      }
    } catch (error) {
      console.error('Error updating notifications:', error);
    }
  }, [isLoggedIn, userClient, userComicData?.hasNotificationEnabled, uuid]);

  const handleLikeIssue = useCallback(async (issueUuid: string) => {
    if (!isLoggedIn || !userClient || !currentUser?.id) {
      navigation.navigate(SIGNUP_SCREEN);
      return;
    }
    if (!comicseries) return;

    const isCurrentlyLiked = userComicData?.likedComicIssueUuids?.includes(issueUuid) || false;

    if (isCurrentlyLiked) {
      await unlikeComicIssueInSeries({ userClient, issueUuid, seriesUuid: comicseries.uuid }, dispatch);
    } else {
      await likeComicIssueInSeries({ userClient, issueUuid, seriesUuid: comicseries.uuid }, dispatch);
    }
  }, [isLoggedIn, userClient, currentUser?.id, comicseries?.uuid, userComicData?.likedComicIssueUuids, navigation]);

  const renderItem = useCallback(({ item }: { item: ListItem }) => {
    switch (item.type) {
      case 'header':
        return (
          <ComicSeriesDetails
            comicseries={item.data}
            pageType='comicseries-screen'
            isHeaderVisible={isHeaderVisible}
            onHeaderVisibilityChange={setIsHeaderVisible}
          />
        );
      case 'action-buttons':
        return (
          <View style={styles.actionButtonsContainer}>
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
          </View>
        );
      case 'info':
        return <ComicSeriesInfo comicseries={item.data} />;
      case 'issues':
        return (
          <ComicIssuesList
            comicissues={item.data.comicissues}
            comicseries={item.data.comicseries}
            currentIssueUuid={item.data.currentIssueUuid}
            comicIssueStats={comicIssueStats}
            likedIssueUuids={userComicData?.likedComicIssueUuids}
            issueLikeLoadingMap={issueLikeLoadingMap}
            onLikeIssue={handleLikeIssue}
          />
        );
      case 'next-episode':
        if (!item.data) { return null; }
        return (
          <ReadNextEpisode
            comicissue={item.data}
            showEmptyState={false}
            firstTextCTA='READ THE FIRST'
            secondTextCTA='EPISODE'
            handleNavigateToIssue={handleNavigateToIssue}
          />
        );
      default:
        return null;
    }
  }, [comicseries, issues, userComicData, isUserDataLoading, isSubscriptionLoading, isNotificationLoading, isHeaderVisible, setIsHeaderVisible, handleAddToProfile, handleGetNotifications, handleNavigateToIssue, comicIssueStats, issueLikeLoadingMap, handleLikeIssue]);

  const keyExtractor = useCallback((item: ListItem) => {
    switch (item.type) {
      case 'header':
      case 'action-buttons':
      case 'info':
      case 'issues':
      case 'next-episode':
        return item.type;
    }
  }, [comicseries, issues, userComicData, isSubscriptionLoading, isNotificationLoading]);

  const getListData = useCallback((): ListItem[] => {
    if (!comicseries) return [];
    return [
      { type: 'header', data: comicseries },
      { type: 'action-buttons', data: comicseries },
      { type: 'issues', data: { comicissues: issues || [], comicseries, currentIssueUuid: issues?.[0]?.uuid } },
      { type: 'info', data: comicseries },
      ...(issues?.length && issues.length > 3 ? [{ type: 'next-episode' as const, data: issues[0] }] : []),
    ];
  }, [comicseries, issues, userComicData, isSubscriptionLoading, isNotificationLoading]);

  if (isComicSeriesLoading) {
    return (
      <ComicSeriesScreenWrapper isHeaderVisible={isHeaderVisible} comicseries={comicseries || null}>
        <View style={styles.loadingContainer}>
          <ThemedActivityIndicator />
        </View>
      </ComicSeriesScreenWrapper>
    );
  }

  return (
    <ComicSeriesScreenWrapper isHeaderVisible={isHeaderVisible} comicseries={comicseries || null}>
      <FlashList
        data={getListData()}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        onScroll={(event) => {
          const yOffset = event.nativeEvent.contentOffset.y;
          if (yOffset <= 0) {
            setIsHeaderVisible(true);
          }
        }}
        refreshControl={
          <ThemedRefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
          />
        }
      />
    </ComicSeriesScreenWrapper>
  );
}

interface ComicSeriesScreenWrapperProps {
  children: React.ReactNode;
  isHeaderVisible: boolean;
  comicseries: ComicSeries | null;
}

const ComicSeriesScreenWrapper = ({ children, isHeaderVisible, comicseries }: ComicSeriesScreenWrapperProps) => {
  return (
    <Screen style={styles.container}>
      {isHeaderVisible && (
        <View>
          <HeaderBackButton />
          <HeaderShareButton type="comicseries" item={comicseries} />
        </View>
      )}
      {children}
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignSelf: 'flex-start',
  },
}); 