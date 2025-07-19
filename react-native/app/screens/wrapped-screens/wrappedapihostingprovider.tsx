import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Screen, ThemedView, ThemedText } from '@/app/components/ui';
import { RootStackParamList, WRAPPED_HOSTING_PROVIDER_SCREEN } from '@/constants/Navigation';
import { Colors, useThemeColor } from '@/constants/Colors';
import { getUserApolloClient } from '@/lib/apollo';
import { 
  fetchRefreshTokenForHostingProvider,
} from '@inkverse/shared-client/dispatch/hosting-provider';

export interface WrappedApiHostingProviderScreenParams {
  uuid: string;
  code?: string;
  error?: string;
  error_description?: string;
}

const MAX_POLLING_ATTEMPTS = 5;
const POLLING_INTERVAL = 1500;

export function WrappedApiHostingProviderScreen() {
  const route = useRoute<NativeStackScreenProps<RootStackParamList, 'WrappedApiHostingProviderScreen'>['route']>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { uuid, code, error } = route.params || {};
  
  const userClient = getUserApolloClient();
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const attemptCountRef = useRef(0);
  
  const buttonColor = useThemeColor(
    { light: Colors.light.button, dark: Colors.dark.button },
    'button'
  );
  
  const pollForTokens = async () => {
    attemptCountRef.current += 1;
    
    try {
      const refreshToken = await fetchRefreshTokenForHostingProvider(
        { userClient, hostingProviderUuid: uuid! }
      );
      
      if (refreshToken) {
        // Success - tokens are ready
        if (pollingTimeoutRef.current) {
          clearTimeout(pollingTimeoutRef.current);
        }
        navigation.replace(WRAPPED_HOSTING_PROVIDER_SCREEN, {
          uuid,
          success: 'true'
        });
      } else if (attemptCountRef.current < MAX_POLLING_ATTEMPTS) {
        // Continue polling
        pollingTimeoutRef.current = setTimeout(pollForTokens, POLLING_INTERVAL);
      } else {
        // Timeout - max attempts reached
        navigation.replace(WRAPPED_HOSTING_PROVIDER_SCREEN, {
          uuid,
          error: 'connection_failed'
        });
      }
    } catch (error) {
      navigation.replace(WRAPPED_HOSTING_PROVIDER_SCREEN, {
        uuid,
        error: 'connection_failed'
      });
    }
  };

  useEffect(() => {    
    // Handle OAuth provider errors immediately
    if (error) {
      navigation.replace(WRAPPED_HOSTING_PROVIDER_SCREEN, {
        uuid,
        error: error
      });
      return;
    }
    
    // Start polling after delay if we have code and uuid
    if (code && uuid) {
      setTimeout(() => {
        pollForTokens();
      }, 150);
    } else {
      navigation.replace(WRAPPED_HOSTING_PROVIDER_SCREEN, {
        uuid,
        error: 'missing_parameters'
      });
    }

    // Cleanup on unmount
    return () => {
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
      }
    };
  }, [uuid, code, error]);

  // Render loading state while polling
  // Navigation is handled in useEffect, so we just show loading

  return (  
    <Screen>
      <ThemedView style={styles.container}>
        <View style={styles.content}>
          <ThemedText style={[styles.title]} size="title">Connecting your account...</ThemedText>
          <ThemedText style={[styles.message]} size="subtitle">
            Please wait while we connect your account.
          </ThemedText>
          
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={buttonColor} />
          </View>
        </View>
      </ThemedView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    maxWidth: 400,
    width: '100%',
    alignItems: 'center',
  },
  title: {
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    marginBottom: 32,
    textAlign: 'center',
  },
  loadingContainer: {
    marginTop: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
    opacity: 0.8,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  secondaryButton: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});