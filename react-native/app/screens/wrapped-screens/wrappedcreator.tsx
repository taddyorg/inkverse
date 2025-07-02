import { useReducer, useEffect, memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Screen, ThemedActivityIndicator, ThemedText } from '@/app/components/ui';

import { getPublicApolloClient } from '@/lib/apollo';
import { loadCreatorUrl, creatorReducer, creatorInitialState } from '@inkverse/shared-client/dispatch/creator';
import { RootStackParamList, WRAPPED_CREATOR_SCREEN, CREATOR_SCREEN, navigateToDeepLinkAndResetNavigation } from '@/constants/Navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

export interface WrappedCreatorScreenParams {
  shortUrl: string;
};

export function WrappedCreatorScreen() {
  const route = useRoute<NativeStackScreenProps<RootStackParamList, typeof WRAPPED_CREATOR_SCREEN>['route']>();
  const { shortUrl } = route.params;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const publicClient = getPublicApolloClient();
  
  const [creatorState, dispatch] = useReducer(creatorReducer, creatorInitialState);

  const { isLoading, creator } = creatorState;

  useEffect(() => {
    loadCreatorUrl({ publicClient, shortUrl }, dispatch);
  }, [shortUrl]);

  useEffect(() => {
    if (creator?.uuid) {
      navigateToDeepLinkAndResetNavigation({
        navigation,
        screenName: CREATOR_SCREEN,
        screenParams: { uuid: creator.uuid }
      });
    }
  }, [creator, navigation]);

  if (isLoading) {
    return (
      <WrappedCreatorScreenWrapper>
        <View style={styles.loadingContainer}>
          <ThemedActivityIndicator />
        </View>
      </WrappedCreatorScreenWrapper>
    );
  }

  if (!isLoading && !creator?.uuid) {
    return (
      <WrappedCreatorScreenWrapper>
        <ThemedText>
          Creator was not found. Close this tab and try again.
        </ThemedText>
      </WrappedCreatorScreenWrapper>
    );
  }

  return (
    <WrappedCreatorScreenWrapper>
      <View></View>
    </WrappedCreatorScreenWrapper>
  );
}

interface WrappedCreatorScreenWrapperProps {
  children: React.ReactNode;
}

const WrappedCreatorScreenWrapper = memo(({ children }: WrappedCreatorScreenWrapperProps) => {
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