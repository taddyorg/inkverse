import { useEffect, memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Screen } from '@/app/components/ui';

import { getPublicApolloClient } from '@/lib/apollo';
import { loadProfileByUsername } from '@inkverse/shared-client/dispatch/profile';
import { RootStackParamList, WRAPPED_PROFILE_SCREEN, PROFILE_SCREEN, navigateToDeepLinkAndResetNavigation } from '@/constants/Navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

export interface WrappedProfileScreenParams {
  username: string;
};

export function WrappedProfileScreen() {
  const route = useRoute<NativeStackScreenProps<RootStackParamList, typeof WRAPPED_PROFILE_SCREEN>['route']>();
  const { username } = route.params;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const publicClient = getPublicApolloClient();
  
  useEffect(() => {
    const loadProfile = async () => {
      const userId = await loadProfileByUsername({ 
        publicClient, 
        username,
      });

      if (userId) {
        console.log('userId', userId);
        navigateToDeepLinkAndResetNavigation({
          navigation,
          screenName: PROFILE_SCREEN,
          screenParams: { userId }
        });
      }
    };

    loadProfile();
  }, [username, publicClient, navigation]);

  return (
    <WrappedProfileScreenWrapper>
      <View></View>
    </WrappedProfileScreenWrapper>
  );
}

interface WrappedProfileScreenWrapperProps {
  children: React.ReactNode;
}

const WrappedProfileScreenWrapper = memo(({ children }: WrappedProfileScreenWrapperProps) => {
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