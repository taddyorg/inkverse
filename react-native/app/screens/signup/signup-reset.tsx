import { useEffect, useReducer } from 'react';
import { StyleSheet } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { 
  dispatchExchangeOTPForTokens,
  authReducer,
  authInitialState,
  AuthActionType
} from '@inkverse/shared-client/dispatch/authentication';
import { Screen, ThemedView, ThemedText, PressableOpacity } from '@/app/components/ui';
import { useThemeColor } from '@/constants/Colors';
import config from '@/config';
import { RootStackParamList, SIGNUP_RESET_SCREEN, SIGNUP_USERNAME_SCREEN } from '@/constants/Navigation';
import { getUserDetails, mobileStorageFunctions } from '@/lib/auth/user';
import { getUserApolloClient } from '@/lib/apollo';
import { fetchAllHostingProviderTokens } from '@inkverse/shared-client/dispatch/hosting-provider';
import { saveHostingProviderRefreshToken, refreshHostingProviderAccessToken } from '@/lib/auth/hosting-provider';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export interface SignupResetScreenParams {
  token?: string;
}

export function SignupResetScreen() {
  const route = useRoute<NativeStackScreenProps<RootStackParamList, typeof SIGNUP_RESET_SCREEN>['route']>();
  const navigation = useNavigation();
  const [authState, dispatch] = useReducer(authReducer, authInitialState);
  
  const backgroundColor = useThemeColor({}, 'background');
  const errorColor = useThemeColor(
    { light: '#dc2626', dark: '#ef4444' },
    'text'
  );

  const textColor = useThemeColor({}, 'text');

  const onTokenSuccessfullyReceived = async () => {
    const user = await getUserDetails();
    const userClient = getUserApolloClient();
    
    await fetchAllHostingProviderTokens({ 
      userClient: userClient as any, 
      saveHostingProviderRefreshToken, 
      refreshHostingProviderAccessToken 
    })

    if (!user?.username) {
      navigation.navigate(SIGNUP_USERNAME_SCREEN);
    } else if (user) {
      // Dismiss the entire modal by navigating to parent
      navigation.getParent()?.goBack();
    }
  }

  useEffect(() => {
    const handleTokenExchange = async () => {
      const token = route.params?.token
      
      if (!token) {
        // navigation.reset({ index: 0, routes: [{ name: HOME_SCREEN }] });
        return;
      }

      dispatch({ type: AuthActionType.AUTH_START });

      try {
        await dispatchExchangeOTPForTokens(
          { 
            baseUrl: config.AUTH_URL, 
            otp: token, 
            storageFunctions: mobileStorageFunctions,
            onSuccessFunction: onTokenSuccessfullyReceived
          },
          dispatch
        );
      } catch (error: any) {
        dispatch({ type: AuthActionType.AUTH_ERROR, payload: error.message });
      }
    };

    handleTokenExchange();
  }, [route.params, navigation]);

  if (authState.error) {
    return (
      <Screen>
        <ThemedView style={styles.container}>
          {/* Close button */}
          <PressableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.closeButton}>
            <MaterialCommunityIcons name="close" size={28} color={textColor} />
          </PressableOpacity>
          <ThemedView style={[styles.card, { backgroundColor }]}>
            <ThemedText size="title" style={[styles.errorTitle, { color: errorColor }]}>
              Authentication Error
            </ThemedText>
            <ThemedText style={styles.errorMessage}>
              {authState.error}
            </ThemedText>
            {/* <ThemedButton
              buttonText="Return Home"
              onPress={() => navigation.reset({ index: 0, routes: [{ name: HOME_SCREEN }] })}
              style={styles.button}
            /> */}
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
            Logging you in...
          </ThemedText>
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
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
});