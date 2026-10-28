import React, { useCallback, useReducer, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions, Animated, View, NativeSyntheticEvent, NativeScrollEvent, TouchableWithoutFeedback, Pressable, Text } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, COMICISSUE_SCREEN, COMICSERIES_SCREEN, COMMENTS_SCREEN, EDIT_PATREON_SCREEN, SIGNUP_SCREEN } from '@/constants/Navigation';
import { FlashList, FlashListRef } from '@shopify/flash-list';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Image } from 'expo-image';
import { jwtDecode } from 'jwt-decode';
import * as Linking from 'expo-linking';

import { StoryImage } from '../components/comics/StoryImage';
import { GridOfComicIssues } from '../components/comics/GridOfComicIssues';
import { ComicHeader, HEADER_HEIGHT } from '../components/comics/ComicHeader';
import { ComicFooter, FOOTER_HEIGHT } from '../components/comics/ComicFooter';
import { CreatorForIssue } from '../components/creator/CreatorForIssue';
import { ReadNextEpisode, useReadNextEpisodePull, READ_NEXT_PULL_SPACER_HEIGHT, type SheetContent } from '../components/comics/ReadNextEpisode';
import { ReadNextEpisodeSheet } from '../components/comics/ReadNextEpisodeSheet';
import { LikeButton } from '../components/comics/LikeButton';
import { CommentsSection } from '../components/comics/CommentsSection';
import { Screen, ScrollIndicator, ThemedActivityIndicator, ThemedRefreshControl, ThemedText, ThemedButton, PressableOpacity, ThemedTextFontFamilyMap, FadeInView } from '@/app/components/ui';

import { getPublicApolloClient, getUserApolloClient } from '@/lib/apollo';
import {
  comicIssueReducer,
  comicIssueInitialState,
  loadComicIssue,
  loadComicIssueDynamic,
  checkPatreonAccess,
  likeComicIssue,
  unlikeComicIssue,
  superLikeAllEpisodes,
  readCachedComicIssue,
  ComicIssueActionType,
} from '@inkverse/shared-client/dispatch/comicissue';
import type { Comment } from '@inkverse/shared-client/dispatch/comments';
import { ComicIssue, Creator, GetUserComicSeries, type GetUserComicSeriesQuery, type GetUserComicSeriesQueryVariables } from '@inkverse/shared-client/graphql/operations';
import { getStoryImageUrl } from '@inkverse/public/comicstory';
import { getAvatarImageUrl } from '@inkverse/public/creator';
import { LinkType } from '@inkverse/public/graphql/types';
import { getUserDetails } from '@/lib/auth/user';
import { getConnectedHostingProviderUuids, getContentTokenForProviderAndSeries } from '@/lib/auth/hosting-provider';
import { useThemeColor } from '@/constants/Colors';
import { useAnalytics } from '@/lib/analytics';
import { useComments } from '@/app/components/providers/CommentsProvider';
import { on, off, EventNames } from '@inkverse/shared-client/pubsub';

type ListItemType = 'story' | 'like' | 'grid' | 'creator' | 'comments' | 'next-episode' | 'exclusive-signup' | 'exclusive-connect-patreon' | 'exclusive-checking-access' | 'exclusive-no-access' | 'patreon-exclusive';

interface ListItem {
  type: ListItemType;
  key: string;
  data: any;
}

export type ComicIssueScreenParams = {
  issueUuid: string;
  seriesUuid: string;
  // 'none' when opened through the ReadNextEpisode peek sheet, which has already covered the screen
  transition?: 'none';
  // What that sheet was showing, so this screen can keep covering itself with the same titles and page
  // until its own first page is on screen
  cover?: SheetContent;
};

const PRELOAD_BATCH_SIZE = 5;
const ESTIMATED_ITEM_SIZE = 300;

// Define header and footer position constants
const HEADER_OPEN_POSITION = 0;
const HEADER_CLOSED_POSITION = -HEADER_HEIGHT;
const FOOTER_OPEN_POSITION = 0;
const FOOTER_CLOSED_POSITION = FOOTER_HEIGHT;

// Starts from the cached issue when there is one (the ReadNextEpisode card prefetches its target), so a
// screen pushed without a transition has content on its first frame instead of a spinner
const seedComicIssueState = ({ issueUuid, seriesUuid }: { issueUuid: string; seriesUuid: string }) => ({
  ...comicIssueInitialState,
  ...readCachedComicIssue({ publicClient: getPublicApolloClient(), issueUuid, seriesUuid }),
});

