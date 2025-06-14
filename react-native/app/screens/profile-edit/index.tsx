import React, { useEffect, useState, useReducer, useRef } from 'react';
import { View, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList, EDIT_USERNAME_SCREEN, EDIT_AGE_SCREEN, EDIT_EMAIL_SCREEN, EDIT_PATREON_SCREEN, EDIT_BLUESKY_SCREEN } from '@/constants/Navigation';
import { HeaderBackButton, ThemedRefreshControl, ThemedText, ThemedView } from '@/app/components/ui';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeColor, Colors } from '@/constants/Colors';
import { prettyAgeRange } from '@inkverse/public/user';
import { SPACING } from '@/constants/Spacing';
import { getHostingProviderAccessToken } from '@/lib/auth/hosting-provider';
import { TADDY_HOSTING_PROVIDER_UUID } from '@inkverse/public/hosting-providers';
import { jwtDecode } from 'jwt-decode';
import { getUserApolloClient } from '@/lib/apollo';
import { userDetailsReducer, userDetailsInitialState, getMeDetails } from '@inkverse/shared-client/dispatch/user-details';
import type { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { getUserDetails } from '@/lib/auth/user';

interface ProfileProperty {
  type: 'list' | 'action';
  label: string;
  value: string | null | undefined;
  navigateTo?: keyof RootStackParamList;
  navigateParams?: any;
}

export function EditProfileScreen() {
  const navigation = useNavigation();
  const userClient = getUserApolloClient();
  const userClientRef = useRef<ApolloClient<NormalizedCacheObject> | null>(null);
  userClientRef.current = userClient;

  const user = getUserDetails();
  const [userDetailsState, userDetailsDispatch] = useReducer(userDetailsReducer, userDetailsInitialState);
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  const secondaryTextColor = useThemeColor({ light: Colors.light.icon, dark: Colors.dark.icon }, 'icon');
  const borderColor = useThemeColor({ light: '#E5E5E5', dark: '#2C2C2C' }, 'icon');
  const cardBackgroundColor = useThemeColor({ light: '#FFFFFF', dark: '#1C1C1C' }, 'background');
  const [isPatreonConnected, setIsPatreonConnected] = useState(false);
  const [isBlueskyConnected, setIsBlueskyConnected] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const checkConnections = async () => {
    try {
      const accessToken = await getHostingProviderAccessToken(TADDY_HOSTING_PROVIDER_UUID);
      if (accessToken) {
        const decodedToken = jwtDecode(accessToken) as { scope: string };
        const scopes = decodedToken.scope.split(' ');
        for (const scope of scopes) {
          if (scope.startsWith('patreon')) {
            setIsPatreonConnected(true);
            break;
          }
        }
      }
    } catch (error) {
      console.error('Error checking connections:', error);
    }
  };

  const loadUserData = async ({ forceRefresh = false }: { forceRefresh?: boolean } = {}) => {
    if (!user?.id) { return; }
    try {
      if (userClientRef.current) {
        await getMeDetails({
          userClient: userClientRef.current as any,
          forceRefresh,
        }, userDetailsDispatch);
      }
      
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserData({ forceRefresh: true });
    setRefreshing(false);
  };

  useEffect(() => {
    loadUserData();
  }, []);

  // Update connections when user data changes
  useEffect(() => {
    if (userDetailsState.userData) {
      setIsBlueskyConnected(!!userDetailsState.userData.blueskyDid);
    }
  }, [userDetailsState.userData]);

  useEffect(() => {
    checkConnections();
  }, []);

  // Use user data from the reducer state
  const currentUser = userDetailsState.userData;

  if (!currentUser && !userDetailsState.isLoading) {
    return (
      <ThemedView style={styles.container}>
        <HeaderBackButton />
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>You must be logged in to edit your profile</ThemedText>
        </View>
      </ThemedView>
    );
  }

  const profileProperties: ProfileProperty[] = [
    {
      type: 'list',
      label: 'Username',
      value: currentUser?.username,
      navigateTo: EDIT_USERNAME_SCREEN,
      navigateParams: { passedInUsername: currentUser?.username },
    },
    {
      type: 'list',
      label: 'Age',
      value: prettyAgeRange(currentUser?.ageRange),
      navigateTo: EDIT_AGE_SCREEN,
      navigateParams: { passedInAgeRange: currentUser?.ageRange, passedInBirthYear: currentUser?.birthYear },
    },
    {
      type: 'list',
      label: 'Email',
      value: currentUser?.email,
      navigateTo: EDIT_EMAIL_SCREEN,
      navigateParams: { passedInEmail: currentUser?.email },
    },
    {
      type: 'list',
      label: 'Patreon',
      value: isPatreonConnected ? 'Connected' : 'Not Connected',
      navigateTo: EDIT_PATREON_SCREEN,
      navigateParams: { context: 'profile' },
    },
    {
      type: 'list',
      label: 'Bluesky',
      value: isBlueskyConnected ? 'Connected' : 'Not Connected',
      navigateTo: EDIT_BLUESKY_SCREEN,
      navigateParams: { context: 'profile' },
    },
  ];

  const renderProperty = (property: ProfileProperty, index: number) => {
    const isFirst = index === 0;
    const isLast = index === profileProperties.length - 1;
    
    return (
      <TouchableOpacity
        key={property.label}
        onPress={() => {
          if (property.navigateTo) {
            navigation.navigate(property.navigateTo as any, property.navigateParams || {});
          }
        }}
        style={[
          styles.propertyRow,
          {
            backgroundColor: cardBackgroundColor,
            borderTopWidth: isFirst ? 1 : 0,
            borderTopColor: isFirst ? borderColor : undefined,
            borderBottomWidth: 1,
            borderBottomColor: borderColor,
            borderTopLeftRadius: isFirst ? 12 : 0,
            borderTopRightRadius: isFirst ? 12 : 0,
            borderBottomLeftRadius: isLast ? 12 : 0,
            borderBottomRightRadius: isLast ? 12 : 0,
          }
        ]}
      >
        <View style={styles.propertyContent}>
          <ThemedText style={styles.propertyLabel}>
            {property.label}
          </ThemedText>
          {property.label === 'Email' && currentUser?.isEmailVerified === false && (
            <ThemedText style={[styles.verificationText, { color: secondaryTextColor }]}>
              Not verified
            </ThemedText>
          )}
        </View>
        <View style={styles.propertyValueContainer}>
          <ThemedText style={[styles.propertyValue, { color: secondaryTextColor }]}>
            {property.value || 'Not set'}
          </ThemedText>
          <MaterialCommunityIcons name="chevron-right" size={20} color={secondaryTextColor} style={styles.chevron} />
        </View>
      </TouchableOpacity>
    );
  };

  if (userDetailsState.isLoading) {
    return (
      <ThemedView style={styles.container}>
        <HeaderBackButton />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={textColor} />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <HeaderBackButton />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <ThemedRefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
          />
        }
      >
        <View style={styles.section}>
          {profileProperties.map((property, index) => renderProperty(property, index))}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingTop: 80,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  section: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
  },
  propertyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    minHeight: 60,
  },
  propertyContent: {
    flex: 1,
    marginRight: SPACING.md,
  },
  propertyLabel: {
    fontSize: 17,
    fontWeight: '400',
  },
  verificationText: {
    fontSize: 14,
    marginTop: 2,
  },
  propertyValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  propertyValue: {
    fontSize: 17,
    marginRight: SPACING.xs,
  },
  chevron: {
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
  },
});