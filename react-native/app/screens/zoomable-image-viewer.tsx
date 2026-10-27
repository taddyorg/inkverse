import { useCallback, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { PressableOpacity, ZoomableImage } from '@/app/components/ui';
import { RootStackParamList, ZOOMABLE_IMAGE_VIEWER_SCREEN } from '@/constants/Navigation';
import { useAnalytics } from '@/lib/analytics';
import { SPACING } from '@/constants/Spacing';

// Generic so any artwork (covers, banners, avatars) can open full screen
export interface ZoomableImageViewerScreenParams {
  imageUrl: string;
  // A smaller, already-cached version of the same image shown until `imageUrl` loads
  placeholderUrl?: string;
  accessibilityLabel?: string;
}

export function ZoomableImageViewerScreen() {
  const route = useRoute<NativeStackScreenProps<RootStackParamList, typeof ZOOMABLE_IMAGE_VIEWER_SCREEN>['route']>();
  const { imageUrl, placeholderUrl, accessibilityLabel } = route.params;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const analytics = useAnalytics();

  useEffect(() => {
    analytics.screen('Zoomable Image Viewer', { imageUrl });
  }, [imageUrl]);

  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar hidden />
      <ZoomableImage
        source={imageUrl}
        placeholder={placeholderUrl}
        accessibilityLabel={accessibilityLabel}
        onDismiss={handleClose}
      />
      <View style={[styles.closeButtonPosition, { top: insets.top + SPACING.md, right: Math.max(SPACING.md, insets.right + SPACING.sm) }]}>
        <PressableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel="Close">
          <Ionicons name="close" size={24} color="white" />
        </PressableOpacity>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  closeButtonPosition: {
    position: 'absolute',
    zIndex: 1,
  },
  closeButton: {
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
  },
});
