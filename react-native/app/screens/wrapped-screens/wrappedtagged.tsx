import { useReducer, useEffect, memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Screen, ThemedActivityIndicator, ThemedText } from '@/app/components/ui';

import { RootStackParamList, COMICS_LIST_SCREEN, WRAPPED_TAGGED_SCREEN, navigateToDeepLinkAndResetNavigation, SEARCH_SCREEN, SEARCH_TAB } from '@/constants/Navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

export interface WrappedTaggedScreenParams {
  tag: string;
};

export function WrappedTaggedScreen() {
  const route = useRoute<NativeStackScreenProps<RootStackParamList, typeof WRAPPED_TAGGED_SCREEN>['route']>();
  const { tag } = route.params;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  useEffect(() => {
    // Navigate directly to the comics list screen with the tag
    navigateToDeepLinkAndResetNavigation({
      navigation,
      rootTab: SEARCH_TAB,
      rootScreen: SEARCH_SCREEN,
      screenName: COMICS_LIST_SCREEN,
      screenParams: { pageType: 'tag', value: tag }
    });
  }, [tag, navigation]);

  return (
    <WrappedTaggedScreenWrapper>
      <View style={styles.loadingContainer}>
        <ThemedActivityIndicator />
      </View>
    </WrappedTaggedScreenWrapper>
  );
}

interface WrappedTaggedScreenWrapperProps {
  children: React.ReactNode;
}

const WrappedTaggedScreenWrapper = memo(({ children }: WrappedTaggedScreenWrapperProps) => {
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