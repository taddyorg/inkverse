import { useEffect, memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';

import { Screen, ThemedActivityIndicator } from '@/app/components/ui';

import {
  RootStackParamList,
  WRAPPED_CLAIM_CREATOR_SCREEN,
  CLAIM_CREATOR_SCREEN,
  PROFILE_TAB,
  PROFILE_SCREEN,
  navigateToDeepLinkAndResetNavigation,
} from '@/constants/Navigation';

export interface WrappedClaimCreatorScreenParams {
  uuid: string;
}

export function WrappedClaimCreatorScreen() {
  const route = useRoute<NativeStackScreenProps<RootStackParamList, typeof WRAPPED_CLAIM_CREATOR_SCREEN>['route']>();
  const { uuid } = route.params;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    navigateToDeepLinkAndResetNavigation({
      navigation,
      rootTab: PROFILE_TAB,
      rootScreen: PROFILE_SCREEN,
      screenName: CLAIM_CREATOR_SCREEN,
      screenParams: { uuid },
    });
  }, [uuid, navigation]);

  return (
    <WrappedClaimCreatorScreenWrapper>
      <View style={styles.loadingContainer}>
        <ThemedActivityIndicator />
      </View>
    </WrappedClaimCreatorScreenWrapper>
  );
}

interface WrappedClaimCreatorScreenWrapperProps {
  children: React.ReactNode;
}

const WrappedClaimCreatorScreenWrapper = memo(({ children }: WrappedClaimCreatorScreenWrapperProps) => {
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