const preloadImagesInBatch = async (imageUrls: string[]) => {
  if (imageUrls.length === 0) return;

  try {
    // Load first batch (first 5 images) - critical for immediate viewing
    const firstBatch = imageUrls.slice(0, PRELOAD_BATCH_SIZE);
    await Promise.allSettled(firstBatch.map(url => Image.prefetch(url)));
    
    // Load remaining images in background if any exist
    if (imageUrls.length > PRELOAD_BATCH_SIZE) {
      const remainingImages = imageUrls.slice(PRELOAD_BATCH_SIZE);
      await Promise.allSettled(remainingImages.map(url => Image.prefetch(url)));
    }
  } catch (error) {
    console.warn('Error in image preloading:', error);
  }
};

export function ComicIssueScreen() {
  const route = useRoute<NativeStackScreenProps<RootStackParamList, typeof COMICISSUE_SCREEN>['route']>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { issueUuid, seriesUuid } = route.params;
  const screenDetails = useWindowDimensions();
  const flatListRef = useRef<FlashListRef<ListItem>>(null);
  const publicClient = getPublicApolloClient();
  const analytics = useAnalytics();
  // Header and footer animation state
  const headerTranslateY = useRef(new Animated.Value(HEADER_OPEN_POSITION)).current;
  const footerTranslateY = useRef(new Animated.Value(FOOTER_OPEN_POSITION)).current;
  const isHeaderOpen = useRef(true);
  const isFooterOpen = useRef(true);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [initialComments, setInitialComments] = useState<Comment[] | null>(null);

  // Scroll indicator state
  const [scrollPosition, setScrollPosition] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  
  // Animate header and footer with spring animation
  const animateHeaderPosition = useCallback((toValue: number) => {
    if (toValue === HEADER_OPEN_POSITION) {
      isHeaderOpen.current = true;
      setIsHeaderVisible(true);
    } else {
      isHeaderOpen.current = false;
      setIsHeaderVisible(false);
    }
    
    Animated.spring(headerTranslateY, {
      toValue,
      useNativeDriver: true,
    }).start();
  }, []);

  const animateFooterPosition = useCallback((toValue: number) => {
    if (toValue === FOOTER_OPEN_POSITION) {
      isFooterOpen.current = true;
    } else {
      isFooterOpen.current = false;
    }
    
    Animated.spring(footerTranslateY, {
      toValue,
      useNativeDriver: true,
    }).start();
  }, []);
  
  const [state, dispatch] = useReducer(comicIssueReducer, { issueUuid, seriesUuid }, seedComicIssueState);
  // Opened through the peek sheet: the sheet already shows this screen's header and first page, so the
  // content must not fade in underneath it
  const [skipFadeIn, setSkipFadeIn] = useState(route.params.transition === 'none');
  // Pushed from under another screen's sheet: start with our own sheet expanded over the same content, so
  // the empty first frames (FlashList lays out before it renders, images decode asynchronously) stay
  // covered. Falls back to the seeded issue when the pushing screen sent no cover. Patreon-exclusive pages
  // need a content token, so like the peek sheet they get no page image.
  const [initialCover] = useState<SheetContent | null>(() => {
    if (route.params.transition !== 'none') { return null; }
    if (route.params.cover) { return route.params.cover; }
    const isExclusive = !!state.comicissue?.scopesForExclusiveContent?.includes('patreon');
    const story = isExclusive ? undefined : state.comicissue?.stories?.[0];
    const pageImageUrl = story?.storyImageAsString ? getStoryImageUrl({ storyImageAsString: story.storyImageAsString }) : null;
    return {
      seriesName: state.comicseries?.name,
      episodeName: state.comicissue?.name,
      pageImageUrl: pageImageUrl ?? undefined,
      pageAspectRatio: story?.width && story?.height ? story.width / story.height : undefined,
    };
  });
  const {
    isComicIssueLoading,
    comicissue,
    comicseries,
    isCheckingAccess,
    contentToken,
    creatorLinks,
    likeCount,
    commentCount,
    userComicData,
    isLikeLoading,
    isSuperLikeLoading,
  } = state;
  
  const isPatreonExclusive = comicissue?.scopesForExclusiveContent?.includes('patreon');
  const decodedToken = contentToken && jwtDecode(contentToken) as any;
  const hasAccessToIssue = decodedToken?.scopes_for_exclusive_content?.includes('patreon');
  const connectedProviders = getConnectedHostingProviderUuids();
  const isConnectedToHostingProvider = comicseries?.hostingProviderUuid && connectedProviders.includes(comicseries.hostingProviderUuid);
  const [isAuthenticated, setIsAuthenticated] = useState(!!getUserDetails());

  useEffect(() => {
    const handleUserAuthenticated = () => {
      setIsAuthenticated(true);
    };
    const handleUserLoggedOut = () => {
      setIsAuthenticated(false);
    };

    on(EventNames.USER_AUTHENTICATED, handleUserAuthenticated);
    on(EventNames.USER_LOGGED_OUT, handleUserLoggedOut);

    return () => {
      off(EventNames.USER_AUTHENTICATED, handleUserAuthenticated);
      off(EventNames.USER_LOGGED_OUT, handleUserLoggedOut);
    };
  }, []);

  // Like state
  const isLiked = userComicData?.likedComicIssueUuids?.includes(comicissue?.uuid || '') ?? false;
  const displayLikeCount = likeCount ?? 0;
  const totalEpisodes = comicseries?.issueCount ?? 0;
  const likedEpisodesCount = userComicData?.likedComicIssueUuids?.length ?? 0;
  const hasLikedAllEpisodes = isAuthenticated && totalEpisodes > 0 && likedEpisodesCount >= totalEpisodes;

  const loadData = useCallback(async (forceRefresh = false) => {
    setInitialComments(null);
    await loadComicIssue({
      publicClient,
      issueUuid,
      seriesUuid,
      forceRefresh
    }, dispatch);
    const dynamicResult = await loadComicIssueDynamic({ publicClient, issueUuid, forceRefresh }, dispatch);
    if (dynamicResult) {
      setInitialComments(dynamicResult.comments as Comment[]);
    }
  }, [issueUuid]);

  useEffect(() => {
    // Track screen view
    analytics.screen('Comic Issue', { issueUuid, seriesUuid });

    loadData();
  }, [issueUuid, seriesUuid]);

  useEffect(() => {
    if (isPatreonExclusive && comicseries?.hostingProviderUuid && comicseries?.uuid && isConnectedToHostingProvider) {
      checkPatreonAccess({
        isPatreonExclusive,
        hostingProviderUuid: comicseries?.hostingProviderUuid,
        seriesUuid: comicseries?.uuid,
        getContentTokenForProviderAndSeries
      }, dispatch);
    }
  }, [isPatreonExclusive, comicseries?.hostingProviderUuid, comicseries?.uuid, comicissue?.uuid]);

  // Load user's like status when authenticated
  useEffect(() => {
    if (!isAuthenticated || !comicseries?.uuid) return;

    const loadUserData = async () => {
      const userClient = getUserApolloClient();
      if (!userClient) return;

      try {
        const result = await userClient.query<GetUserComicSeriesQuery, GetUserComicSeriesQueryVariables>({
          query: GetUserComicSeries,
          variables: { seriesUuid: comicseries.uuid },
        });

        if (result.data?.getUserComicSeries) {
          dispatch({
            type: ComicIssueActionType.GET_COMICISSUE_SUCCESS,
            payload: {
              userComicData: {
                isSubscribed: result.data.getUserComicSeries.isSubscribed,
                isRecommended: result.data.getUserComicSeries.isRecommended,
                hasNotificationEnabled: result.data.getUserComicSeries.hasNotificationEnabled,
                likedComicIssueUuids: result.data.getUserComicSeries.likedComicIssueUuids?.filter((uuid: string | null): uuid is string => uuid !== null) || [],
              }
            }
          });
        }
      } catch (error) {
        console.error('Failed to load user comic data:', error);
      }
    };

    loadUserData();
  }, [isAuthenticated, comicseries?.uuid]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadData(true);
    setRefreshing(false);
  }, [loadData]);

  const preloadImages = useCallback(async (stories: NonNullable<ComicIssue['stories']>) => {
    const imageUrls = stories
      .map(story => getStoryImageUrl({ storyImageAsString: story?.storyImageAsString, token: contentToken || undefined }))
      .filter((url): url is string => url !== null);

    try {
      if (isPatreonExclusive && !contentToken) return; // If the issue is patreon exclusive, and the user doesn't have a content token, don't preload images
      await preloadImagesInBatch(imageUrls);
    } catch (error) {
      console.warn('Error preloading images:', error);
    }
  }, [issueUuid, comicissue?.uuid, contentToken]);

  // Preload images when stories data is available
  useEffect(() => {
    const stories = comicissue?.stories;
    if (stories && stories.length > 0) {
      setContentHeight(stories.length * ESTIMATED_ITEM_SIZE);
      preloadImages(stories)
    }
  }, [issueUuid, comicissue?.uuid]);

  // Handle navigation to a different issue. Navigating to this same screen updates its params in place,
  // so the UI state is reset here. `keepChrome` leaves the header and footer open (the peek sheet's
  // mirrored header hands off to the real one).
  const handleNavigateToIssue = useCallback((newIssueUuid: string, newSeriesUuid: string, options?: { keepChrome?: boolean }) => {
    navigation.navigate(COMICISSUE_SCREEN, {
      issueUuid: newIssueUuid,
      seriesUuid: newSeriesUuid,
    });

    // Reset all UI state properly
    setScrollPosition(0);
    setContentHeight(0); // Reset content height to prevent incorrect scroll indicator
    const keepChrome = !!options?.keepChrome;
    isHeaderOpen.current = keepChrome;
    isFooterOpen.current = keepChrome;
    setIsHeaderVisible(keepChrome);
    setSkipFadeIn(keepChrome);
    headerTranslateY.setValue(keepChrome ? HEADER_OPEN_POSITION : HEADER_CLOSED_POSITION);
    footerTranslateY.setValue(keepChrome ? FOOTER_OPEN_POSITION : FOOTER_CLOSED_POSITION);
  }, [navigation]);

  // A transition-less open applies to this push only; restore the normal animation for going back. Not in
  // a plain mount effect: react-native-screens reads the screen's animation when the push transition
  // actually runs, so clearing it that early can turn the instant push into the default slide of a screen
  // that already looks like the sheet. Wait for the push to finish (transitionEnd), with a timer as backup.
  useEffect(() => {
    if (route.params.transition !== 'none') { return; }
    let cleared = false;
    const clear = () => {
      if (cleared) { return; }
      cleared = true;
      navigation.setParams({ transition: undefined, cover: undefined });
    };
    const unsubscribe = navigation.addListener('transitionEnd', (event) => {
      if (!event.data.closing) { clear(); }
    });
    const timer = setTimeout(clear, 1000);
    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  // Once the issue has rendered, later remounts of the content fade in as usual
  useEffect(() => {
    if (!comicissue?.uuid) { return; }
    const frame = requestAnimationFrame(() => setSkipFadeIn(false));
    return () => cancelAnimationFrame(frame);
  }, [comicissue?.uuid]);

  // Pulling past the next-episode card at the end of the list opens the next episode through the peek
  // sheet, which expands into this screen before the issue is swapped underneath it
  const nextIssue = comicissue?.nextIssue;
  const hasNextIssue = !!(nextIssue?.uuid && nextIssue?.seriesUuid);
  const bottomSpacerHeight = hasNextIssue ? READ_NEXT_PULL_SPACER_HEIGHT : 0;
  const handleOpenNextEpisode = useCallback((newIssueUuid: string, newSeriesUuid: string) => {
    handleNavigateToIssue(newIssueUuid, newSeriesUuid, { keepChrome: true });
  }, [handleNavigateToIssue]);
  const nextEpisodePull = useReadNextEpisodePull({
    enabled: hasNextIssue,
    listRef: flatListRef,
    target: nextIssue,
    seriesName: comicseries?.name,
    onNavigate: handleOpenNextEpisode,
    initialCover,
  });
  // The sheet covering this screen drops once the first page is on screen (see renderItem), or straight
  // away when the issue renders without pages (Patreon gates, sign-up, access check)
  const firstStoryUuid = comicissue?.stories?.[0]?.uuid;

  // Handle like/unlike
  const handleLikePress = useCallback(async () => {
    if (!isAuthenticated) {
      navigation.navigate(SIGNUP_SCREEN);
      return;
    }

    const userClient = getUserApolloClient();
    if (!userClient || !comicissue?.uuid || !comicseries?.uuid) return;

    if (isLiked) {
      await unlikeComicIssue({
        userClient,
        issueUuid: comicissue.uuid,
        seriesUuid: comicseries.uuid,
      }, dispatch);
    } else {
      await likeComicIssue({
        userClient,
        issueUuid: comicissue.uuid,
        seriesUuid: comicseries.uuid,
      }, dispatch);
    }
  }, [isAuthenticated, isLiked, comicissue?.uuid, comicseries?.uuid, navigation]);

  // Handle comment count change from add/delete
  const handleCommentCountChange = useCallback((count: number) => {
    dispatch({ type: ComicIssueActionType.GET_COMICISSUE_SUCCESS, payload: { commentCount: count } });
  }, []);

  // Share the callback with CommentsScreen via CommentsProvider context
  const { commentCountCallbackRef } = useComments();
  useEffect(() => {
    commentCountCallbackRef.current = handleCommentCountChange;
    return () => { commentCountCallbackRef.current = undefined; };
  }, [handleCommentCountChange]);

  // Handle comment press - navigate to CommentsScreen
  const handleCommentPress = useCallback(() => {
    navigation.navigate(COMMENTS_SCREEN, {
      issueUuid,
      seriesUuid,
      commentCount: commentCount ?? undefined,
      creators: comicseries?.creators ?? [],
    });
  }, [issueUuid, seriesUuid, commentCount, comicseries?.creators, navigation]);

  // Handle super-like all episodes
  const handleSuperLikePress = useCallback(async () => {
    if (!isAuthenticated) {
      navigation.navigate(SIGNUP_SCREEN);
      return;
    }

    const userClient = getUserApolloClient();
    if (!userClient || !comicseries?.uuid || !comicissue?.uuid) return;

    await superLikeAllEpisodes({
      userClient, 
      seriesUuid: comicseries.uuid,
      issueUuid: comicissue.uuid,
    }, dispatch);
  }, [isAuthenticated, comicseries?.uuid, navigation]);

  const exclusiveListItemStyle = useMemo(() => ({
    ...styles.exclusiveListItem,
    height: screenDetails.height,
  }), [screenDetails.height]);

  const renderItem = useCallback(({ item }: { item: ListItem }) => {
    switch (item.type) {
      case 'story': {
        const isFirstPage = !!firstStoryUuid && item.data?.uuid === firstStoryUuid;
        return (
          <StoryImage
            story={item.data}
            screenDetails={screenDetails}
            contentToken={contentToken}
            onDisplay={isFirstPage ? nextEpisodePull.onContentReady : undefined}
            cachePolicy={isFirstPage ? 'memory-disk' : undefined}
          />
        );
      }
      case 'like':
        return (
          <LikeButton
            isLiked={isLiked}
            likeCount={displayLikeCount}
            isLoading={isLikeLoading ?? false}
            onPress={handleLikePress}
          />
        );
      case 'creator':
        return (
          <CreatorForIssue
            creators={item.data.creators}
            comicissue={item.data.comicissue}
          />
        );
      case 'grid':
        return (
          <GridOfComicIssues
            comicseries={item.data.comicseries}
            comicissue={item.data.comicissue}
            allIssues={item.data.allIssues}
          />
        );
      case 'comments':
        return (
          <CommentsSection
            issueUuid={item.data.issueUuid}
            seriesUuid={item.data.seriesUuid}
            isAuthenticated={item.data.isAuthenticated}
            commentCount={item.data.commentCount}
            creators={item.data.creators}
            onCommentCountChange={item.data.onCommentCountChange}
            initialComments={item.data.initialComments}
          />
        );
      case 'next-episode':
        return (
          <View style={styles.bottomSpacer}>
            <ReadNextEpisode
              comicissue={item.data.comicissue}
              handleNavigateToIssue={handleNavigateToIssue}
              pullProgress={nextEpisodePull.progress}
              onOpen={nextEpisodePull.open}
              onVisible={nextEpisodePull.onCardVisible}
              isAuthenticated={isAuthenticated}
              isSuperLikeLoading={isSuperLikeLoading}
              onSuperLike={handleSuperLikePress}
              hasLikedAllEpisodes={hasLikedAllEpisodes}
              creators={comicseries?.creators ?? undefined}
            />
          </View>
        );
      case 'exclusive-signup':
        return (
          <View style={exclusiveListItemStyle}>
            <SignupButton navigation={navigation} />
          </View>
        );
      case 'exclusive-connect-patreon':
        return (
          <View style={exclusiveListItemStyle}>
            <PatreonConnectButton navigation={navigation} />
          </View>
        );
      case 'exclusive-checking-access':
        return (
          <View style={exclusiveListItemStyle}>
            <ThemedActivityIndicator />
          </View>
        );
      case 'exclusive-no-access':
        return (
          <View style={exclusiveListItemStyle}>
            <YouNeedToBeAPatreonBacker 
              creators={item.data.creators} 
              creatorLinks={item.data.creatorLinks} 
            />
          </View>
        );
      case 'patreon-exclusive':
        const creatorName = comicseries?.creators?.[0]?.name;
        return (
          <View style={styles.patreonExclusiveContainer}>
            <ThemedText style={styles.patreonExclusiveText}>Yay! As a Patreon backer{creatorName ? ` of ${creatorName}` : ''}, you get early access to this episode!</ThemedText>
          </View>
        );
      default:
        return null;
    }
  }, [screenDetails, contentToken, handleNavigateToIssue, navigation, exclusiveListItemStyle, isLiked, displayLikeCount, isLikeLoading, handleLikePress, isAuthenticated, isSuperLikeLoading, handleSuperLikePress, hasLikedAllEpisodes, comicseries?.creators, nextEpisodePull.progress, nextEpisodePull.open, nextEpisodePull.onCardVisible, nextEpisodePull.onContentReady, firstStoryUuid]);

  const listData = useMemo(() => {
    if (!comicissue || !comicseries) return [];

    // Check for exclusive content states
    if (isPatreonExclusive) {
      if (!isAuthenticated) {
        return [{
          type: 'exclusive-signup' as const,
          key: 'exclusive-signup',
          data: {},
        }];
      } else if (!isConnectedToHostingProvider) {
        return [{
          type: 'exclusive-connect-patreon' as const,
          key: 'exclusive-connect-patreon',
          data: {},
        }];
      } else if (isCheckingAccess) {
        return [{
          type: 'exclusive-checking-access' as const,
          key: 'exclusive-checking-access',
          data: {},
        }];
      } else if (!hasAccessToIssue) {
        return [{
          type: 'exclusive-no-access' as const,
          key: 'exclusive-no-access',
          data: {
            creators: comicseries?.creators?.filter(Boolean) as Creator[] | undefined,
            creatorLinks: creatorLinks,
          },
        }];
      }
    }

    const patreonExclusiveItem: ListItem[] = isPatreonExclusive ? [{
      type: 'patreon-exclusive' as const,
      key: 'patreon-exclusive',
      data: {},
    }] : [];

    const storyItems: ListItem[] = comicissue.stories?.map((story) => ({
      type: 'story' as const,
      key: `story-${story?.uuid ?? ''}`,
      data: story,
    })) ?? [];

    const likeItem: ListItem = {
      type: 'like' as const,
      key: 'like-button',
      data: {},
    };

    const commentsItem: ListItem = {
      type: 'comments' as const,
      key: 'comments-section',
      data: {
        issueUuid,
        seriesUuid,
        isAuthenticated,
        commentCount: commentCount ?? undefined,
        creators: comicseries?.creators ?? [],
        onCommentCountChange: handleCommentCountChange,
        initialComments,
      },
    };

    const creatorItem: ListItem = {
      type: 'creator' as const,
      key: `creator-details`,
      data: {
        creators: comicseries?.creators?.filter((creator) => creator !== null) ?? [],
        comicissue,
      },
    };

    const nextEpisodeItem: ListItem = {
      type: 'next-episode' as const,
      key: 'next-episode-button',
      data: {
        comicissue: comicissue.nextIssue,
      },
    };

    const items = [
      ...patreonExclusiveItem,
      ...storyItems,
      likeItem,
      commentsItem,
      creatorItem,
      nextEpisodeItem
    ];

    return items;
  }, [comicissue, comicseries, contentToken, isPatreonExclusive, isAuthenticated, isConnectedToHostingProvider, isCheckingAccess, hasAccessToIssue, creatorLinks, commentCount, handleCommentCountChange, initialComments]);

  // Handle tap on content to toggle header and footer
  const handleTap = useCallback(() => {
    if (isHeaderOpen.current) {
      animateHeaderPosition(HEADER_CLOSED_POSITION);
      animateFooterPosition(FOOTER_CLOSED_POSITION);
    } else {
      animateHeaderPosition(HEADER_OPEN_POSITION);
      animateFooterPosition(FOOTER_OPEN_POSITION);
    }
  }, [animateHeaderPosition, animateFooterPosition]);

  // Handle scroll events to show/hide header and footer
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const y = contentOffset.y;
    
    // Update scroll position for scroll indicator
    setScrollPosition(y);
    setContentHeight(contentSize.height);
    
    // Calculate how close to bottom we are (create a small threshold). The hidden spacer below the
    // next-episode card doesn't count, so the bottom is reached when the card is in view.
    const isAtBottom = y + layoutMeasurement.height >= contentSize.height - bottomSpacerHeight - 20;
    
    // Show header and footer when at top
    if (y <= 0 && (!isHeaderOpen.current || !isFooterOpen.current)) {
      animateHeaderPosition(HEADER_OPEN_POSITION);
      animateFooterPosition(FOOTER_OPEN_POSITION);
    } 
    // Hide header and footer when scrolling in the middle
    else if (y > 0 && !isAtBottom && (isHeaderOpen.current || isFooterOpen.current)) {
      animateHeaderPosition(HEADER_CLOSED_POSITION);
      animateFooterPosition(FOOTER_CLOSED_POSITION);
    } 
    // Show header and footer when at bottom
    else if (isAtBottom && (!isHeaderOpen.current || !isFooterOpen.current)) {
      animateHeaderPosition(HEADER_OPEN_POSITION);
      animateFooterPosition(FOOTER_OPEN_POSITION);
    }

    nextEpisodePull.onScroll(event);
  }, [animateHeaderPosition, animateFooterPosition, bottomSpacerHeight, nextEpisodePull.onScroll]);

  // Handle scroll to position from scroll indicator
  const handleScrollTo = useCallback((position: number) => {
    flatListRef.current?.scrollToOffset({ offset: position, animated: false });
  }, []);

  // Custom wrapper for FlashList items to handle taps
  const TappableItem = useCallback(({ item }: { item: ListItem }) => {
    const content = renderItem({ item });
    
    return (
      <TouchableWithoutFeedback onPress={handleTap}>
        <View style={styles.container}>
          {content}
        </View>
      </TouchableWithoutFeedback>
    );
  }, [renderItem, handleTap]);

  // Loading an issue dispatches a loading state even on a cache hit, so only show the spinner when the
  // rendered issue is not the one requested. The peek sheet stays mounted in both states so it can keep
  // covering the screen while the next issue loads underneath it.
  const showSpinner = !comicissue || !comicseries || (isComicIssueLoading && comicissue.uuid !== issueUuid);

  // No first page to wait for (gated or empty issue): let the covering sheet go once this has rendered
  const hasStoryItems = listData.some((item) => item.type === 'story');
  useEffect(() => {
    if (showSpinner || hasStoryItems) { return; }
    const frame = requestAnimationFrame(nextEpisodePull.onContentReady);
    return () => cancelAnimationFrame(frame);
  }, [showSpinner, hasStoryItems, nextEpisodePull.onContentReady]);

  if (showSpinner) {
    return (
      <Screen style={styles.loadingContainer}>
        <ThemedActivityIndicator />
        <ReadNextEpisodeSheet {...nextEpisodePull.sheetProps} />
      </Screen>
    );
  }

  return (
    <Screen style={styles.container}>
      <FadeInView fadeIn={!skipFadeIn}>
        <ComicHeader
          headerPosition={headerTranslateY}
          comicseries={comicseries}
          comicissue={comicissue}
        />
        <FlashList
          ref={flatListRef}
          data={listData}
          renderItem={TappableItem}
          keyExtractor={(item) => item.key}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          onScrollBeginDrag={nextEpisodePull.onScrollBeginDrag}
          onScrollEndDrag={nextEpisodePull.onScrollEndDrag}
          onMomentumScrollEnd={nextEpisodePull.onMomentumScrollEnd}
          scrollEventThrottle={16}
          renderScrollComponent={KeyboardAwareScrollView as any}
          // estimatedListSize={{
          //   height: screenDetails.height,
          //   width: screenDetails.width
          // }}
          refreshControl={
            <ThemedRefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />
          }
          contentContainerStyle={{ paddingBottom: FOOTER_HEIGHT }}
        />
        <ComicFooter
          footerPosition={footerTranslateY}
          comicissue={comicissue}
          nextIssue={comicissue?.nextIssue}
          previousIssue={comicissue?.previousIssue}
          onNavigateToIssue={handleNavigateToIssue}
          isLiked={isLiked}
          likeCount={displayLikeCount}
          isLikeLoading={isLikeLoading ?? false}
          onLikePress={handleLikePress}
          commentCount={commentCount ?? undefined}
          onCommentPress={handleCommentPress}
        />
        <ScrollIndicator
          scrollPosition={scrollPosition}
          contentHeight={contentHeight - bottomSpacerHeight}
          screenHeight={screenDetails.height}
          headerHeight={HEADER_HEIGHT}
          footerHeight={FOOTER_HEIGHT}
          onScrollTo={handleScrollTo}
          isVisible={isHeaderVisible}
        />
      </FadeInView>
      <ReadNextEpisodeSheet {...nextEpisodePull.sheetProps} />
    </Screen>
  );
}

