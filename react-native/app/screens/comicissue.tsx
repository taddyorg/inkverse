import React, { useCallback, useReducer, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions, Animated, View, NativeSyntheticEvent, NativeScrollEvent, TouchableWithoutFeedback, Pressable, Text } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, COMICISSUE_SCREEN, COMICSERIES_SCREEN, EDIT_PATREON_SCREEN, SIGNUP_SCREEN } from '@/constants/Navigation';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { jwtDecode } from 'jwt-decode';
import * as Linking from 'expo-linking';

import { StoryImage } from '../components/comics/StoryImage';
import { GridOfComicIssues } from '../components/comics/GridOfComicIssues';
import { ComicHeader, HEADER_HEIGHT } from '../components/comics/ComicHeader';
import { ComicFooter, FOOTER_HEIGHT } from '../components/comics/ComicFooter';
import { CreatorForIssue } from '../components/creator/CreatorForIssue';
import { ReadNextEpisode } from '../components/comics/ReadNextEpisode';
import { Screen, ScrollIndicator, ThemedActivityIndicator, ThemedRefreshControl, ThemedView, ThemedText, ThemedButton, PressableOpacity, ThemedTextFontFamilyMap } from '@/app/components/ui';

import { getPublicApolloClient } from '@/lib/apollo';
import { comicIssueReducer, comicIssueInitialState, loadComicIssue, checkPatreonAccess } from '@inkverse/shared-client/dispatch/comicissue';
import { ComicIssue, Creator } from '@inkverse/shared-client/graphql/operations';
import { getStoryImageUrl } from '@inkverse/public/comicstory';
import { getAvatarImageUrl } from '@inkverse/public/creator';
import { LinkType } from '@inkverse/public/graphql/types';
import { getUserDetails } from '@/lib/auth/user';
import { getConnectedHostingProviderUuids, getContentTokenForProviderAndSeries } from '@/lib/auth/hosting-provider';
import { useThemeColor } from '@/constants/Colors';

type ListItemType = 'story' | 'grid' | 'creator' | 'next-episode' | 'exclusive-signup' | 'exclusive-connect-patreon' | 'exclusive-checking-access' | 'exclusive-no-access' | 'patreon-exclusive';

interface ListItem {
  type: ListItemType;
  key: string;
  data: any;
}

export type ComicIssueScreenParams = {
  issueUuid: string;
  seriesUuid: string;
};

const PRELOAD_BATCH_SIZE = 5;
const ESTIMATED_ITEM_SIZE = 300;

// Define header and footer position constants
const HEADER_OPEN_POSITION = 0;
const HEADER_CLOSED_POSITION = -HEADER_HEIGHT;
const FOOTER_OPEN_POSITION = 0;
const FOOTER_CLOSED_POSITION = FOOTER_HEIGHT;

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
  const navigation = useNavigation();
  const { issueUuid, seriesUuid } = route.params;
  const screenDetails = useWindowDimensions();
  const flatListRef = useRef<FlashList<ListItem>>(null);
  const publicClient = getPublicApolloClient();
  
  // Header and footer animation state
  const headerTranslateY = useRef(new Animated.Value(HEADER_OPEN_POSITION)).current;
  const footerTranslateY = useRef(new Animated.Value(FOOTER_OPEN_POSITION)).current;
  const isHeaderOpen = useRef(true);
  const isFooterOpen = useRef(true);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
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
  
  const [state, dispatch] = useReducer(comicIssueReducer, comicIssueInitialState);
  const { isComicIssueLoading, comicissue, comicseries, isCheckingAccess, contentToken, creatorLinks } = state;
  
  const isPatreonExclusive = comicissue?.scopesForExclusiveContent?.includes('patreon');
  const decodedToken = contentToken && jwtDecode(contentToken) as any;
  const hasAccessToIssue = decodedToken?.scopes_for_exclusive_content?.includes('patreon');
  const connectedProviders = getConnectedHostingProviderUuids();
  const isConnectedToHostingProvider = comicseries?.hostingProviderUuid && connectedProviders.includes(comicseries.hostingProviderUuid);
  const isAuthenticated = !!getUserDetails();
  
  const loadData = useCallback(async (forceRefresh = false) => {
    await loadComicIssue({
      publicClient,
      issueUuid,
      seriesUuid,
      forceRefresh
    }, dispatch);
  }, [issueUuid]);

  useEffect(() => {
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

  // Handle navigation to a different issue
  const handleNavigateToIssue = useCallback((newIssueUuid: string, newSeriesUuid: string) => {
    navigation.navigate(COMICISSUE_SCREEN, {
      issueUuid: newIssueUuid,
      seriesUuid: newSeriesUuid,
    });

    // Reset all UI state properly
    setScrollPosition(0);
    setContentHeight(0); // Reset content height to prevent incorrect scroll indicator
    isHeaderOpen.current = false;
    isFooterOpen.current = false;
    setIsHeaderVisible(false);
    headerTranslateY.setValue(HEADER_CLOSED_POSITION);
    footerTranslateY.setValue(FOOTER_CLOSED_POSITION);    
  }, [navigation]);

  const exclusiveListItemStyle = useMemo(() => ({
    ...styles.exclusiveListItem,
    height: screenDetails.height,
  }), [screenDetails.height]);

  const renderItem = useCallback(({ item }: { item: ListItem }) => {
    switch (item.type) {
      case 'story':
        return (
          <StoryImage
            story={item.data}
            screenDetails={screenDetails}
            contentToken={contentToken}
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
      case 'next-episode':
        return (
          <View style={styles.bottomSpacer}>
            <ReadNextEpisode
              comicissue={item.data.comicissue}
              handleNavigateToIssue={handleNavigateToIssue}
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
  }, [screenDetails, contentToken, handleNavigateToIssue, navigation, exclusiveListItemStyle]);

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
      } else if (!hasAccessToIssue && contentToken) {
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
      creatorItem,
      nextEpisodeItem
    ];

    return items;
  }, [comicissue, comicseries, contentToken, isPatreonExclusive, isAuthenticated, isConnectedToHostingProvider, isCheckingAccess, hasAccessToIssue, creatorLinks]);

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
    
    // Calculate how close to bottom we are (create a small threshold)
    const isAtBottom = y + layoutMeasurement.height >= contentSize.height - 20;
    
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
  }, [animateHeaderPosition, animateFooterPosition]);

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

  if (isComicIssueLoading) {
    return (
      <Screen style={styles.loadingContainer}>
        <ThemedActivityIndicator />
      </Screen>
    );
  }

  if (!comicissue || !comicseries) {
    return (
      <Screen style={styles.loadingContainer}>
        <ThemedActivityIndicator />
      </Screen>
    );
  }

  return (
    <Screen style={styles.container}>
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
        estimatedItemSize={ESTIMATED_ITEM_SIZE}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        estimatedListSize={{
          height: screenDetails.height,
          width: screenDetails.width
        }}
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
      />
      <ScrollIndicator 
        scrollPosition={scrollPosition}
        contentHeight={contentHeight}
        screenHeight={screenDetails.height}
        headerHeight={HEADER_HEIGHT}
        footerHeight={FOOTER_HEIGHT}
        onScrollTo={handleScrollTo}
        isVisible={isHeaderVisible}
      />
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
      <ThemedText style={styles.authText}>Please connect your Patreon account to access this comic issue.</ThemedText>
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
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  patreonText: {
    fontSize: 19,
    fontFamily: ThemedTextFontFamilyMap.semiBold,
  },
  patreonButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 999,
  },
  patreonButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
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