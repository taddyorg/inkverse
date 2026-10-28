import { useReducer, useState, useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlashList, FlashListRef } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

import { Screen, HeaderBackButton, HeaderShareButton, ThemedActivityIndicator, ThemedButton, ThemedRefreshControl, FadeInView, useLayout } from '@/app/components/ui';
import { ComicSeriesDetails } from '@/app/components/comics/ComicSeriesDetails';
import { ComicIssuesList, ComicIssuesListProps } from '@/app/components/comics/ComicIssuesList';
import { ComicSeriesInfo } from '@/app/components/comics/ComicSeriesInfo';
import { AddToProfileButton, NotificationButton } from '@/app/components/comics/ComicActionButtons';

import { getPublicApolloClient, getUserApolloClient } from '@/lib/apollo';
import { getUserDetails } from '@/lib/auth/user';
import { on, off, EventNames } from '@inkverse/shared-client/pubsub';
import { ComicIssue, ComicSeries } from '@inkverse/shared-client/graphql/operations';
import { loadComicSeries, loadComicSeriesDynamic, loadUserComicData, subscribeToSeries, unsubscribeFromSeries, enableNotificationsForSeries, disableNotificationsForSeries, comicSeriesReducer, comicSeriesInitialState, likeComicIssueInSeries, unlikeComicIssueInSeries } from '@inkverse/shared-client/dispatch/comicseries';
import { RootStackParamList, COMICSERIES_SCREEN, COMICISSUE_SCREEN, SIGNUP_SCREEN } from '@/constants/Navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ReadNextEpisode, useReadNextEpisodePull, type SheetContent } from '../components/comics/ReadNextEpisode';
import { ReadNextEpisodeSheet } from '../components/comics/ReadNextEpisodeSheet';
import { useAnalytics } from '@/lib/analytics';
import { SPACING } from '@/constants/Spacing';
import { useThemeColor } from '@/constants/Colors';

export interface ComicSeriesScreenParams {
  uuid: string;
};

type ListItem = 
  | { type: 'header'; data: ComicSeries }
  | { type: 'info'; data: ComicSeries }
  | { type: 'issues'; data: ComicIssuesListProps }
  | { type: 'next-episode'; data: ComicIssue | null };

// Floating back / share buttons
const HEADER_BUTTON_SIZE = 40;
const INITIAL_VISIBLE_ISSUES = 5;
const getHeaderButtonsTop = (isWide: boolean) => isWide ? 16 : 40;
// On wider layouts (landscape, iPad), hug the screen edges rather than the content column.
// The side safe-area inset is for the Dynamic Island, which sits mid-height, so a button
// this close to the top only needs to clear the rounded display corner.
const getHeaderButtonsSideOffset = (isWide: boolean, contentInsetX: number) =>
  isWide ? SPACING.xl : contentInsetX + 16;
// On wider layouts the centered cover sits between the buttons, so it starts just below their top edge
const getHeaderPaddingTop = (isWide: boolean) => isWide
  ? getHeaderButtonsTop(isWide) + SPACING.md
  : getHeaderButtonsTop(isWide) + HEADER_BUTTON_SIZE + 16;

