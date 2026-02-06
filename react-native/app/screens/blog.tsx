import React, { useState, useCallback, useRef } from 'react';
import { StyleSheet, View, BackHandler } from 'react-native';
import { WebView } from 'react-native-webview';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useRoute, useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList, BLOG_SCREEN } from '@/constants/Navigation';
import { HeaderBackButton, ThemedActivityIndicator, PressableOpacity } from '@/app/components/ui';

export type BlogScreenParams = {
  url: string;
  title?: string;
};

export function BlogScreen() {
  const route = useRoute<NativeStackScreenProps<RootStackParamList, typeof BLOG_SCREEN>['route']>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const path = route.path;
  const { url } = route.params;
  const [canGoBack, setCanGoBack] = useState(false);
  const webViewRef = useRef<WebView>(null);

  // Handle hardware back button
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (canGoBack && webViewRef.current) {
          webViewRef.current.goBack();
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [canGoBack])
  );

  const handleBackPress = useCallback(() => {
    if (canGoBack && webViewRef.current) {
      webViewRef.current.goBack();
    }
  }, [canGoBack, navigation]);

  const handleClosePress = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <View style={[styles.container]}>
      <View style={styles.header}>
        {canGoBack && <HeaderBackButton onPress={handleBackPress} />}
        <View style={styles.closeButtonPosition}>
          <PressableOpacity style={styles.closeButtonVisual} onPress={handleClosePress}>
            <Ionicons name="close" size={24} color="black" />
          </PressableOpacity>
        </View>
      </View>
      <WebView
        ref={webViewRef}
        source={{ uri: url || `https://inkverse.co${path}` }}
        style={styles.webView}
        onNavigationStateChange={(navState) => setCanGoBack(navState.canGoBack)}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ThemedActivityIndicator />
          </View>
        )}
        originWhitelist={['https://']}
        allowsBackForwardNavigationGestures={true}
        mixedContentMode="compatibility"
        injectedJavaScript={`
          (function() {
            function waitForPageLoad() {
              if (document.readyState === 'complete') {
                // Ensure content is scrollable
                document.body.style.overflow = 'auto';
                document.documentElement.style.overflow = 'auto';
                
                // Fix for potential fixed positioning issues
                const fixedElements = document.querySelectorAll('*[style*="position: fixed"], *[style*="position:fixed"]');
                fixedElements.forEach(el => {
                  if (el.tagName !== 'HEADER' && el.tagName !== 'NAV') {
                    el.style.position = 'absolute';
                  }
                });
              } else {
                setTimeout(waitForPageLoad, 100);
              }
            }
            waitForPageLoad();
          })();
        `}
        nestedScrollEnabled={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonPosition: {
    position: 'absolute',
    top: 40,
    right: 16,
    zIndex: 1,
  },
  closeButtonVisual: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
  },
}); 