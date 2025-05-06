import React, { memo, useState } from 'react';
import { StyleSheet, Platform, Appearance, useColorScheme, Switch, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useNavigation } from '@react-navigation/native';
import { FontAwesome5 } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';

import { PressableOpacity, Screen, ScreenHeader, ThemedView, ThemedText, ThemedIcon, HeaderBackButton } from '../components/ui';
import { Colors } from '@/constants/Colors';
import { openURL, openEmail } from '@/lib/utils';
import { showShareSheet } from '@/lib/share-sheet';

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
  
  // Section 1: Main settings handlers
  const updateProfilePressed = () => {
    // Implement profile update functionality
    console.log('Update profile pressed');
  };

  const signupButtonPressed = () => {
    // Implement signup functionality
    console.log('Signup pressed');
  };

  const addYourComicButtonPressed = () => {
    const url = 'https://taddy.org/upload-on-taddy';

    try {
      openURL({ url });
    } catch (e) {
      console.error(e);
    }
  };

  const logoutButtonPressed = () => {
    // Implement logout functionality
    Image.clearMemoryCache();
    Image.clearDiskCache();
    AsyncStorage.clear();
  };

  // Section 2: Dev mode handlers
  const clearImageCacheButtonPressed = () => {
    Image.clearMemoryCache();
    Image.clearDiskCache();
  };

  const clearTaddyTokensButtonPressed = () => {
    // Implement clear taddy tokens functionality
    console.log('Clear taddy tokens pressed');
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

  const suggestFeatureButtonPressed = () => {
    const url = 'https://inkverse.canny.io';

    try {
      openURL({ url });
    } catch (e) {
      console.error(e);
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

  // Define settings items with improved copy
  const accountItems: SettingItem[] = [
    { id: 'screen-header', type: 'screen-header', name: 'Account', onPress: () => {} },
    { id: 'light-dark-toggle', type: 'light-dark-toggle', name: isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode', onPress: () => {
      const newColorScheme = colorScheme === 'light' ? 'dark' : 'light';
      setIsDarkMode(newColorScheme === 'dark');
      Appearance.setColorScheme(newColorScheme);
      AsyncStorage.setItem('userThemePreference', newColorScheme);
    }},
    // { id: 'update-profile', type: 'button', name: '📸 Edit Profile', onPress: updateProfilePressed },
    // { id: 'signup', type: 'button', name: '✨ Unlock Your Profile!', onPress: signupButtonPressed },
    { id: 'add-your-comic', type: 'button', name: '✚ Publish your webtoon on Inkverse', onPress: addYourComicButtonPressed },
    { id: 'rate-app', type: 'button', name: `🏅 Rate App (5 stars 🙏)`, onPress: rateAppButtonPressed },
    // { id: 'logout', type: 'button', name: '✌️ Logout', onPress: logoutButtonPressed },
  ];

  const devItems: SettingItem[] = __DEV__
    ? [
      { id: 'clear-image-cache', type: 'button', name: '🗑 Clear Image Cache', onPress: clearImageCacheButtonPressed },
      { id: 'clear-taddy-tokens', type: 'button', name: '🗑 Clear Taddy Tokens', onPress: clearTaddyTokensButtonPressed },
    ]
    : [];

  const supportItems: SettingItem[] = [
    { id: 'email-help', type: 'button', name: '📧 Email me', onPress: emailHelpButtonPressed },
    { id: 'suggest-feature', type: 'button', name: '💡 Suggest a new feature', onPress: suggestFeatureButtonPressed },
    { id: 'share-inkverse', type: 'button', name: '🤩 Share Inkverse with your friends', onPress: shareInkverseButtonPressed },
  ];

  // const shareItems: SettingItem[] = [
  // ];

  // Combine all items for the main list
  const allSettingsItems: SettingItem[] = [
    ...accountItems,
    ...devItems,
  ];

  const founderAvatar = 'https://ax0.taddy.org/general/danny-avatar-2.jpg';
  const founderDescription = "👋 Hey! I'm Danny, the founder & developer of Inkverse. I'd love to hear your feedback!";

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
    }else if (item.type === 'screen-header') {
      return renderScreenHeader();
    } else {
      return (
        <PressableOpacity
          key={index}
          style={styles.settingItem}
          onPress={item.onPress}
        >
          <ThemedView style={styles.settingItemContent}>
            <ThemedText style={styles.settingText} numberOfLines={1}>
              {item.name}
            </ThemedText>
            <ThemedIcon size="small" style={styles.chevronIcon}>
              <FontAwesome5 name="chevron-right" />
            </ThemedIcon>
          </ThemedView>
        </PressableOpacity>
      );
    }
  };

  // Render the support section
  const renderCombinedFooterSection = () => {
    return (
      <ThemedView style={styles.combinedSectionContainer}>
        {/* Founder Card - Completely different style */}
        <ThemedView style={styles.founderCard}>
          <Image 
            source={{ uri: founderAvatar }}
            style={styles.founderAvatar}
          />
          <View style={styles.founderRightContainer}>
            <ThemedView style={styles.founderContent}>
              <ThemedText style={styles.founderDescription}>
                {founderDescription}
              </ThemedText>
            </ThemedView>
            <ThemedView style={styles.supportCardsContainer}>
            {supportItems.map((item) => (
              <PressableOpacity 
                key={item.id} 
                style={styles.supportCard}
                onPress={item.onPress}
              >
                <ThemedView style={styles.supportCardContent}>
                  <ThemedText style={styles.supportCardText}>
                    {item.name}
                  </ThemedText>
                  <ThemedIcon size="small" style={styles.supportCardArrow}>
                    <FontAwesome5 name="arrow-right" />
                  </ThemedIcon>
                </ThemedView>
              </PressableOpacity>
            ))}
            </ThemedView>    
          </View>
        </ThemedView>  
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
    alignSelf: 'center',
  },
  combinedSectionContainer: {
    marginTop: 32,
    marginBottom: 24,
    padding: 16,
  },
  founderCard: {
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  founderAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#fff',
  },
  founderRightContainer: {
    flex: 1,
    paddingTop: 2,
  },
  founderContent: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  founderName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  founderRole: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 8,
  },
  founderDescription: {
    fontSize: 16,
    paddingTop: 0,
  },
  supportSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    marginLeft: 8,
  },
  supportCardsContainer: {
    flexDirection: 'column',
    width: '100%',
    marginTop: 8,
  },
  supportCard: {
    width: '100%',
    borderRadius: 12,
    marginBottom: 6,
    paddingVertical: 2,
    // paddingHorizontal: 16,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.1,
    // shadowRadius: 2,
    // elevation: 2,
  },
  supportCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  supportCardText: {
    fontSize: 16,
    marginRight: 4,
  },
  supportCardArrow: {
    marginTop: 2,
    marginLeft: 3,
  },
});
