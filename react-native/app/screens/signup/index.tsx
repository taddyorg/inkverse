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
import { SvgXml } from 'react-native-svg';
import { useSignupContext } from '@/app/contexts/SignupContext';
import { SIGNUP_EMAIL_SCREEN, SIGNUP_USERNAME_SCREEN } from '@/constants/Navigation';
import * as AppleAuthentication from 'expo-apple-authentication';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import config from '@/config';
import { mobileStorageFunctions } from '@/lib/auth/user';

import {
  signUpWithGoogle,
} from "react-native-credentials-manager";

export function SignupScreen() {
  const navigation = useNavigation();
  const { updateSignupData } = useSignupContext();
  const [authState, dispatch] = useReducer(authReducer, authInitialState);
  const colorScheme = useColorScheme();

  if (Platform.OS === 'ios') {
    GoogleSignin.configure({
      scopes: ['email'], // what API you want to access on behalf of the user, default is email and profile
      iosClientId: config.GOOGLE_CLIENT_ID_IOS,
    });
  }
  
  const backgroundColor = useThemeColor(
    { light: Colors.light.background, dark: Colors.dark.background },
    'background'
  );
  const textColor = useThemeColor({}, 'text');
  const errorColor = useThemeColor(
    { light: '#dc2626', dark: '#ef4444' },
    'text'
  );

  const handleGoogleLogin = async () => {
    try {
      dispatch({ type: AuthActionType.AUTH_START_PROVIDER, payload: AuthProvider.GOOGLE });
      
      // TODO: Implement actual Google OAuth flow
      if (Platform.OS === 'ios') {
        const user = await GoogleSignin.signIn();
        if (user?.data?.idToken) {
          dispatchLoginWithGoogle(
            {
              baseUrl: config.AUTH_URL,
              source: 'ios',
              googleIdToken: user.data.idToken,
              storageFunctions: mobileStorageFunctions,
              onSuccessFunction: () => {
                navigation.navigate(SIGNUP_USERNAME_SCREEN);
              }
            }, 
            dispatch
          );
        } else {
          dispatch({ type: AuthActionType.AUTH_ERROR, payload: 'Google login failed' });
        }
      } else {
        const googleCredential = await signUpWithGoogle({
          serverClientId: config.GOOGLE_CLIENT_ID_ANDROID,
          autoSelectEnabled: true,
        });

        if (googleCredential?.idToken) {
          dispatchLoginWithGoogle(
            {
              baseUrl: config.AUTH_URL,
              source: 'android',
              googleIdToken: googleCredential.idToken,
              storageFunctions: mobileStorageFunctions,
              onSuccessFunction: () => {
                navigation.navigate(SIGNUP_USERNAME_SCREEN);
              }
            },
            dispatch
          );
        } else {
          dispatch({ type: AuthActionType.AUTH_ERROR, payload: 'Google login failed' });
        }
      }

    } catch (err: any) {
      // Error is handled by the dispatch function
      dispatch({ type: AuthActionType.AUTH_ERROR, payload: err.message || 'Authentication failed' });
    }
  };

  const handleEmailSelection = () => {
    dispatch({ type: AuthActionType.AUTH_CLEAR_ERROR });
    updateSignupData({ provider: AuthProvider.EMAIL });
    navigation.navigate(SIGNUP_EMAIL_SCREEN);
  };

  const handleAppleLogin = async () => {
    if (authState.isLoading) return;
    
    try {
      dispatch({ type: AuthActionType.AUTH_START_PROVIDER, payload: AuthProvider.APPLE });
      
      const credential: AppleAuthentication.AppleAuthenticationCredential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (credential?.identityToken) {
        dispatchLoginWithApple(
          {
            baseUrl: config.AUTH_URL,
            idToken: credential.identityToken,
            storageFunctions: mobileStorageFunctions,
            onSuccessFunction: () => {
              navigation.navigate(SIGNUP_USERNAME_SCREEN);
            }
          }, 
          dispatch
        );
      } else {
        dispatch({ type: AuthActionType.AUTH_ERROR, payload: 'Apple login failed' });
      }
    } catch (e: any) {
      if (e?.code === 'ERR_REQUEST_CANCELED') {
        // handle that the user canceled the sign-in flow
        dispatch({ type: AuthActionType.AUTH_CLEAR_ERROR });
      } else {
        // handle other errors
        dispatch({ type: AuthActionType.AUTH_ERROR, payload: 'Apple login failed' });
      }
    }
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
                </View>
                <View style={styles.buttonContainer}>
                  <PressableOpacity
                    onPress={handleGoogleLogin}
                    disabled={authState.isLoading}
                    style={[
                      styles.socialButton, 
                      { borderColor: textColor },
                      isButtonLoading(AuthProvider.GOOGLE) && styles.loadingButton
                    ]}
                  >
                    <View style={styles.buttonContent}>
                      {isButtonLoading(AuthProvider.GOOGLE) ? (
                        <ActivityIndicator size="small" color={textColor} />
                      ) : (
                        <SvgXml 
                          xml={`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                                  <path fill="#EA4335" d="M5.26620003,9.76452941 C6.19878754,6.93863203 8.85444915,4.90909091 12,4.90909091 C13.6909091,4.90909091 15.2181818,5.50909091 16.4181818,6.49090909 L19.9090909,3 C17.7218182,1.14545455 15.0545455,0 12,0 C7.27006974,0 3.1977497,2.69829785 1.23999023,6.65002441 L5.26620003,9.76452941 Z"/>
                                  <path fill="#34A853" d="M16.0407269,18.0125889 C14.9509167,18.7163016 13.5660892,19.0909091 12,19.0909091 C8.86648613,19.0909091 6.21911939,17.076871 5.27698177,14.2678769 L1.23746264,17.3349879 C3.19279051,21.2936293 7.26500293,24 12,24 C14.9328362,24 17.7353462,22.9573905 19.834192,20.9995801 L16.0407269,18.0125889 Z"/>
                                  <path fill="#4A90E2" d="M19.834192,20.9995801 C22.0291676,18.9520994 23.4545455,15.903663 23.4545455,12 C23.4545455,11.2909091 23.3454545,10.5272727 23.1818182,9.81818182 L12,9.81818182 L12,14.4545455 L18.4363636,14.4545455 C18.1187732,16.013626 17.2662994,17.2212117 16.0407269,18.0125889 L19.834192,20.9995801 Z"/>
                                  <path fill="#FBBC05" d="M5.27698177,14.2678769 C5.03832634,13.556323 4.90909091,12.7937589 4.90909091,12 C4.90909091,11.2182781 5.03443647,10.4668121 5.26620003,9.76452941 L1.23999023,6.65002441 C0.43658717,8.26043162 0,10.0753848 0,12 C0,13.9195484 0.444780743,15.7301709 1.23746264,17.3349879 L5.27698177,14.2678769 Z"/>
                                </svg>`
                              }
                          width={22}
                          height={22}
                          style={{ marginRight: SPACING.sm }}
                        />
                      )}
                      <ThemedText style={styles.buttonText} size="subtitle">
                        {isButtonLoading(AuthProvider.GOOGLE) ? 'Signing in...' : 'Continue with Google'}
                      </ThemedText>
                    </View>
                  </PressableOpacity>

                  {Platform.OS === 'ios' && (
                    <AppleAuthentication.AppleAuthenticationButton
                      buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
                      buttonStyle={
                        colorScheme === 'dark' 
                          ? AppleAuthentication.AppleAuthenticationButtonStyle.BLACK 
                          : AppleAuthentication.AppleAuthenticationButtonStyle.WHITE_OUTLINE
                      }
                      cornerRadius={5}
                      style={[
                        styles.socialButton,
                        isButtonLoading(AuthProvider.APPLE) && styles.loadingButton
                      ]}
                      onPress={handleAppleLogin}
                    />
                  )}
                  
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