import React, { useReducer } from 'react';
import { 
  View, 
  ScrollView,
  StyleSheet,
  Platform,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { AuthProvider } from '@inkverse/public/graphql/types';
import { 
  authReducer, 
  authInitialState, 
  dispatchLoginWithGoogle,
  dispatchLoginWithApple,
  AuthActionType
} from '@inkverse/shared-client/dispatch/authentication';

import { ThemedView, ThemedText, PressableOpacity } from '@/app/components/ui';
import { Colors, useThemeColor } from '@/constants/Colors';
import { SPACING } from '@/constants/Spacing';
import { useSignupContext } from '@/app/contexts/SignupContext';
import { SIGNUP_EMAIL_SCREEN, SIGNUP_USERNAME_SCREEN } from '@/constants/Navigation';

export function SignupScreen() {
  const navigation = useNavigation();
  const { updateSignupData } = useSignupContext();
  const [authState, dispatch] = useReducer(authReducer, authInitialState);
  const colorScheme = useColorScheme();
  
  const backgroundColor = useThemeColor(
    { light: Colors.light.background, dark: Colors.dark.background },
    'background'
  );
  const textColor = useThemeColor({}, 'text');
  const errorColor = useThemeColor(
    { light: '#dc2626', dark: '#ef4444' },
    'text'
  );

  const handleEmailSelection = () => {
    dispatch({ type: AuthActionType.AUTH_CLEAR_ERROR });
    updateSignupData({ provider: AuthProvider.EMAIL });
    navigation.navigate(SIGNUP_EMAIL_SCREEN);
  };

  const isButtonLoading = (provider: AuthProvider) => {
    return authState.loadingProvider === provider && authState.isLoading;
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <ThemedView style={styles.content}>
          {/* Close button */}
          <PressableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.closeButton}
          >
            <MaterialCommunityIcons name="close" size={28} color={textColor} />
          </PressableOpacity>

          <View style={{ flex: 1 }}>
            {/* Center box with title and buttons */}
            <View style={styles.centeredContentWrapper}>
              <View style={styles.centeredContent}>
                <View style={styles.titleContainer}>
                  <ThemedText size="title" style={styles.title}>
                    Sign Up / Log In to Inkverse
                  </ThemedText>
                  
                  <PressableOpacity
                    onPress={handleEmailSelection}
                    disabled={authState.isLoading}
                    style={[
                      styles.socialButton, 
                      { borderColor: textColor },
                      isButtonLoading(AuthProvider.EMAIL) && styles.loadingButton
                    ]}
                  >
                    <View style={styles.buttonContent}>
                      {isButtonLoading(AuthProvider.EMAIL) ? (
                        <ActivityIndicator size="small" color={textColor} />
                      ) : (
                        <MaterialCommunityIcons 
                          name="email" 
                          size={22} 
                          color={textColor} 
                          style={{ marginRight: SPACING.sm }}
                        />
                      )}
                      <ThemedText style={styles.buttonText} size="subtitle">
                        {isButtonLoading(AuthProvider.EMAIL) ? 'Please wait...' : 'Continue with Email'}
                      </ThemedText>
                    </View>
                  </PressableOpacity>
                </View>
              </View>
            </View>
            
            {/* Error container positioned at the bottom */}
            <View style={styles.errorContainerWrapper}>
              {authState.error && (
                <View style={[styles.errorContainer, { backgroundColor: errorColor + '20' }]}>
                  <ThemedText style={[styles.errorText, { color: errorColor }]}>
                    {authState.error}
                  </ThemedText>
                </View>
              )}
            </View>
          </View>
        </ThemedView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.sm,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingTop: SPACING.xxl + SPACING.xl,
    alignSelf: 'center',
    width: '100%',
    justifyContent: 'space-between',
    paddingBottom: SPACING.xl,
  },
  closeButton: {
    position: 'absolute',
    right: SPACING.xs,
    top: SPACING.xl,
    zIndex: 1,
  },
  titleContainer: {
    width: '100%',
    marginBottom: SPACING.xl * 1.5,
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    width: '100%',
    fontSize: 24,
    fontWeight: '600',
  },
  errorContainer: {
    borderRadius: SPACING.sm,
    padding: SPACING.md - SPACING.xs,
    alignContent: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 320,
  },
  errorText: {
    fontSize: 14,
  },
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: SPACING.sm,
    borderWidth: 1,
    marginBottom: SPACING.md,
    width: '94%',
    minHeight: 56,
  },
  loadingButton: {
    opacity: 0.5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 17,
    textAlignVertical: 'center',
  },
  centeredContentWrapper: {
    position: 'absolute',
    top: -40,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredContent: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  errorContainerWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: SPACING.xl * 2,
    alignItems: 'center',
  },
});