import { useEffect, memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Screen, ThemedActivityIndicator } from '@/app/components/ui';

import { RootStackParamList, TRENDING_SCREEN, navigateToDeepLinkAndResetNavigation } from '@/constants/Navigation';

export function WrappedTrendingLikedScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    navigateToDeepLinkAndResetNavigation({
      navigation,
      screenName: TRENDING_SCREEN,
      screenParams: { metric: 'LIKED' }
    });
  }, [navigation]);

  return (
    <WrappedTrendingScreenWrapper>
      <View style={styles.loadingContainer}>
        <ThemedActivityIndicator />
      </View>
    </WrappedTrendingScreenWrapper>
  );
}

export function WrappedTrendingDiscussedScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    navigateToDeepLinkAndResetNavigation({
      navigation,
      screenName: TRENDING_SCREEN,
      screenParams: { metric: 'DISCUSSED' }
    });
  }, [navigation]);

  return (
    <WrappedTrendingScreenWrapper>
      <View style={styles.loadingContainer}>
        <ThemedActivityIndicator />
      </View>
    </WrappedTrendingScreenWrapper>
  );
}

interface WrappedTrendingScreenWrapperProps {
  children: React.ReactNode;
}

const WrappedTrendingScreenWrapper = memo(({ children }: WrappedTrendingScreenWrapperProps) => {
  return (
    <Screen style={styles.container}>
      {children}
    </Screen>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