const SignupButton = ({ navigation }: { navigation: any }) => {
  return (
    <View style={styles.authContainer}>
      <ThemedText style={styles.authText}>Please sign up to continue</ThemedText>
      <ThemedButton
        buttonText="Sign Up"
        style={styles.authButton}
        buttonTextProps={styles.authButtonText}
        onPress={() => navigation.navigate(SIGNUP_SCREEN)}
      />
    </View>
  );
};

const PatreonConnectButton = ({ navigation }: { navigation: any }) => {
  return (
    <View style={styles.authContainer}>
      <ThemedText style={styles.authText}>Please connect your Patreon account to access this episode.</ThemedText>
      <PressableOpacity
        onPress={() => navigation.navigate(EDIT_PATREON_SCREEN)}
        style={styles.authButton}
      >
        <Text style={styles.authButtonText}>Connect Patreon</Text>
      </PressableOpacity>
    </View>
  );
};

const YouNeedToBeAPatreonBacker = ({ creators, creatorLinks }: { creators?: Creator[] | undefined, creatorLinks?: any[] }) => {
  const creatorName = creators?.[0]?.name || 'this creator';
  const patreonUrl = creatorLinks?.find(link => link.type === LinkType.PATREON)?.url || undefined;
  const creatorAvatar = getAvatarImageUrl({ avatarImageAsString: creators?.[0]?.avatarImageAsString });
  const buttonColor = useThemeColor({}, 'action');

  return (
    <View style={styles.authContainer}>
      {creatorAvatar && (
        <Image source={{ uri: creatorAvatar }} style={styles.creatorAvatar} />
      )}
      <ThemedText style={styles.patreonBackerTitle}>
        You need to be a <ThemedText style={[styles.patreonText, { color: buttonColor }]}>Patreon</ThemedText> backer of {creatorName} to get access to this episode.
      </ThemedText>
      <ThemedText style={styles.patreonBackerDescriptionText}>
        If you are already a Patreon backer of {creatorName} and you are seeing this message, please check you are on the Patreon tier that gives you early access to new episodes.
      </ThemedText>
      {patreonUrl && (
        <ThemedButton
          buttonText="BECOME A PATREON BACKER"
          style={{ ...styles.patreonButton, backgroundColor: buttonColor }}
          buttonTextProps={styles.patreonButtonText}
          onPress={() => {
            if (patreonUrl) {
              Linking.openURL(patreonUrl);
            }
          }}
        />
      )}
    </View>
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
  bottomSpacer: {
    marginBottom: 10,
  },
  exclusiveListItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  authContainer: {
    alignItems: 'center',
    padding: 20,
  },
  authText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 24,
  },
  authButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
  },
  authButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  creatorAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 16,
  },
  patreonBackerTitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  patreonText: {
    fontSize: 19,
    fontFamily: ThemedTextFontFamilyMap.semiBold,
  },
  patreonBackerDescriptionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  patreonButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 999,
  },
  patreonButtonText: {
    color: 'white',
    fontSize: 18,
  },
  patreonExclusiveContainer: {
    marginTop: 50,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 10,
  },
  patreonExclusiveText: {
    textAlign: 'center',
    fontSize: 18,
    fontFamily: ThemedTextFontFamilyMap.semiBold,
  },
});