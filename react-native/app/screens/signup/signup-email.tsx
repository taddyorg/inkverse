import React, { useState, useReducer, useRef, useEffect } from 'react';
import { 
  View, 
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  AppState,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { isAValidEmail } from '@inkverse/public/utils';
import { 
  authReducer, 
  authInitialState, 
  dispatchLoginWithEmail,
  AuthActionType
} from '@inkverse/shared-client/dispatch/authentication';
import config from '@/config';
import { ThemedView, ThemedText, ThemedButton, PressableOpacity, HeaderBackButton } from '@/app/components/ui';
import { Colors, useThemeColor } from '@/constants/Colors';
import { SPACING } from '@/constants/Spacing';
import { SIGNUP_RESET_SCREEN } from '@/constants/Navigation';

function getOTP(url: string): string | null {
  try {
    const parsedUrl = new URL(url);
    
    // Check if it's the correct domain and path
    if (parsedUrl.hostname === 'inkverse.co' && parsedUrl.pathname === '/reset') {
      // Extract the token from the search parameters
      return parsedUrl.searchParams.get('token');
    }
    
    return null;
  } catch (error) {
    // If URL parsing fails, return null
    return null;
  }
}

export function SignupEmailScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [link, setLink] = useState('');
  const [mode, setMode] = useState<'enter-email' | 'check-email'>('enter-email');
  const [authState, dispatch] = useReducer(authReducer, authInitialState);
  const [isFocused, setIsFocused] = useState(false);
  const [hasReturnedToApp, setHasReturnedToApp] = useState(false);
  const emailInputRef = useRef<TextInput>(null);
  
  const backgroundColor = useThemeColor(
    { light: Colors.light.background, dark: Colors.dark.background },
    'background'
  );

  const buttonBackgroundColor = useThemeColor(
    { light: Colors.light.button, dark: Colors.dark.button },
    'button'
  );

  const textColor = useThemeColor({}, 'text');
  const errorColor = useThemeColor(
    { light: '#dc2626', dark: '#ef4444' },
    'text'
  );

  useEffect(() => {
    setTimeout(() => emailInputRef.current?.focus(), 100);
  }, []);

  useEffect(() => {
    if (mode === 'check-email') {
      const handleAppStateChange = (nextAppState: string) => {
        if (nextAppState === 'active') {
          setHasReturnedToApp(true);
        }
      };

      const subscription = AppState.addEventListener('change', handleAppStateChange);
      
      return () => {
        subscription?.remove();
      };
    }
  }, [mode]);

  const updateEmailState = (email: string) => {
    if (authState.error) {
      dispatch({ type: AuthActionType.AUTH_CLEAR_ERROR });
    }
    setEmail(email);
  };

  const handleEmailSubmit = async () => {
    try {
      if (!isAValidEmail(email)) {
        throw new Error('Please enter a valid email address');
      }
      
      await dispatchLoginWithEmail(
        { baseUrl: config.AUTH_URL, email },
        dispatch
      );

      setMode('check-email');

    } catch (err: any) {
      dispatch({ type: AuthActionType.AUTH_ERROR, payload: err?.message || 'Failed to submit email' });
    }
  };

  const onLinkTextChanged = (text: string) => {
    setLink(text);
    const otp = getOTP(text);
    if (otp) {
      onOTPReceived(otp);
    }
  };

  const onOTPReceived = (otp: string) => {
    // Navigate to signup-reset screen with the OTP token
    (navigation as any).navigate(SIGNUP_RESET_SCREEN, { token: otp });
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
      {mode === 'check-email' && (
        <View style={styles.centerContent}>
          {hasReturnedToApp && (
            <HeaderBackButton />
          )}
          <ThemedText size="title" style={styles.centerTitle}>
            {email ? `We have sent an email to ${email}` : 'We have sent an email to you'}
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Click the link in the email to verify your email address.
          </ThemedText>
          {hasReturnedToApp && (
            <>
              <ThemedText style={[styles.smallerSubtitle, { marginTop: SPACING.lg }]}>
                If the link did not open inside this app, you can copy and paste the link here:
              </ThemedText>
              <TextInput
                style={[styles.emailInput, { borderColor: textColor, color: textColor }]}
                value={link}
                onChangeText={onLinkTextChanged}
                placeholder="https://inkverse.co/..."
                keyboardType="url"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </>
          )}
        </View>
      )}

      {mode === 'enter-email' && (
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <ThemedView style={styles.content}>
              {/* Back button */}
              <PressableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <MaterialCommunityIcons name="arrow-left" size={24} color={textColor} />
              </PressableOpacity>

              {/* Close button */}
              {/* <PressableOpacity 
                onPress={() => navigation.getParent()?.goBack()}
                style={styles.closeButton}
                accessibilityRole="button"
                accessibilityLabel="Close signup flow"
              >
                <MaterialCommunityIcons name="close" size={28} color={textColor} />
              </PressableOpacity> */}

              <ThemedText size="title" style={styles.title}>
                Enter your email
              </ThemedText>

              <TextInput
                ref={emailInputRef}
                style={[
                  styles.emailInput, 
                  { color: textColor, borderColor: textColor }
                ]}
                placeholder="your@email.com"
                value={email}
                onChangeText={updateEmailState}
                onSubmitEditing={handleEmailSubmit}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                accessible={true}
              />

              <ThemedButton
                buttonText={authState.isLoading ? 'Sending...' : 'Submit'}
                onPress={handleEmailSubmit}
                disabled={authState.isLoading || !email}
                style={[
                  styles.submitButton,
                  { backgroundColor: buttonBackgroundColor },
                  (authState.isLoading || !email) && styles.submitButtonDisabled
                ]}
              />

              {authState.error && (
                <View style={[styles.errorContainer, { backgroundColor: errorColor + '20' }]}>
                  <ThemedText style={[styles.errorText, { color: errorColor }]}>
                    {authState.error}
                  </ThemedText>
                </View>
              )}
            </ThemedView>

          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
    marginHorizontal: SPACING.md,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.md,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingTop: SPACING.xxl + SPACING.xl,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 400,
  },
  backButton: {
    position: 'absolute',
    top: SPACING.xl,
    zIndex: 1,
    padding: SPACING.sm,
  },
  closeButton: {
    position: 'absolute',
    right: SPACING.xs,
    top: SPACING.xl,
    zIndex: 1,
  },
  title: {
    textAlign: 'center',
    marginTop: SPACING.xxl + SPACING.xl,
    marginBottom: SPACING.xl,
    fontSize: 24,
    fontWeight: '600',
  },
  centerTitle: {
    textAlign: 'center',
    marginBottom: SPACING.md,
    fontSize: 22,
    fontWeight: '600',
  },
  errorContainer: {
    borderRadius: SPACING.sm,
    padding: SPACING.md - SPACING.xs,
    marginBottom: SPACING.md,
    alignContent: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: SPACING.md,
  },
  errorText: {
    fontSize: 14,
  },
  emailInput: {
    borderWidth: 1,
    borderRadius: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md - SPACING.xs,
    fontSize: 16,
    marginBottom: SPACING.md,
    width: '100%',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 24,
  },
  smallerSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  submitButton: {
    marginTop: SPACING.sm,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
});