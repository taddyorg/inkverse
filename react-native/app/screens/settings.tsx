import React, { memo, useState, useRef, useReducer } from 'react';
import { StyleSheet, Platform, Appearance, useColorScheme, Switch, View, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useNavigation } from '@react-navigation/native';
import { FontAwesome5 } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';

import { PressableOpacity, Screen, ScreenHeader, ThemedView, ThemedText, ThemedIcon, HeaderBackButton, ThemedTextFontFamilyMap } from '../components/ui';
import { Colors } from '@/constants/Colors';
import { openURL, openEmail } from '@/lib/utils';
import { showShareSheet } from '@/lib/share-sheet';
import { getUserDetails } from '@/lib/auth/user';
import { getUserApolloClient } from '@/lib/apollo';
import { clearHostingProviderAuthData, flushContentTokenForProviderAndSeries, getConnectedHostingProviderUuids } from '@/lib/auth/hosting-provider';
import { getPublicApolloClient } from '@/lib/apollo';
import { asyncClear } from '@/lib/storage/async';
import { syncStorageClear } from '@/lib/storage/sync';
import { inkverseAuthClear } from '@/lib/storage/secure';
import { SIGNUP_SCREEN, EDIT_PROFILE_SCREEN } from '@/constants/Navigation';
import { emit, EventNames } from '@inkverse/shared-client/pubsub';
import { getCannySso, settingsReducer, settingsInitialState } from '@inkverse/shared-client/dispatch/settings';

export type SettingsScreenParams = undefined;

type SettingItem = {
  id: string;
  type: 'button' | 'light-dark-toggle' | 'screen-header';
  name: string;
  onPress: () => void;
};

