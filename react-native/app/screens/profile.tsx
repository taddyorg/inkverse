import { useCallback, useMemo, useEffect, useReducer, useState } from 'react';
import { StyleSheet, Image, View, Dimensions, SectionList, FlatList } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Screen, ThemedView, ThemedText, ThemedButton, ThemedActivityIndicator, HeaderBackButton, ThemedRefreshControl } from '@/app/components/ui';
import { HeaderSettingsButton } from '@/app/components/profile/HeaderSettingsButton';
import { PROFILE_SCREEN, RootStackParamList, SETTINGS_SCREEN, SIGNUP_SCREEN } from '@/constants/Navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getUserDetails } from '@/lib/auth/user';
import { User, ComicSeries } from '@inkverse/shared-client/graphql/operations';
import { loadPublicProfileById, loadUserProfileById, profileReducer, profileInitialState, ProfileActionType, ProfileState, logoutUserProfile } from '@inkverse/shared-client/dispatch/profile';
import { getPublicApolloClient, getUserApolloClient } from '@/lib/apollo';
import { ComicSeriesDetails } from '../components/comics/ComicSeriesDetails';
import { on, off, EventNames } from '@inkverse/shared-client/pubsub';

type SectionData = {
  title: string;
  type: string;
  data: any[];
}

type HeaderItem = { type: 'header'; includeBackButton: boolean };
type ProfileItem = { type: 'profile'; user: Partial<User> | null };
type EmptyStateItem = { type: 'logged-out-state' };
type LoadingItem = { type: 'loading' };
type ErrorItem = { type: 'error'; message: string };
type ComicsGridItem = { type: 'comics-grid'; comics: ComicSeries[]; isOwnProfile: boolean; user: Partial<User> | null };

type ProfileSectionItem = HeaderItem | ProfileItem | EmptyStateItem | LoadingItem | ErrorItem | ComicsGridItem;

export type ProfileScreenParams = {
  userId?: string;
};

// Calculate number of columns based on screen width
const getNumColumns = () => {
  const screenWidth = Dimensions.get('window').width;
  // Account for padding: 12px container + 8px view + 16px between items
  const availableWidth = screenWidth - 32;
  // Each item needs at least 150px width
  const minItemWidth = 150;
  const numColumns = Math.floor(availableWidth / minItemWidth);
  return Math.max(1, Math.min(numColumns, 3)); // Between 1 and 3 columns
};

