import { useEffect, memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Screen, ThemedActivityIndicator } from '@/app/components/ui';

import { RootStackParamList, WRAPPED_LIST_SCREEN, LIST_SCREEN, navigateToDeepLinkAndResetNavigation } from '@/constants/Navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

export interface WrappedListScreenParams {
  idAndName: string;
};

export function WrappedListScreen() {
  const route = useRoute<NativeStackScreenProps<RootStackParamList, typeof WRAPPED_LIST_SCREEN>['route']>();
  const { idAndName } = route.params;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  useEffect(() => {
    // Extract list ID from the shortUrl format (e.g., id9-lgbt => 9)
    if (idAndName) {
      const idMatch = idAndName.match(/^id(\d+)/);
      const id = idMatch ? idMatch[1] : idAndName;
      
      navigateToDeepLinkAndResetNavigation({
        navigation,
        screenName: LIST_SCREEN,
        screenParams: { id }
      });
    }
  }, [idAndName, navigation]);

  return (
    <WrappedListScreenWrapper>
      <View style={styles.loadingContainer}>
        <ThemedActivityIndicator />
      </View>
    </WrappedListScreenWrapper>
  );
}

interface WrappedListScreenWrapperProps {
  children: React.ReactNode;
}

const WrappedListScreenWrapper = memo(({ children }: WrappedListScreenWrapperProps) => {
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