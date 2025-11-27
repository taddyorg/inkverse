import React, { useState, useReducer, useEffect } from 'react';
import { StyleSheet, View, Alert, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Screen, ThemedView, ThemedText, PressableOpacity, HeaderBackButton, ThemedActivityIndicator, ThemedTextFontFamilyMap } from '@/app/components/ui';
import { useThemeColor } from '@/constants/Colors';
import { SPACING } from '@/constants/Spacing';
import { SIGNUP_PATREON_SCREEN, RootStackParamList } from '@/constants/Navigation';
import { RouteProp } from '@react-navigation/native';
import { getUserApolloClient } from '@/lib/apollo';
import { 
  userDetailsReducer, 
  userDetailsInitialState, 
  savePushToken,
  UserDetailsActionType 
} from '@inkverse/shared-client/dispatch/user-details';

export interface SignupNotificationsScreenParams {
  isReturningUser: boolean;
}

export function SignupNotificationsScreen() {
  const route = useRoute<RouteProp<{ params: SignupNotificationsScreenParams }, 'params'>>();
  const { isReturningUser } = route.params;

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [userDetailsState, dispatch] = useReducer(userDetailsReducer, userDetailsInitialState);
  const userClient = getUserApolloClient();

  // Watch for successful push token saving and navigate to next screen
  useEffect(() => {
    if (userDetailsState.pushNotificationSuccess) {
      loadNextScreen();
    }
  }, [userDetailsState.pushNotificationSuccess]);
  
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({}, 'tint');
  const errorColor = useThemeColor({}, 'error');
  const buttonTextColor = useThemeColor({}, 'buttonText');

  const handleEnableNotifications = async () => {
    dispatch({ type: UserDetailsActionType.USER_DETAILS_CLEAR_ERROR });
    
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      
      if (status === Notifications.PermissionStatus.GRANTED) {
        const tokenData = await Notifications.getExpoPushTokenAsync();
        const platform = Platform.OS;
        
        // savePushToken will dispatch PUSH_NOTIFICATION_SUCCESS on success
        // which will trigger useEffect to call loadNextScreen()
        savePushToken({
          userClient,
          fcmToken: tokenData.data,
          platform: platform
        }, dispatch);
      } else {
        // If permission denied, go to next screen anyway
        loadNextScreen();
      }
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      dispatch({ 
        type: UserDetailsActionType.PUSH_NOTIFICATION_ERROR, 
        payload: 'Failed to enable notifications' 
      });
    }
  };

  const loadNextScreen = () => {
    dispatch({ type: UserDetailsActionType.USER_DETAILS_CLEAR_ERROR });
    if (isReturningUser) {
      navigation.getParent()?.goBack();
    } else {
      navigation.navigate(SIGNUP_PATREON_SCREEN, { context: 'signup' });
    }
  };

  const handleSkip = () => {
    loadNextScreen();
  };

  return (
    <Screen>
      <View style={styles.container}>
        <ThemedView style={[styles.card, { backgroundColor }]}>
          <View style={styles.content}>
            {/* Icon */}
            <View style={[styles.iconContainer, { backgroundColor: primaryColor + '20' }]}>
              <MaterialCommunityIcons 
                name="bell-ring" 
                size={48} 
                color={primaryColor} 
                accessibilityLabel="Notification bell icon"
              />
            </View>

            {/* Title
            <ThemedText size="title" style={styles.title}>
              Enable Notifications
            </ThemedText>

            {/* Description */}
            <ThemedText size='subtitle' style={styles.description}>
              Get notified when your favorite comics release a new episode.
            </ThemedText>

            {/* Buttons */}
            {/* Error Display */}
            {userDetailsState.error && (
              <View style={[styles.errorContainer, { backgroundColor: errorColor + '20' }]}>
                <ThemedText style={[styles.errorText, { color: errorColor }]}>
                  {userDetailsState.error}
                </ThemedText>
              </View>
            )}

            <View style={styles.buttonContainer}>
              <PressableOpacity
                onPress={handleEnableNotifications}
                disabled={userDetailsState.isLoading}
                style={[
                  styles.primaryButton, 
                  { backgroundColor: primaryColor },
                  userDetailsState.isLoading && { opacity: 0.7 }
                ]}
                accessibilityLabel="Enable notifications"
                accessibilityHint="Double tap to enable push notifications"
              >
                <View style={styles.buttonContent}>
                  {userDetailsState.isLoading && (
                    <ThemedActivityIndicator 
                      size='small'
                      passedInLightColor={buttonTextColor} 
                      passedInDarkColor={buttonTextColor}
                      style={styles.loadingIndicator}
                    />
                  )}
                  <ThemedText style={[styles.primaryButtonText, { color: buttonTextColor }]}>
                    Enable Notifications
                  </ThemedText>
                </View>
              </PressableOpacity>

              <PressableOpacity
                onPress={handleSkip}
                disabled={userDetailsState.isLoading}
                style={styles.secondaryButton}
                accessibilityLabel="Skip notifications setup"
                accessibilityHint="Double tap to skip enabling notifications"
              >
                <ThemedText style={[styles.secondaryButtonText, { color: textColor }]}>
                  Skip for now
                </ThemedText>
              </PressableOpacity>
            </View>

          </View>
        </ThemedView>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
  },
  card: {
    width: '100%',
    borderRadius: SPACING.md,
    padding: SPACING.lg,
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  benefitsList: {
    width: '100%',
    marginBottom: SPACING.xl,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  benefitIcon: {
    marginRight: SPACING.sm,
    width: 24,
  },
  benefitText: {
    fontSize: 15,
    flex: 1,
    lineHeight: 20,
  },
  errorContainer: {
    width: '100%',
    padding: SPACING.sm,
    borderRadius: SPACING.xs,
    marginBottom: SPACING.md,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  buttonContainer: {
    width: '100%',
    marginBottom: SPACING.lg,
  },
  primaryButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
    fontFamily: ThemedTextFontFamilyMap.semiBold,
    minHeight: 50,
  },
  primaryButtonText: {
    fontSize: 17,
    fontFamily: ThemedTextFontFamilyMap.semiBold,
  },
  secondaryButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  secondaryButtonText: {
    fontSize: 15,
    opacity: 0.8,
  },
  privacyNote: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.6,
    lineHeight: 16,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  loadingIndicator: {
    marginLeft: SPACING.xs,
  },
});