// No longer need the SettingSection type or FlashListItem type with headers
export function SettingsScreen() {
  const navigation = useNavigation();
  const colorScheme = useColorScheme() ?? 'light';
  const [isDarkMode, setIsDarkMode] = useState(colorScheme === 'dark');
  const user = getUserDetails();
  const checkmarkOpacity = useRef(new Animated.Value(0)).current;
  const [settingsState, settingsDispatch] = useReducer(settingsReducer, settingsInitialState);
  
  // Section 1: Main settings handlers
  const updateProfilePressed = () => {
    navigation.navigate(EDIT_PROFILE_SCREEN);
  };

  const signupButtonPressed = () => {
    navigation.navigate(SIGNUP_SCREEN);
    navigation.goBack();
  };

  const addYourComicButtonPressed = () => {
    const url = 'https://taddy.org/upload-on-taddy';

    try {
      openURL({ url });
    } catch (e) {
      console.error(e);
    }
  };

  const logoutButtonPressed = async () => {
    // Implement logout functionality
    Image.clearMemoryCache();
    Image.clearDiskCache();

    // Clear AsyncStorage 
    await asyncClear();

    // Clear Inkverse Auth Data
    await inkverseAuthClear();

    // Clear hosting provider data
    const hostingProviderUuids = getConnectedHostingProviderUuids();
    hostingProviderUuids.forEach((hostingProviderUuid) => {
      clearHostingProviderAuthData(hostingProviderUuid);
    });

    // Clear content token for provider and series
    flushContentTokenForProviderAndSeries();

    //clear apollo local store
    getPublicApolloClient()?.resetStore();

    //clear apollo local store
    getUserApolloClient()?.resetStore();

    // Clear SyncStorage
    syncStorageClear();

    emit(EventNames.USER_LOGGED_OUT);

    // Go back to home
    navigation.goBack();
  };

  // Section 2: Dev mode handlers
  const clearImageCacheButtonPressed = () => {
    Image.clearMemoryCache();
    Image.clearDiskCache();
    
    // Show checkmark animation
    checkmarkOpacity.setValue(1);
    Animated.sequence([
      Animated.timing(checkmarkOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(checkmarkOpacity, {
        toValue: 0,
        duration: 200,
        delay: 500,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Section 3: About us handlers
  const rateAppButtonPressed = () => {
    // Implement rate app functionality
    const iOSAppID = "1667961953";
    const androidBundleID = 'com.bamtoons';
    
    // Primary URLs for native app stores
    const iOSAppStoreURLString = `itms-apps://itunes.apple.com/app/id${iOSAppID}?action=write-review`;
    const androidAppStoreURLString = `market://details?id=${androidBundleID}`;
    
    // Fallback URLs that open in web browser if app store doesn't open
    const iOSAppStoreFallbackURL = `https://apps.apple.com/app/id${iOSAppID}?action=write-review`;
    const androidPlayStoreFallbackURL = `https://play.google.com/store/apps/details?id=${androidBundleID}`;
    
    try {
      // First try to open the app store directly
      const url = Platform.select({ 
        ios: iOSAppStoreURLString, 
        android: androidAppStoreURLString,
      });
      
      if (!url) {
        throw new Error('No URL found');
      }

      openURL({ url }).catch(err => {
        console.log('Failed to open app store URL, trying fallback', err);
        
        // If direct app store URL fails, try the web fallback
        const fallbackUrl = Platform.select({
          ios: iOSAppStoreFallbackURL,
          android: androidPlayStoreFallbackURL,
        });
        
        if (fallbackUrl) {
          openURL({ url: fallbackUrl })
        }
      });
    } catch (e) {
      console.error('Error in rate app function:', e);
    }
  };

  const suggestFeatureButtonPressed = async () => {
    // If user is not logged in, open regular Canny URL
    if (!user) {
      try {
        openURL({ url: 'https://inkverse.canny.io' });
      } catch (e) {
        console.error(e);
      }
      return;
    }

    // If already loading, don't make another request
    if (settingsState.cannySso.isLoading) {
      return;
    }

    try {
      // Get the user Apollo client and fetch Canny SSO data
      const userClient = getUserApolloClient();
      if (!userClient) {
        throw new Error('User client not available');
      }

      const cannyData = await getCannySso({ userClient }, settingsDispatch);
      
      if (cannyData && cannyData.redirectUrl) {
        // Open the Canny SSO URL
        openURL({ url: cannyData.redirectUrl });
      }
    } catch (error) {
      console.error('Error getting Canny SSO:', error);
    }
  };

  const emailHelpButtonPressed = () => {
    // Implement email help functionality
    try {
      openEmail({ toAddress: 'danny@inkverse.com' });
    } catch (e) {
      console.error(e);
    }
  };

  const shareInkverseButtonPressed = () => {
    // Implement share functionality
    showShareSheet({ type: 'share-inkverse', item: null });
  };

  // Combine all items for the main list
  const allSettingsItems: SettingItem[] = [
    { id: 'screen-header', type: 'screen-header', name: 'Account', onPress: () => {} },
    { id: 'light-dark-toggle', type: 'light-dark-toggle', name: isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode', onPress: () => {
      const newColorScheme = colorScheme === 'light' ? 'dark' : 'light';
      setIsDarkMode(newColorScheme === 'dark');
      Appearance.setColorScheme(newColorScheme);
      AsyncStorage.setItem('userThemePreference', newColorScheme);
    }},
    ...(user 
      ? [{ id: 'update-profile', type: 'button' as const, name: '📸 Edit Your Profile', onPress: updateProfilePressed }] 
      : [{ id: 'signup', type: 'button' as const, name: '✨ Sign Up / Log In', onPress: signupButtonPressed }]),
    { id: 'rate-app', type: 'button', name: `🏅 Rate App (5 stars 🙏)`, onPress: rateAppButtonPressed },
    // { id: 'share-inkverse', type: 'button' as const, name: '🤩 Share Inkverse with your friends', onPress: shareInkverseButtonPressed },
    { id: 'add-your-comic', type: 'button', name: '✚ Publish your comic on Inkverse', onPress: addYourComicButtonPressed },
    { id: 'clear-image-cache', type: 'button', name: '🗑️ Manually clear image cache', onPress: clearImageCacheButtonPressed },
    ...(user ? [{ id: 'logout', type: 'button' as const, name: '✌️ Logout', onPress: logoutButtonPressed }] : []),
  ];

  const renderLightDarkToggle = (item: SettingItem) => {
    return (
      <ThemedView
        style={styles.settingItem}
      >
        <ThemedView style={styles.settingItemContent}>
          <ThemedText style={styles.settingText}>{item.name}</ThemedText>
          <Switch
            value={isDarkMode}
            onValueChange={(value) => {
              item.onPress();
            }}
            trackColor={{ true: Colors.dark.tint }}
            thumbColor={isDarkMode ? Colors.dark.background : Colors.light.background}
          />
        </ThemedView>
      </ThemedView>
    );
  };

  const renderScreenHeader = () => {
    return (
      <ScreenHeader />
    )
  };

  // Render setting item
  const renderSettingItem = ({ item, index }: { item: SettingItem; index: number }) => {
    if (item.type === 'light-dark-toggle') {
      return renderLightDarkToggle(item);
    } else if (item.type === 'screen-header') {
      return renderScreenHeader();
    } else {
      const isLastItem = item.id === 'logout';
      return (
        <PressableOpacity
          key={index}
          style={[styles.settingItem, isLastItem && styles.settingItemLast]}
          onPress={item.onPress}
        >
          <ThemedView style={styles.settingItemContent}>
            <ThemedText style={styles.settingText} numberOfLines={1}>
              {item.name}
            </ThemedText>
            <View style={styles.iconStack}>
              {item.id === 'clear-image-cache' ? (
                <>
                  <Animated.View style={[styles.iconAbsolute, { opacity: checkmarkOpacity }]}>
                    <ThemedIcon size="small">
                      <FontAwesome5 name="check" />
                    </ThemedIcon>
                  </Animated.View>
                  <Animated.View style={[styles.iconAbsolute, { opacity: Animated.subtract(1, checkmarkOpacity) }]}>
                    <ThemedIcon size="small">
                      <FontAwesome5 name="chevron-right" />
                    </ThemedIcon>
                  </Animated.View>
                </>
              ) : (
                <ThemedIcon size="small">
                  <FontAwesome5 name="chevron-right" />
                </ThemedIcon>
              )}
            </View>
          </ThemedView>
        </PressableOpacity>
      );
    }
  };

  // Render the support section
  const renderCombinedFooterSection = () => {

    const founderAvatar = 'https://ax0.taddy.org/general/danny-avatar-2.jpg';
    const founderDescription = "👋 Hey! I'm Danny. I'm building Inkverse to help comic fans discover amazing indie comics. What would make Inkverse even better?";
    
    return (
      <ThemedView style={styles.combinedSectionContainer}>
        {/* Founder Card */}
        <ThemedView style={styles.founderCard}>
          <Image 
            source={{ uri: founderAvatar }}
            style={styles.founderAvatar}
          />
          <View style={styles.founderContent}>
            <ThemedText style={styles.founderDescription}>
              {founderDescription}
            </ThemedText>
          </View>
        </ThemedView>

        {/* Primary CTA Button */}
        <PressableOpacity 
          style={[styles.primaryCTAButton, settingsState.cannySso.isLoading && styles.primaryCTAButtonDisabled]}
          onPress={suggestFeatureButtonPressed}
          disabled={settingsState.cannySso.isLoading}
        >
          <View style={styles.primaryCTAContent}>
            {settingsState.cannySso.isLoading 
              ? <FontAwesome5 name="spinner" solid size={18} color="#FFFFFF" style={styles.primaryCTAIcon} />
              : <FontAwesome5 name="comments" solid size={18} color="#FFFFFF" style={styles.primaryCTAIcon} />
            }
            <ThemedText style={styles.primaryCTAText}>
              Suggest an improvement
            </ThemedText>
          </View>
        </PressableOpacity>

        {/* Secondary email option */}
        <PressableOpacity onPress={emailHelpButtonPressed}>
          <ThemedText style={styles.secondaryEmailText}>
            or email me
          </ThemedText>
        </PressableOpacity>
      </ThemedView>
    );
  };

  return (
    <SettingsScreenWrapper>
      <ThemedView style={styles.contentContainer}>
        <FlashList
          data={allSettingsItems}
          renderItem={renderSettingItem}
          estimatedItemSize={50}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={renderCombinedFooterSection}
          contentContainerStyle={styles.flashListContent}
          keyExtractor={(item) => item.id}
        />
      </ThemedView>
    </SettingsScreenWrapper>
  );
}

const SettingsScreenWrapper = memo(({ children }: { children: React.ReactNode }) => {
  return (
    <Screen>
      <View>
        <HeaderBackButton />
      </View>
      {children}
    </Screen>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    borderRadius: 12,
  },
  flashListContent: {
    paddingHorizontal: 16,
  },
  settingItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 0,
  },
  settingItemLast: {
    borderBottomWidth: 0,
  },
  settingItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  settingText: {
    fontSize: 16,
    flex: 1,
    marginRight: 8,
  },
  chevronIcon: {
    // Remove alignSelf, let container handle alignment
    // alignSelf: 'center', // REMOVE THIS
    // If you want to add a right margin to all icons, do it here:
    // marginRight: 0,
  },
  iconStack: {
    width: 28, // slightly larger to match the visual space of the chevron
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 0, // match chevronIcon if it has margin
    marginRight: 0, // match chevronIcon if it has margin
  },
  iconAbsolute: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    left: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  combinedSectionContainer: {
    marginTop: 32,
    marginBottom: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  shareThoughtsHeader: {
    backgroundColor: '#3E3E3E',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  shareThoughtsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  primaryCTAButton: {
    backgroundColor: '#E85D4E',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 28,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryCTAContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  primaryCTAIcon: {
    marginBottom: 0,
  },
  primaryCTAText: {
    fontSize: 16,
    fontFamily: ThemedTextFontFamilyMap.semiBold,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  secondaryEmailText: {
    fontSize: 15,
    textAlign: 'center',
  },
  founderCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 16,
  },
  founderAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 14,
    borderWidth: 2,
    borderColor: '#fff',
  },
  founderContent: {
    flex: 1,
    paddingTop: 2,
  },
  founderDescription: {
    fontSize: 15,
    lineHeight: 21,
    opacity: 0.9,
  },
  primaryCTAButtonDisabled: {
    opacity: 0.7,
  },
});
