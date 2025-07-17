import React, { useEffect, useReducer } from 'react';
import { StyleSheet, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Screen, ThemedView, ThemedText } from '@/app/components/ui';
import { RootStackParamList, WRAPPED_HOSTING_PROVIDER_SCREEN } from '@/constants/Navigation';
import { Colors, useThemeColor } from '@/constants/Colors';
import { getUserApolloClient } from '@/lib/apollo';
import { 
  hostingProviderReducer, 
  hostingProviderInitialState,
  exchangeHostingProviderOAuthCode,
  HostingProviderActionType,
} from '@inkverse/shared-client/dispatch/hosting-provider';

export interface WrappedApiHostingProviderScreenParams {
  uuid: string;
  code?: string;
  error?: string;
  error_description?: string;
}

function getErrorMessage(errorParam: string, errorDescription?: string): string {
  if (errorDescription) {
    return errorDescription;
  }
  
  switch (errorParam) {
    case 'access_denied':
      return 'You denied access to your account.';
    case 'invalid_request':
      return 'Invalid request. Please try again.';
    case 'unauthorized_client':
      return 'This app is not authorized to connect.';
    case 'unsupported_response_type':
      return 'Unsupported response type.';
    case 'server_error':
      return 'The server encountered an error. Please try again later.';
    case 'temporarily_unavailable':
      return 'The service is temporarily unavailable. Please try again later.';
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

export function WrappedApiHostingProviderScreen() {
  const route = useRoute<NativeStackScreenProps<RootStackParamList, 'WrappedApiHostingProviderScreen'>['route']>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { uuid, code, error, error_description } = route.params || {};
  
  const [state, dispatch] = useReducer(hostingProviderReducer, hostingProviderInitialState);
  const userClient = getUserApolloClient();
  
  const buttonColor = useThemeColor(
    { light: Colors.light.button, dark: Colors.dark.button },
    'button'
  );

  useEffect(() => {
    handleOAuthCallback();
  }, []);

  const handleOAuthCallback = async () => {    
    // Handle error from OAuth provider
    if (error) {
      return;
    }

    // Handle success case with authorization code
    if (code && uuid) {
      // Exchange the OAuth code for tokens using GraphQL
      handleCodeExchange();
    }
  };

  const handleCodeExchange = async () => {
    if (!code || !uuid) return;
    
    const result = await exchangeHostingProviderOAuthCode(
      { userClient, hostingProviderUuid: uuid, code },
      dispatch
    );

    if (result?.success) {
      // Navigate to the hosting provider screen with success
      navigation.replace(WRAPPED_HOSTING_PROVIDER_SCREEN, {
        uuid,
        success: 'true'
      });
    }
  };

  const handleRetry = () => {
    dispatch({ type: HostingProviderActionType.FETCH_USER_TOKENS_CLEAR_ERROR });
    navigation.goBack();
  };

  const handleGoHome = () => {
    navigation.goBack();
  };

  // Handle OAuth provider errors
  if (error && !state.isExchangingCode) {
    const errorMessage = getErrorMessage(error, error_description);
    
    return (
      <Screen>
        <ThemedView style={styles.container}>
          <View style={styles.content}>
            <ThemedText style={[styles.errorTitle]}>Connection Failed</ThemedText>
            <ThemedText style={[styles.errorMessage]}>{errorMessage}</ThemedText>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={handleRetry}
                style={[styles.primaryButton, { backgroundColor: buttonColor }]}
                activeOpacity={0.8}
              >
                <ThemedText style={styles.primaryButtonText}>Try Again</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleGoHome}
                style={styles.secondaryButton}
                activeOpacity={0.8}
              >
                <ThemedText style={styles.secondaryButtonText}>Go Back</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </ThemedView>
      </Screen>
    );
  }

  // Handle GraphQL mutation errors
  if (state.error) {
    const errorMessage = getErrorMessage(state.error);
    
    return (
      <Screen>
        <ThemedView style={styles.container}>
          <View style={styles.content}>
            <ThemedText style={[styles.errorTitle]}>Connection Failed</ThemedText>
            <ThemedText style={[styles.errorMessage]}>{errorMessage}</ThemedText>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={handleRetry}
                style={[styles.primaryButton, { backgroundColor: buttonColor }]}
                activeOpacity={0.8}
              >
                <ThemedText style={styles.primaryButtonText}>Try Again</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleGoHome}
                style={styles.secondaryButton}
                activeOpacity={0.8}
              >
                <ThemedText style={styles.secondaryButtonText}>Go Back</ThemedText>
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
    color: 'white',
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