export function ProfileScreen() {
  const route = useRoute<NativeStackScreenProps<RootStackParamList, typeof PROFILE_SCREEN>['route']>();
  const { userId } = route?.params || {};
  const currentUser = getUserDetails();
  const isLoggedIn = !!currentUser;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  // Set up reducer for profile data
  const [state, dispatch] = useReducer(profileReducer, profileInitialState);
  const { user, subscribedComics, isLoading, error } = state;
  
  // Pull to refresh state
  const [refreshing, setRefreshing] = useState(false);
  
  // Determine which profile to load
  const profileUserId = userId || currentUser?.id;
  const isOwnProfile = currentUser && user && currentUser.id === user.id;
  
  // Helper function to load profile data
  const loadProfile = useCallback((forceRefresh = false) => {
    if (!profileUserId) {
      return;
    }

    const publicClient = getPublicApolloClient();
    const userClient = isLoggedIn ? getUserApolloClient() : undefined;

    if (currentUser?.id === profileUserId) {
      loadUserProfileById(
        {
          userClient,
          userId: profileUserId,
          forceRefresh,
        },
        dispatch
      );
    } else {
      loadPublicProfileById(
        {
          publicClient,
          userId: profileUserId,  
          forceRefresh,
        },
        dispatch
      );
    }
  }, [profileUserId, currentUser?.id, isLoggedIn, refreshing]);
  
  // Load profile data on mount or when userId changes
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Listen for authentication events
  useEffect(() => {
    // Handle user authentication (login/signup)
    const handleUserAuthenticated = (data: { userId: string }) => {
      // Reload profile when user logs in
      // Use the userId from the event since getUserDetails might not be updated yet
      if (data.userId && (!userId || data.userId === userId)) {
        // If viewing own profile (no userId in route), load the newly authenticated user's profile
        const userClient = getUserApolloClient();
        if (!userClient) { return; }

        loadUserProfileById(
          {
            userClient,
            userId: data.userId,
            forceRefresh: true,
          },
          dispatch
        );
      }
    };

    // Handle user logout
    const handleUserLoggedOut = () => {
      // Reset state to initial when user logs out
      logoutUserProfile(dispatch);
    };

    // Handle comic subscription events
    const handleComicSubscribed = (data: { seriesUuid?: string; userId: string }) => {
      // Reload profile when a comic is subscribed
      if (data.userId === profileUserId) {
        loadProfile(true);
      }
    };

    const handleComicUnsubscribed = (data: { seriesUuid: string; userId: string }) => {
      // Reload profile when a comic is unsubscribed
      if (data.userId === profileUserId) {
        loadProfile(true);
      }
    };

    // Subscribe to events
    on(EventNames.USER_AUTHENTICATED, handleUserAuthenticated);
    on(EventNames.USER_LOGGED_OUT, handleUserLoggedOut);
    on(EventNames.COMIC_SUBSCRIBED, handleComicSubscribed);
    on(EventNames.COMIC_UNSUBSCRIBED, handleComicUnsubscribed);

    // Cleanup subscriptions on unmount
    return () => {
      off(EventNames.USER_AUTHENTICATED, handleUserAuthenticated);
      off(EventNames.USER_LOGGED_OUT, handleUserLoggedOut);
      off(EventNames.COMIC_SUBSCRIBED, handleComicSubscribed);
      off(EventNames.COMIC_UNSUBSCRIBED, handleComicUnsubscribed);
    };
  }, [loadProfile, dispatch, userId, profileUserId]);

  // Pull to refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    loadProfile(true);
    setRefreshing(false);
  }, [loadProfile]);
  
  const sectionData = useMemo((): SectionData[] => {
    const sections: SectionData[] = [];
    
    // Header section
    sections.push({
      title: '',
      type: 'header',
      data: [{ type: 'header', includeBackButton: !!userId } as HeaderItem],
    });

    // Show sign up prompt for logged out users viewing their own profile
    if (!isLoggedIn && !userId) {
      sections.push({
        title: '',
        type: 'logged-out-state',
        data: [{ type: 'logged-out-state' } as EmptyStateItem],
      });
      return sections;
    }

    // Show loading state
    if (isLoading) {
      sections.push({
        title: '',
        type: 'loading',
        data: [{ type: 'loading' } as LoadingItem],
      });
      return sections;
    }

    // Show error state or profile not found state
    if (error || !user) {
      sections.push({
        title: '',
        type: 'error',
        data: [{ 
          type: 'error', 
          message: error 
            ? (typeof error === 'string' ? error : 'Unknown error')
            : 'Profile not found'
        } as ErrorItem],
      });
      return sections;
    }

    // Profile details section
    sections.push({
      title: '',
      type: 'profile',
      data: [{ type: 'profile', user } as ProfileItem],
    });

    // Comics section
    sections.push({
      title: (subscribedComics && subscribedComics.length > 0) ? (isOwnProfile ? 'Your Comics' : `Comics I've saved`) : '',
      type: 'comics-grid',
      data: [{ 
        type: 'comics-grid', 
        comics: subscribedComics,
        isOwnProfile: !!isOwnProfile,
        user 
      } as ComicsGridItem],
    });

    return sections;
  }, [isLoggedIn, userId, user, subscribedComics, isLoading, error, isOwnProfile]);

  const handleSettingsPress = useCallback(() => {
    navigation.navigate(SETTINGS_SCREEN);
  }, [navigation]);

  const renderSectionItem = useCallback(({ item }: { item: ProfileSectionItem }) => {
    switch (item.type) {
      case 'header':
        return (
          <ThemedView style={styles.headerContainer}>
            {item.includeBackButton && <HeaderBackButton />}
            <HeaderSettingsButton onPress={handleSettingsPress} />
          </ThemedView>
        );
      
      case 'logged-out-state':
        return (
          <ThemedView style={styles.emptyStateContainer}>
            <Image source={require('@/assets/images/unlock-profile.png')} style={styles.emptyStateImage}/>
            <ThemedView style={styles.emptyStateContent}>
              <ThemedText size='title' style={styles.heading}>
                Unlock Your Profile!
              </ThemedText>
              <ThemedText style={styles.subheading}>
                Create your profile to start saving your favorite webtoons and tracking your reading history!
              </ThemedText>
              <ThemedButton 
                buttonText="Sign Up"
                style={styles.ctaButton}
                onPress={() => navigation.navigate(SIGNUP_SCREEN)}
              />
            </ThemedView>
          </ThemedView>
        );
      
      case 'loading':
        return (
          <ThemedView style={styles.profileContainer}>
            <ThemedActivityIndicator size="large" />
          </ThemedView>
        );
      
      case 'error':
        return (
          <ThemedView style={styles.profileContainer}>
            <ThemedText style={styles.errorText}>
              Error loading profile: {item.message}
            </ThemedText>
          </ThemedView>
        );
      
      case 'profile':
        return (
          <ThemedView style={styles.profileContainer}>
            <ThemedView style={[styles.profileHeader, { paddingHorizontal: 16 }]}>
              <ThemedText size='title' style={styles.username}>
                {item.user?.username}
              </ThemedText>
            </ThemedView>
          </ThemedView>
        );
      
      case 'comics-grid':
        const { comics, isOwnProfile, user } = item;
        
        if (comics.length === 0) {
          return (
            <ThemedView style={styles.sectionContainer}>
              <ThemedView style={styles.emptyComicsContainer}>
                <ThemedText style={styles.emptyComicsText}>
                  {isOwnProfile 
                    ? "When you save a comic to your profile, it will show up here"
                    : `No comics saved to ${user?.username}'s profile, yet...`
                  }
                </ThemedText>
              </ThemedView>
            </ThemedView>
          );
        }
        
        return (
          <View style={styles.sectionContainer}>
            <FlatList
              data={comics}
              renderItem={renderComicItem}
              numColumns={getNumColumns()}
              keyExtractor={(comic) => comic.uuid.toString()}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
              contentContainerStyle={styles.comicsGrid}
            />
          </View>
        );
      
      default:
        return null;
    }
  }, [handleSettingsPress, navigation]);

  const renderComicItem = useCallback(({ item }: { item: ComicSeries }) => {
    const numColumns = getNumColumns();
    const screenWidth = Dimensions.get('window').width;
    const availableWidth = screenWidth - 32; // Account for padding
    const itemWidth = (availableWidth - (numColumns - 1)) / numColumns; // 16px gap between items
        
    return (
      <View style={{ width: itemWidth }}> 
        <ComicSeriesDetails
          comicseries={item}
          pageType='grid-item'
        />
      </View>
    );
  }, []);

  const renderSectionHeader = useCallback(({ section }: { section: SectionData }) => {
    if (!section.title) return null;
    
    return (
      <View style={{ paddingHorizontal: 20 }}>
        <ThemedText size='subtitle' style={styles.sectionTitle}>
          {section.title}
        </ThemedText>
      </View>
    );
  }, []);

  return (
    <Screen>
      <SectionList
        sections={sectionData}
        renderItem={renderSectionItem}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={(item, index) => {
          // Each item type appears only once, so we can use a combination
          // of the item type and any unique property it has
          switch(item.type) {
            case 'header':
              return `header-${item.includeBackButton ? 'back' : 'no-back'}`;
            case 'profile':
              return `profile-${item.user?.id || 'no-user'}`;
            case 'comics-grid':
              return `comics-grid-${item.user?.id || 'section'}`;
            case 'logged-out-state':
              return 'logged-out-state';
            case 'loading':
              return 'loading';
            case 'error':
              return `error-${index}`;
            default:
              return `item-${index}`;
          }
        }}
        contentContainerStyle={styles.screenPadding}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <ThemedRefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  emptyStateContainer: {
    flex: 1,
    marginTop: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  emptyStateContent: {
    alignItems: 'center',
  },
  emptyStateImage: {
    height: 300,
    resizeMode: 'contain',
    marginBottom: 16,
    alignSelf: 'center',
  },
  screenPadding: {
    paddingBottom: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  subheading: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 38,
  },
  ctaButton: {
    paddingHorizontal: 34,
  },
  ctaText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  profileNotFoundContainer: {
    flex: 1,
    marginTop: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  profileContainer: {
    marginTop: 0,
    paddingTop: 8,
    paddingHorizontal: 12,
    paddingBottom: 8,
    borderRadius: 12,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingRight: 60,
  },
  username: {
    fontSize: 24,
    fontWeight: '700',
    flex: 1,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginLeft: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    color: 'red',
  },
  sectionContainer: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  emptyComicsContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  emptyComicsText: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
  },
  headerContainer: {
    justifyContent: 'center',
    position: 'relative',
    height: 64,
    marginTop: 16,
    marginBottom: 8,
  },
  comicsGrid: {
    paddingHorizontal: 4,
  },
}); 