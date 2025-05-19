import { useEffect, useReducer } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useApolloClient } from '@apollo/client';
import { 
  dispatchExchangeOTPForTokens,
  authReducer,
  authInitialState,
  AuthActionType
} from '@inkverse/shared-client/dispatch/authentication';
import { Screen, ThemedView, ThemedText, ThemedButton } from '@/app/components/ui';
import { Colors, useThemeColor } from '@/constants/Colors';
import config from '@/config';
import { HOME_SCREEN, PROFILE_SETUP_USERNAME_SCREEN } from '@/constants/Navigation';

export function ResetScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const apolloClient = useApolloClient();
  const [authState, dispatch] = useReducer(authReducer, authInitialState);
  
  const backgroundColor = useThemeColor({}, 'background');
  const errorColor = useThemeColor(
    { light: '#dc2626', dark: '#ef4444' },
    'text'
  );

  useEffect(() => {
    const handleTokenExchange = async () => {
      // @ts-ignore - params may be present from deep link
      const token = route.params?.token;
      
      if (!token) {
        navigation.navigate(HOME_SCREEN);
        return;
      }

      dispatch({ type: AuthActionType.AUTH_START });

      try {
        await dispatchExchangeOTPForTokens(
          { baseUrl: config.AUTH_URL, otp: token },
          dispatch
        );
      } catch (error: any) {
        dispatch({ type: AuthActionType.AUTH_ERROR, payload: error.message });
      }
    };

    handleTokenExchange();
  }, [route.params, navigation]);

  useEffect(() => {
    if (authState.isAuthenticated && authState.user) {
      // Check if user needs to complete their profile
      if (!authState.user.username || !authState.user.ageRange) {
        navigation.navigate(PROFILE_SETUP_USERNAME_SCREEN);
      } else {
        navigation.navigate(HOME_SCREEN);
      }
    }
  }, [authState.isAuthenticated, authState.user, navigation]);

  if (authState.error) {
    return (
      <Screen>
        <ThemedView style={styles.container}>
          <ThemedView style={[styles.card, { backgroundColor }]}>
            <ThemedText size="title" style={[styles.errorTitle, { color: errorColor }]}>
              Authentication Error
            </ThemedText>
            <ThemedText style={styles.errorMessage}>
              {authState.error}
            </ThemedText>
            <ThemedButton
              buttonText="Return to Home"
              onPress={() => navigation.navigate(HOME_SCREEN)}
              style={styles.button}
            />
          </ThemedView>
        </ThemedView>
      </Screen>
    );
  }

  return (
    <Screen>
      <ThemedView style={styles.container}>
        <ThemedView style={[styles.card, { backgroundColor }]}>
          <ThemedText size="title" style={styles.title}>
            Verifying your email...
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Please wait while we verify your authentication token.
          </ThemedText>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.light.tint} />
          </View>
        </ThemedView>
      </ThemedView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    maxWidth: 400,
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  button: {
    marginTop: 16,
  },
});