import { useCallback, useMemo } from 'react';
import { StyleSheet, Image } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';

import { Screen, ThemedView, ThemedText, ThemedButton } from '@/app/components/ui';
import { HeaderSettingsButton } from '@/app/components/profile/HeaderSettingsButton'
import { SETTINGS_SCREEN } from '@/constants/Navigation';

type ListItem = 
  | { type: 'screen-header'; key: string; data: undefined }
  | { type: 'header'; key: string; data: { title: string } }
  | { type: 'empty-state'; key: string; data: undefined };

export function ProfileScreen() {
  const navigation = useNavigation();
  
  const listData = useMemo((): ListItem[] => {
    return [
      { type: 'screen-header', key: 'screen-header', data: undefined },
      { type: 'empty-state', key: 'empty-state', data: undefined },
    ];
  }, []);

  const handleSettingsPress = useCallback(() => {
    navigation.navigate(SETTINGS_SCREEN);
  }, [navigation]);

  const renderItem = useCallback(({ item }: { item: ListItem }) => {
    if (item.type === 'screen-header') {
      return (
        <ThemedView style={styles.topPadding}>
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
              buttonText="Coming Soon"
              style={[styles.ctaButton, 
                { 
                  // backgroundColor: Colors.light.text,
                  opacity: 0.5 
                }
              ]}
              disabled={true}
              onPress={() => console.log('CTA pressed')}
            />
          </ThemedView>
        </ThemedView>
      );
    }
    return null;
  }, [handleSettingsPress]);

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
}); 