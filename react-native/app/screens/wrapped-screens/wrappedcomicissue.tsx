import { useReducer, useEffect, memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Screen, ThemedActivityIndicator, ThemedText } from '@/app/components/ui';

import { publicClient } from '@/lib/apollo';
import { loadComicIssueUrl, comicIssueQueryReducerDefault, comicIssueInitialState } from '@inkverse/shared-client/dispatch/comicissue';
import { RootStackParamList, WRAPPED_COMICISSUE_SCREEN, COMICISSUE_SCREEN, navigateToDeepLinkAndResetNavigation, COMICSERIES_SCREEN } from '@/constants/Navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

export interface WrappedComicIssueScreenParams {
  shortUrl: string;
  episodeId: string;
};

export function WrappedComicIssueScreen() {
  const route = useRoute<NativeStackScreenProps<RootStackParamList, typeof WRAPPED_COMICISSUE_SCREEN>['route']>();
  const { shortUrl, episodeId } = route.params;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  const [comicIssueState, dispatch] = useReducer(comicIssueQueryReducerDefault, comicIssueInitialState);

  const { isComicIssueLoading, comicissue, comicseries } = comicIssueState;

  useEffect(() => {
    loadComicIssueUrl({ publicClient, shortUrl, episodeId }, dispatch);
  }, [shortUrl, episodeId]);

  useEffect(() => {
    if (comicissue?.uuid && comicseries?.uuid) {
      navigateToDeepLinkAndResetNavigation({
        navigation,
        parentScreenName: COMICSERIES_SCREEN,
        parentScreenParams: {
          uuid: comicseries.uuid
        },
        screenName: COMICISSUE_SCREEN,
        screenParams: { 
          issueUuid: comicissue.uuid,
          seriesUuid: comicseries.uuid
        }
      });
    }
  }, [comicissue, comicseries, navigation]);

  if (isComicIssueLoading) {
    return (
      <WrappedComicIssueScreenWrapper>
        <View style={styles.loadingContainer}>
          <ThemedActivityIndicator />
        </View>
      </WrappedComicIssueScreenWrapper>
    );
  }

  if (!isComicIssueLoading && (!comicissue?.uuid || !comicseries?.uuid)) {
    return (
      <WrappedComicIssueScreenWrapper>
        <ThemedText>
          Comic issue was not found. Close this tab and try again.
        </ThemedText>
      </WrappedComicIssueScreenWrapper>
    );
  }

  return (
    <WrappedComicIssueScreenWrapper>
      <View></View>
    </WrappedComicIssueScreenWrapper>
  );
}

interface WrappedComicIssueScreenWrapperProps {
  children: React.ReactNode;
}

const WrappedComicIssueScreenWrapper = memo(({ children }: WrappedComicIssueScreenWrapperProps) => {
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