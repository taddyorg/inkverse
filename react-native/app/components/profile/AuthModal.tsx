import React, { useState, useReducer, useEffect, useRef } from 'react';
import { 
  Modal, 
  View, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { AuthProvider } from '@inkverse/public/graphql/types';
import { isAValidEmail } from '@inkverse/public/utils';
import { 
  authReducer, 
  authInitialState, 
  dispatchLoginWithEmail,
  dispatchLoginWithGoogle,
  dispatchLoginWithApple,
  clearAuthError,
  AuthActionType
} from '@inkverse/shared-client/dispatch/authentication';
import config from '@/config';
import { ThemedView, ThemedText, ThemedButton, ThemedIcon, PressableOpacity } from '@/app/components/ui';
import { Colors, useThemeColor } from '@/constants/Colors';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
}

type AuthMode = 'signup' | 'emailInput' | 'verifyEmail';

export function AuthModal({ visible, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>('signup');
  const [email, setEmail] = useState('');
  const [authState, dispatch] = useReducer(authReducer, authInitialState);
  const emailInputRef = useRef<TextInput>(null);
  
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor(
    { light: Colors.light.background, dark: Colors.dark.background },
    'background'
  );
  const errorColor = useThemeColor(
    { light: '#dc2626', dark: '#ef4444' },
    'text'
  );

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!visible) {
      setMode('signup');
      setEmail('');
      if (authState.error) {
        clearAuthError(dispatch);
      }
    } else if (mode === 'emailInput') {
      // Focus email input when entering email mode
      setTimeout(() => emailInputRef.current?.focus(), 100);
    }
  }, [visible, mode]);

  // Handle successful authentication
  useEffect(() => {
    if (authState.isAuthenticated && authState.user) {
      onClose();
    }
  }, [authState.isAuthenticated, authState.user, onClose]);

  const handleEmailSubmit = async () => {
    try {
      if (!isAValidEmail(email)) {
        throw new Error('Please enter a valid email address');
      }

      await dispatchLoginWithEmail(
        { baseUrl: config.AUTH_URL, email },
        dispatch
      );

      setMode('verifyEmail');

    } catch (err: any) {
      dispatch({ type: AuthActionType.AUTH_ERROR, payload: err?.message || 'Failed to submit email' });
    }
  };

  const handleSocialLogin = async (provider: AuthProvider) => {
    try {
      if (provider === AuthProvider.GOOGLE) {
        // TODO: Implement actual Google OAuth flow
        dispatch({ type: AuthActionType.AUTH_ERROR, payload: 'Google login integration coming soon' });
      } else if (provider === AuthProvider.APPLE) {
        // TODO: Implement actual Apple OAuth flow
        dispatch({ type: AuthActionType.AUTH_ERROR, payload: 'Apple login integration coming soon' });
      }
    } catch (err: any) {
      // Error is handled by the dispatch function
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <TouchableOpacity 
          style={styles.backdropTouch}
          activeOpacity={1}
          onPress={onClose}
        />
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <ThemedView style={[styles.modalContent, { backgroundColor }]}>
            {/* Close button */}
            <PressableOpacity 
              onPress={onClose}
              style={styles.closeButton}
            >
              <ThemedIcon size="medium">
                <FontAwesome5 name="times" />
              </ThemedIcon>
            </PressableOpacity>

            {/* Back button - shown in email input mode */}
            {mode === 'emailInput' && (
              <PressableOpacity
                onPress={() => {
                  setMode('signup');
                  clearAuthError(dispatch);
                }}
                style={styles.backButton}
              >
                <ThemedIcon size="medium">
                  <FontAwesome5 name="arrow-left" />
                </ThemedIcon>
              </PressableOpacity>
            )}

            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Signup Options */}
              {mode === 'signup' && (
                <>  
                  <ThemedText size="title" style={styles.title}>
                    Sign Up / Log In to Inkverse
                  </ThemedText>

                  {authState.error && (
                    <View style={[styles.errorContainer, { backgroundColor: errorColor + '20' }]}>
                      <ThemedText style={[styles.errorText, { color: errorColor }]}>
                        {authState.error}
                      </ThemedText>
                    </View>
                  )}

                  <View style={styles.buttonContainer}>
                    <TouchableOpacity
                      onPress={() => handleSocialLogin(AuthProvider.GOOGLE)}
                      disabled={authState.isLoading}
                      style={[styles.socialButton, { borderColor }]}
                    >
                      <FontAwesome5 name="google" size={20} color="#4285F4" />
                      <ThemedText style={styles.socialButtonText}>
                        Continue with Google
                      </ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleSocialLogin(AuthProvider.APPLE)}
                      disabled={authState.isLoading}
                      style={[styles.socialButton, { borderColor }]}
                    >
                      <FontAwesome5 name="apple" size={20} color={textColor} />
                      <ThemedText style={styles.socialButtonText}>
                        Continue with Apple
                      </ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        setMode('emailInput');
                        clearAuthError(dispatch);
                      }}
                      disabled={authState.isLoading}
                      style={[styles.socialButton, { borderColor }]}
                    >
                      <ThemedIcon size="small">
                        <FontAwesome5 name="envelope" />
                      </ThemedIcon>
                      <ThemedText style={styles.socialButtonText}>
                        Continue with Email
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {/* Email Input */}
              {mode === 'emailInput' && (
                <>
                  <ThemedText size="title" style={styles.title}>
                    Enter your email
                  </ThemedText>

                  {authState.error && (
                    <View style={[styles.errorContainer, { backgroundColor: errorColor + '20' }]}>
                      <ThemedText style={[styles.errorText, { color: errorColor }]}>
                        {authState.error}
                      </ThemedText>
                    </View>
                  )}

                  <TextInput
                    ref={emailInputRef}
                    style={[styles.emailInput, { color: textColor, borderColor }]}
                    placeholder="your@email.com"
                    placeholderTextColor={textColor + '80'}
                    value={email}
                    onChangeText={setEmail}
                    onSubmitEditing={handleEmailSubmit}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                  />

                  <ThemedButton
                    buttonText={authState.isLoading ? 'Sending...' : 'Submit'}
                    onPress={handleEmailSubmit}
                    disabled={authState.isLoading || !email}
                    style={[
                      styles.submitButton,
                      (authState.isLoading || !email) && styles.submitButtonDisabled
                    ]}
                  />
                </>
              )}

              {/* Verify Email */}
              {mode === 'verifyEmail' && (
                <View style={styles.verifyContainer}>
                  <ThemedText size="title" style={[styles.title, { marginBottom: 24 }]}>
                    Check your email
                  </ThemedText>
                  
                  <ThemedText style={styles.verifyText}>
                    We have sent an email to{' '}
                    <ThemedText style={styles.verifyEmail}>
                      {email}
                    </ThemedText>
                  </ThemedText>
                  
                  <ThemedText style={styles.verifyText}>
                    Click the link in the email to verify your email address.
                  </ThemedText>

                  {/* Optional: Add a resend button */}
                  <TouchableOpacity 
                    style={styles.resendButton}
                    onPress={() => {
                      setMode('emailInput');
                      clearAuthError(dispatch);
                    }}
                  >
                    <ThemedText style={[styles.resendText, { color: Colors.light.tint }]}>
                      Try a different email
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>

            {authState.isLoading && mode !== 'emailInput' && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={Colors.light.tint} />
              </View>
            )}
          </ThemedView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdropTouch: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  keyboardAvoidingView: {
    maxHeight: '90%',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingTop: 16,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    zIndex: 1,
    padding: 8,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    top: 16,
    zIndex: 1,
    padding: 8,
  },
  title: {
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 24,
  },
  errorContainer: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
  },
  buttonContainer: {
    marginTop: 8,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  legalText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 18,
  },
  legalLink: {
    textDecorationLine: 'underline',
  },
  emailInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  submitButton: {
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  verifyContainer: {
    alignItems: 'center',
    paddingTop: 20,
  },
  verifyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 24,
  },
  verifyEmail: {
    fontWeight: 'bold',
  },
  resendButton: {
    marginTop: 24,
    padding: 8,
  },
  resendText: {
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
  },
});