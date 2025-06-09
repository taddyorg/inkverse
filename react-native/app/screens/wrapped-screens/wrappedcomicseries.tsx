import { useReducer, useEffect, memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Screen, ThemedActivityIndicator, ThemedText } from '@/app/components/ui';

import { getPublicApolloClient } from '@/lib/apollo';
import { loadComicSeriesUrl, comicSeriesQueryReducerDefault, comicSeriesInitialState } from '@inkverse/shared-client/dispatch/comicseries';
import { RootStackParamList, WRAPPED_COMICSERIES_SCREEN, COMICSERIES_SCREEN, navigateToDeepLinkAndResetNavigation } from '@/constants/Navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

export interface WrappedComicSeriesScreenParams {
  shortUrl: string;
};

export function WrappedComicSeriesScreen() {
  const route = useRoute<NativeStackScreenProps<RootStackParamList, typeof WRAPPED_COMICSERIES_SCREEN>['route']>();
  const { shortUrl } = route.params;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const publicClient = getPublicApolloClient();
    
  const [comicSeriesState, dispatch] = useReducer(comicSeriesQueryReducerDefault, comicSeriesInitialState);

  const { isComicSeriesLoading, comicseries } = comicSeriesState;

  useEffect(() => {
    loadComicSeriesUrl({ publicClient, shortUrl }, dispatch);
  }, [shortUrl]);

  useEffect(() => {
    if (comicseries?.uuid) {
      navigateToDeepLinkAndResetNavigation({
        navigation,
        screenName: COMICSERIES_SCREEN,
        screenParams: { uuid: comicseries.uuid }
      });
    }
  }, [comicseries, navigation]);

  if (isComicSeriesLoading) {
    return (
      <WrappedComicSeriesScreenWrapper>
        <View style={styles.loadingContainer}>
          <ThemedActivityIndicator />
        </View>
      </WrappedComicSeriesScreenWrapper>
    );
  }

  if (!isComicSeriesLoading && !comicseries?.uuid) {
    return (
      <WrappedComicSeriesScreenWrapper>
        <ThemedText>
          Comic series was not found. Close this tab and try again.
        </ThemedText>
      </WrappedComicSeriesScreenWrapper>
    );
  }

  return (
    <WrappedComicSeriesScreenWrapper>
      <View></View>
    </WrappedComicSeriesScreenWrapper>
  );
}

interface WrappedComicSeriesScreenWrapperProps {
  children: React.ReactNode;
}

const WrappedComicSeriesScreenWrapper = memo(({ children }: WrappedComicSeriesScreenWrapperProps) => {
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