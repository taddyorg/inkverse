import React, { useReducer } from 'react';
import { 
  View, 
  ScrollView,
  StyleSheet,
} from 'react-native';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
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
import { SIGNUP_EMAIL_SCREEN } from '@/constants/Navigation';

export function SignupScreen() {
  const navigation = useNavigation();
  const { updateSignupData } = useSignupContext();
  const [authState, dispatch] = useReducer(authReducer, authInitialState);
  
  const backgroundColor = useThemeColor(
    { light: Colors.light.background, dark: Colors.dark.background },
    'background'
  );
  const textColor = useThemeColor({}, 'text');
  const errorColor = useThemeColor(
    { light: '#dc2626', dark: '#ef4444' },
    'text'
  );

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

  const handleEmailSelection = () => {
    dispatch({ type: AuthActionType.AUTH_CLEAR_ERROR });
    updateSignupData({ provider: AuthProvider.EMAIL });
    navigation.navigate(SIGNUP_EMAIL_SCREEN);
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
                    onPress={() => handleSocialLogin(AuthProvider.GOOGLE)}
                    disabled={authState.isLoading}
                    style={[styles.socialButton, { borderColor: textColor }]}
                  >
                    <View style={styles.socialButtonInner}>
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
                        style={styles.socialIcon}
                        preserveAspectRatio="xMidYMid meet"
                      />
                      <ThemedText style={styles.socialButtonText} size="subtitle">
                        Continue with Google
                      </ThemedText>
                    </View>
                  </PressableOpacity>

                  <PressableOpacity
                    onPress={() => handleSocialLogin(AuthProvider.APPLE)}
                    disabled={authState.isLoading}
                    style={[styles.socialButton, { borderColor: textColor }]}
                  >
                    <View style={styles.socialButtonInner}>
                      <FontAwesome5 name="apple" size={22} style={styles.socialIcon} color={textColor} />
                      <ThemedText style={styles.socialButtonText} size="subtitle">
                        Continue with Apple
                      </ThemedText>
                    </View>
                  </PressableOpacity>

                  <PressableOpacity
                    onPress={handleEmailSelection}
                    disabled={authState.isLoading}
                    style={[styles.socialButton, { borderColor: textColor }]}
                  >
                    <View style={styles.socialButtonInner}>
                      <MaterialCommunityIcons name="email" size={22} style={styles.socialIcon} color={textColor} />
                      <ThemedText style={styles.socialButtonText} size="subtitle">
                        Continue with Email
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
  socialButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialIcon: {
    marginRight: SPACING.md - SPACING.xs,
  },
  socialButtonText: {
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