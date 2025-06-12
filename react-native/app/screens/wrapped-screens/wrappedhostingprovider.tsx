import React, { useReducer, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Screen, ThemedView, ThemedText } from '@/app/components/ui';
import { getUserApolloClient } from '@/lib/apollo';
import { 
  hostingProviderReducer, 
  hostingProviderInitialState,
  fetchRefreshTokenForHostingProvider,
  clearHostingProviderError,
  FETCH_USER_TOKENS,
} from '@inkverse/shared-client/dispatch/hosting-provider';
import { 
  getHostingProviderRefreshToken, 
  refreshHostingProviderAccessToken, 
  saveHostingProviderRefreshToken 
} from '@/lib/auth/hosting-provider';
import { RootStackParamList } from '@/constants/Navigation';
import { Colors, useThemeColor } from '@/constants/Colors';
import { PubSub, PubSubEvents, HostingProviderConnectedData } from '@/lib/pubsub';

export interface WrappedHostingProviderScreenParams {
  uuid?: string;
  success?: string;
  error?: string;
}

function getErrorMessage(errorParam: string): string {
  switch (errorParam) {
    case 'missing_parameters':
      return 'Missing required parameters for connection.';
    case 'tokens_not_found':
      return 'Could not retrieve authentication tokens.';
    case 'incorrect_hosting_provider':
      return 'Incorrect hosting provider in response.';
    case 'token_invalid_or_expired':
      return 'Authentication token is invalid or expired.';
    case 'user_not_found':
      return 'User account not found.';
    case 'connection_failed':
      return 'Connection to hosting provider failed.';
    default:
      return 'Connection failed. Please try again.';
  }
}

export function WrappedHostingProviderScreen() {
  const route = useRoute<NativeStackScreenProps<RootStackParamList, 'WrappedHostingProviderScreen'>['route']>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { uuid, success, error } = route.params || {};
  
  const [state, dispatch] = useReducer(hostingProviderReducer, hostingProviderInitialState);
  const userClient = getUserApolloClient();

  useEffect(() => {
    handleOAuthCallback();
  }, []);

  const handleOAuthCallback = async () => {    
    // Handle error from URL params
    if (error) {
      const errorMessage = getErrorMessage(error);
      dispatch(FETCH_USER_TOKENS.failure({ message: errorMessage }));
      return;
    }

    // Handle success case - no need to fetch tokens if already have them
    if (success === 'true' && uuid && await getHostingProviderRefreshToken(uuid)) {
      await handleSuccessWithoutSavingTokens();
      return;
    }

    // Handle success case - fetch tokens
    if (success === 'true' && uuid && !state.isLoading && !state.refreshToken) {
      fetchRefreshTokenForHostingProvider({ userClient, hostingProviderUuid: uuid }, dispatch);
      return;
    }
  };

  useEffect(() => {
    // Handle redirect after successful connection
    if (state.refreshToken && success === 'true' && uuid) {
      handleSuccessWithSavingTokens({ token: state.refreshToken, uuid });
    }
  }, [state.refreshToken, success, uuid]);

  const handleSuccessWithoutSavingTokens = async () => {
    // Emit event that hosting provider was connected
    if (uuid) {
      PubSub.emit<HostingProviderConnectedData>(PubSubEvents.HOSTING_PROVIDER_CONNECTED, {
        hostingProviderUuid: uuid,
        success: true,
      });
    }
    
    // Go back to the previous screen
    navigation.goBack();
  };

  const handleSuccessWithSavingTokens = async ({ token, uuid }: { token: string, uuid: string }) => {
    saveHostingProviderRefreshToken(token, uuid);
    await refreshHostingProviderAccessToken(uuid);
    
    // Emit event that hosting provider was connected
    PubSub.emit<HostingProviderConnectedData>(PubSubEvents.HOSTING_PROVIDER_CONNECTED, {
      hostingProviderUuid: uuid,
      success: true,
    });
    
    // Go back to the previous screen
    navigation.goBack();
  };

  const handleRetry = async () => {
    clearHostingProviderError(dispatch);
    navigation.goBack();
  };

  const handleGoHome = () => {
    navigation.goBack();
  };

  const buttonColor = useThemeColor(
    { light: Colors.light.button, dark: Colors.dark.button },
    'button'
  );

  if (state.error) {
    return (
      <Screen>
        <ThemedView style={styles.container}>
          <View style={styles.content}>
            <ThemedText style={[styles.errorTitle]}>Connection Failed</ThemedText>
            <ThemedText style={[styles.errorMessage]}>{state.error}</ThemedText>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={handleRetry}
                style={styles.primaryButton}
                activeOpacity={0.8}
              >
                <ThemedText style={styles.primaryButtonText}>Try Again</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleGoHome}
                style={styles.secondaryButton}
                activeOpacity={0.8}
              >
                <ThemedText style={styles.secondaryButtonText}>Close</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </ThemedView>
      </Screen>
    );
  }

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
    marginBottom: 16,
    textAlign: 'center',
  },
  errorMessage: {
    marginBottom: 32,
    textAlign: 'center',
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
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  secondaryButton: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});