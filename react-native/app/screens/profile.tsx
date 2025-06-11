import { useCallback, useMemo, useEffect, useReducer } from 'react';
import { StyleSheet, Image } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNavigation, useRoute } from '@react-navigation/native';

import { Screen, ThemedView, ThemedText, ThemedButton, ThemedActivityIndicator, HeaderBackButton } from '@/app/components/ui';
import { HeaderSettingsButton } from '@/app/components/profile/HeaderSettingsButton';
import { PROFILE_SCREEN, RootStackParamList, SETTINGS_SCREEN, SIGNUP_SCREEN } from '@/constants/Navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getUserDetails } from '@/lib/auth/user';
import { User } from '@inkverse/shared-client/graphql/operations';
import { loadProfileById, profileLoaderReducer, profileInitialState } from '@inkverse/shared-client/dispatch/profile';
import { getPublicApolloClient, getUserApolloClient } from '@/lib/apollo';

type ListItem = 
  | { type: 'screen-header'; key: string; data: undefined; includeBackButton: boolean }
  | { type: 'empty-state'; key: string; data: undefined }
  | { type: 'profile-details'; key: string; data: {
      user: Partial<User> | null;
      isLoading: boolean;
      error: string | null;
    }}

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
  const [state, dispatch] = useReducer(profileLoaderReducer, profileInitialState);
  const { user: profileData, isLoading, error } = state;
  
  // Determine which profile to load
  const profileUserId = userId || currentUser?.id;
  const isOwnProfile = currentUser && profileData && currentUser.id === profileData.id;
  
  // Load profile data on mount or when userId changes
  useEffect(() => {
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
      },
      dispatch
    );
  }, [profileUserId, currentUser?.id, isLoggedIn]);
  
  const listData = useMemo((): ListItem[] => {
    const items: ListItem[] = [
      { type: 'screen-header', key: 'screen-header', data: undefined, includeBackButton: !!userId },
    ];

    if (!isLoggedIn && !userId) {
      // Show sign up prompt only when viewing own profile while logged out
      items.push({ type: 'empty-state', key: 'empty-state', data: undefined });
    } else {
      // Show profile details for logged in users or when viewing other profiles
      items.push({ 
        type: 'profile-details', 
        key: 'profile-details', 
        data: {
          user: profileData,
          isLoading,
          error,
        }
      });
    }

    return items;
  }, [isLoggedIn, userId, profileData, isLoading, error]);

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
        <ThemedView style={styles.topPadding}>
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
    if (item.type === 'profile-details') {
      const { user, isLoading, error } = item.data;
      
      if (isLoading) {
        return (
          <ThemedView style={styles.profileContainer}>
            <ThemedActivityIndicator size="large" />
          </ThemedView>
        );
      }
      
      if (error) {
        return (
          <ThemedView style={styles.profileContainer}>
            <ThemedText style={styles.errorText}>
              Error loading profile: {error}
            </ThemedText>
          </ThemedView>
        );
      }
      
      if (!user) {
        return (
          <ThemedView style={styles.profileContainer}>
            <ThemedText size='title' style={styles.heading}>
              Profile not found
            </ThemedText>
          </ThemedView>
        );
      }
      
      return (
        <ThemedView style={styles.profileContainer}>
          <ThemedView style={styles.profileHeader}>
            <ThemedText size='title' style={styles.username}>
              {user.username}
            </ThemedText>
          </ThemedView>
        </ThemedView>
      );
    }
    return null;
  }, [handleSettingsPress, isOwnProfile, handleEditProfile]);

  return (
    <Screen>
      <FlashList
        data={listData}
        renderItem={renderItem}
        estimatedItemSize={100}
        contentContainerStyle={{ padding: 16 }}
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
    marginTop: 20,
    padding: 24,
    borderRadius: 12,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
}); 