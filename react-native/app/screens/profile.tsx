import { useCallback, useMemo, useEffect, useReducer, useState } from 'react';
import { StyleSheet, Image, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNavigation, useRoute } from '@react-navigation/native';

import { Screen, ThemedView, ThemedText, ThemedButton, ThemedActivityIndicator, HeaderBackButton, ThemedRefreshControl } from '@/app/components/ui';
import { HeaderSettingsButton } from '@/app/components/profile/HeaderSettingsButton';
import { PROFILE_SCREEN, RootStackParamList, SETTINGS_SCREEN, SIGNUP_SCREEN } from '@/constants/Navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getUserDetails } from '@/lib/auth/user';
import { User, ComicSeries } from '@inkverse/shared-client/graphql/operations';
import { loadProfileById, profileReducer, profileInitialState } from '@inkverse/shared-client/dispatch/profile';
import { getPublicApolloClient, getUserApolloClient } from '@/lib/apollo';
import { ComicSeriesDetails } from '../components/comics/ComicSeriesDetails';

type ListItem = 
  | { type: 'screen-header'; data: undefined; includeBackButton: boolean }
  | { type: 'empty-state'; data: undefined }
  | { type: 'loading-state'; data: undefined }
  | { type: 'error-state'; data: { message: string } }
  | { type: 'profile-details'; data: { user: Partial<User> | null } }
  | { type: 'subscribed-comics-section'; data: { user: Partial<User> | null; subscriptions: ComicSeries[] | null; isOwnProfile: boolean } }

export type ProfileScreenParams = {
  userId?: string;
};

export function ProfileScreen() {
  const route = useRoute<NativeStackScreenProps<RootStackParamList, typeof PROFILE_SCREEN>['route']>();
  const { userId } = route?.params || {};
  const currentUser = getUserDetails();
  const isLoggedIn = !!currentUser;
  const navigation = useNavigation();
  
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
    
    loadProfileById(
      {
        publicClient,
        userClient,
        userId: profileUserId,
        currentUserId: currentUser?.id,
        forceRefresh,
      },
      dispatch
    );
  }, [profileUserId, currentUser?.id, isLoggedIn, refreshing]);
  
  // Load profile data on mount or when userId changes
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Pull to refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    loadProfile(true);
    setRefreshing(false);
  }, [loadProfile]);
  
  const listData = useMemo((): ListItem[] => {
    const baseItems: ListItem[] = [
      { type: 'screen-header', data: undefined, includeBackButton: !!userId },
    ];

    // Show sign up prompt for logged out users viewing their own profile
    if (!isLoggedIn && !userId) {
      return [...baseItems, { type: 'empty-state', data: undefined }];
    }

    // Show loading state
    if (isLoading) {
      return [...baseItems, { type: 'loading-state', data: undefined }];
    }

    // Show error state
    if (error) {
      return [...baseItems, { 
        type: 'error-state', 
        data: { 
          message: typeof error === 'string' ? error : 'Unknown error' 
        } 
      }];
    }

    // Show profile not found state
    if (!user) {
      return [...baseItems, { 
        type: 'error-state',
        data: { 
          message: 'Profile not found' 
        } 
      }];
    }

    // Add profile details
    const profileDetailsItem: ListItem = {
      type: 'profile-details',
      data: {
        user,
      }
    };

    // Add comics section for successfully loaded profiles
    const comicsSectionItem: ListItem = {
      type: 'subscribed-comics-section',
      data: {
        user,
        subscriptions: subscribedComics || [],
        isOwnProfile: !!isOwnProfile,
      }
    };

    return [...baseItems, profileDetailsItem, comicsSectionItem];
  }, [isLoggedIn, userId, user, subscribedComics, isLoading, error, isOwnProfile]);

  const handleSettingsPress = useCallback(() => {
    navigation.navigate(SETTINGS_SCREEN);
  }, [navigation]);

  const handleEditProfile = useCallback(() => {
    // TODO: Navigate to edit profile screen when it's implemented
    console.log('Edit profile pressed');
  }, []);

  const renderItem = useCallback(({ item }: { item: ListItem }) => {
    if (item.type === 'screen-header') {
      return (
        <ThemedView style={styles.headerContainer}>
          {item.includeBackButton && <HeaderBackButton />}
          <HeaderSettingsButton onPress={handleSettingsPress} />
        </ThemedView>
      );
    }
    if (item.type === 'empty-state') {
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
    }
    if (item.type === 'loading-state') {
      return (
        <ThemedView style={styles.profileContainer}>
          <ThemedActivityIndicator size="large" />
        </ThemedView>
      );
    }
    if (item.type === 'error-state') {
      return (
        <ThemedView style={styles.profileContainer}>
          <ThemedText style={styles.errorText}>
            Error loading profile: {item.data.message}
          </ThemedText>
        </ThemedView>
      );
    }
    if (item.type === 'profile-details') {
      const { user } = item.data;
      
      return (
        <ThemedView style={styles.profileContainer}>
          <ThemedView style={[styles.profileHeader, { paddingHorizontal: 16 }]}>
            <ThemedText size='title' style={styles.username}>
              {user?.username}
            </ThemedText>
          </ThemedView>
        </ThemedView>
      );
    }
    
    if (item.type === 'subscribed-comics-section') {
      const { user, subscriptions, isOwnProfile } = item.data;
      
      return (
        <ThemedView style={styles.sectionContainer}>
          {subscriptions && subscriptions.length === 0 && (
            <ThemedView style={styles.emptyComicsContainer}>
              <ThemedText style={styles.emptyComicsText}>
                {isOwnProfile 
                  ? "When you save a comic to your profile, it will show up here"
                  : `No comics saved to ${user?.username}'s profile, yet...`
                }
              </ThemedText>
            </ThemedView>
          )}
          {subscriptions && subscriptions.length > 0 && (
            <View style={{ paddingHorizontal: 8 }}>
              <ThemedText size='subtitle' style={[styles.sectionTitle]}>
                Your Comics
              </ThemedText>
              <FlashList
                data={subscriptions}
                renderItem={renderComicItem}
                numColumns={2}
                keyExtractor={(item) => item.uuid.toString()}
                showsVerticalScrollIndicator={false}
                // contentContainerStyle={{ paddingHorizontal: 4 }}
              />
            </View>
          )}
        </ThemedView>
      );
    }
    
    return null;
  }, [handleSettingsPress, isOwnProfile, handleEditProfile]);

  const renderComicItem = useCallback(({ item }: { item: ComicSeries }) => {
    return (
      <ComicSeriesDetails
        comicseries={item}
        pageType='grid-item'
      />
    );
  }, []);

  return (
    <Screen>
      <FlashList
        data={listData}
        renderItem={renderItem}
        keyExtractor={(item) => item.type}
        estimatedItemSize={100}
        contentContainerStyle={styles.screenPadding}
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
  topPadding: {
    height: 80,
  },
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
    marginTop: 8,
    paddingHorizontal: 12,
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
    paddingTop: 16,
    marginBottom: 8,
  },
  comicsGrid: {
    paddingHorizontal: 4,
  },
}); 