export function ComicSeriesScreen() {
  const route = useRoute<NativeStackScreenProps<RootStackParamList, typeof COMICSERIES_SCREEN>['route']>();
  const { uuid } = route.params;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const analytics = useAnalytics();
  
  // Authentication and clients
  const [currentUser, setCurrentUser] = useState(getUserDetails());
  const isLoggedIn = !!currentUser;

  useEffect(() => {
    const handleUserAuthenticated = () => {
      setCurrentUser(getUserDetails());
    };
    const handleUserLoggedOut = () => {
      setCurrentUser(null);
    };

    on(EventNames.USER_AUTHENTICATED, handleUserAuthenticated);
    on(EventNames.USER_LOGGED_OUT, handleUserLoggedOut);

    return () => {
      off(EventNames.USER_AUTHENTICATED, handleUserAuthenticated);
      off(EventNames.USER_LOGGED_OUT, handleUserLoggedOut);
    };
  }, []);
  const publicClient = getPublicApolloClient();
  const userClient = isLoggedIn ? getUserApolloClient() : undefined;
  
  const [comicSeriesState, dispatch] = useReducer(comicSeriesReducer, comicSeriesInitialState);
  const [refreshing, setRefreshing] = useState(false);
  const { contentInsetX, isSm } = useLayout();
  const insets = useSafeAreaInsets();
  // On wider layouts the buttons hug the screen edges, so pull the content in past them
  const listInsetX = isSm
    ? Math.max(contentInsetX, getHeaderButtonsSideOffset(true, contentInsetX) + HEADER_BUTTON_SIZE + SPACING.md)
    : contentInsetX;
  const actionColor = useThemeColor({}, 'action');
  const actionTextColor = useThemeColor({}, 'actionText');

  const { isComicSeriesLoading, comicseries, issues, userComicData, isUserDataLoading, isSubscriptionLoading, isNotificationLoading, issueLikeLoadingMap, likeCount, commentCount } = comicSeriesState;

  // Track screen view
  useEffect(() => {
    analytics.screen('Comic Series', { uuid });
  }, [uuid]);

  // Load static series data once on mount/uuid change
  useEffect(() => {
    loadComicSeries({ publicClient, uuid }, dispatch);
  }, [uuid]);

  // Refresh dynamic data and user data on focus
  useFocusEffect(
    useCallback(() => {
      loadComicSeriesDynamic({ publicClient, seriesUuid: uuid }, dispatch);
      if (isLoggedIn && userClient) {
        loadUserComicData({ userClient, seriesUuid: uuid }, dispatch);
      }
    }, [uuid, isLoggedIn, userClient, publicClient])
  )

  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    // Refresh public data
    await loadComicSeries({ publicClient, uuid, forceRefresh: true }, dispatch);
    loadComicSeriesDynamic({ publicClient, seriesUuid: uuid, forceRefresh: true }, dispatch);

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

  const firstIssue = issues?.[0];
  // The read-the-first-episode card only appears on longer series
  const showsReadFirstEpisode = !!firstIssue && !!issues && issues.length > 3;

  // Pulling past the card at the end of the list opens the first episode through the peek sheet, which
  // expands into the episode screen; the screen is then pushed without its own transition and keeps
  // covering itself with the same sheet content until its first page is on screen
  const listRef = useRef<FlashListRef<ListItem>>(null);
  const handleOpenFirstEpisode = useCallback((issueUuid: string, seriesUuid: string, cover: SheetContent) => {
    navigation.navigate(COMICISSUE_SCREEN, { issueUuid, seriesUuid, transition: 'none', cover });
  }, [navigation]);
  const readFirstEpisodePull = useReadNextEpisodePull({
    enabled: showsReadFirstEpisode,
    listRef,
    target: firstIssue,
    seriesName: comicseries?.name,
    onNavigate: handleOpenFirstEpisode,
  });

  const renderItem = useCallback(({ item }: { item: ListItem }) => {
    switch (item.type) {
      case 'header':
        // On wider layouts, leave room above the header for the floating buttons
        return (
          <View style={isSm && { paddingTop: getHeaderPaddingTop(isSm) }}>
            <ComicSeriesDetails
              comicseries={item.data}
              pageType='comicseries-screen'
              likeCount={likeCount}
              commentCount={commentCount}
              actions={
                <View style={[styles.actionButtonsContainer, isSm && styles.actionButtonsContainerSm]}>
                  {!!firstIssue && (
                    <ThemedButton
                      buttonText='Start Reading'
                      style={[styles.startReadingButton, { backgroundColor: actionColor }]}
                      buttonTextProps={{ color: actionTextColor }}
                      icon={<MaterialIcons name="play-arrow" size={22} color={actionTextColor} />}
                      onPress={() => handleNavigateToIssue(firstIssue.uuid, item.data.uuid)}
                    />
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
                </View>
              }
            />
          </View>
        );
      case 'info':
        return <ComicSeriesInfo comicseries={item.data} />;
      case 'issues':
        return (
          <View style={styles.section}>
            <ComicIssuesList
              comicissues={item.data.comicissues}
              comicseries={item.data.comicseries}
              currentIssueUuid={item.data.currentIssueUuid}
              likedIssueUuids={userComicData?.likedComicIssueUuids}
              issueLikeLoadingMap={issueLikeLoadingMap}
              onLikeIssue={handleLikeIssue}
              initialVisibleCount={INITIAL_VISIBLE_ISSUES}
            />
          </View>
        );
      case 'next-episode':
        if (!item.data) { return null; }
        return (
          <ReadNextEpisode
            comicissue={item.data}
            showEmptyState={false}
            firstTextCTA='READ THE FIRST'
            secondTextCTA='EPISODE'
            // A tap is a regular push (like tapping an episode in the list); only the pull goes through the peek sheet
            handleNavigateToIssue={handleNavigateToIssue}
            pullProgress={readFirstEpisodePull.progress}
            onVisible={readFirstEpisodePull.onCardVisible}
            accessibilityLabel="Read the first episode"
          />
        );
      default:
        return null;
    }
  }, [comicseries, issues, userComicData, isUserDataLoading, isSubscriptionLoading, isNotificationLoading, handleAddToProfile, handleGetNotifications, handleNavigateToIssue, issueLikeLoadingMap, handleLikeIssue, isSm, likeCount, commentCount, firstIssue, actionColor, actionTextColor, readFirstEpisodePull.progress, readFirstEpisodePull.onCardVisible]);

  const keyExtractor = useCallback((item: ListItem) => {
    switch (item.type) {
      case 'header':
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
      { type: 'issues', data: { comicissues: issues || [], comicseries, currentIssueUuid: issues?.[0]?.uuid } },
      { type: 'info', data: comicseries },
      ...(showsReadFirstEpisode ? [{ type: 'next-episode' as const, data: issues[0] }] : []),
    ];
  }, [comicseries, issues, userComicData, isSubscriptionLoading, isNotificationLoading, showsReadFirstEpisode]);

  if (isComicSeriesLoading || !comicseries) {
    return (
      <ComicSeriesScreenWrapper comicseries={comicseries || null}>
        <View style={styles.loadingContainer}>
          <ThemedActivityIndicator />
        </View>
      </ComicSeriesScreenWrapper>
    );
  }

  return (
    <ComicSeriesScreenWrapper comicseries={comicseries || null}>
      <FadeInView>
        <FlashList
          ref={listRef}
          data={getListData()}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          showsVerticalScrollIndicator={false}
          onScroll={readFirstEpisodePull.onScroll}
          onScrollBeginDrag={readFirstEpisodePull.onScrollBeginDrag}
          onScrollEndDrag={readFirstEpisodePull.onScrollEndDrag}
          onMomentumScrollEnd={readFirstEpisodePull.onMomentumScrollEnd}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingHorizontal: listInsetX, paddingBottom: insets.bottom }}
          refreshControl={
            <ThemedRefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
        />
      </FadeInView>
      <ReadNextEpisodeSheet {...readFirstEpisodePull.sheetProps} />
    </ComicSeriesScreenWrapper>
  );
}

interface ComicSeriesScreenWrapperProps {
  children: React.ReactNode;
  comicseries: ComicSeries | null;
}

const ComicSeriesScreenWrapper = ({ children, comicseries }: ComicSeriesScreenWrapperProps) => {
  const { contentInsetX, isSm } = useLayout();
  const top = getHeaderButtonsTop(isSm);
  const sideOffset = getHeaderButtonsSideOffset(isSm, contentInsetX);

  return (
    <Screen style={styles.container}>
      <View>
        <HeaderBackButton style={{ top, left: sideOffset }} />
        <HeaderShareButton type="comicseries" item={comicseries} style={{ top, right: sideOffset }} />
      </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  actionButtonsContainerSm: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  // Section break before Episodes, larger than the gaps inside a section
  section: {
    marginTop: SPACING.lg,
  },
  startReadingButton: {
    flex: 1,
    height: 40,
    paddingVertical: 0,
  },
}); 