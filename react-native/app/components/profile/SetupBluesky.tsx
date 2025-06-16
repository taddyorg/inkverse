import React from 'react';
import { View, StyleSheet, TextInput, ActivityIndicator, Image } from 'react-native';
import { type UserDetailsState } from '@inkverse/shared-client/dispatch/user-details';
import { ThemedText, PressableOpacity, ThemedTextFontFamilyMap } from '@/app/components/ui';
import { Colors, useThemeColor } from '@/constants/Colors';
import { SPACING } from '@/constants/Spacing';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface SetupBlueskyProps {
  blueskyHandle: string;
  setBlueskyHandle: (handle: string) => void;
  userDetailsState: UserDetailsState;
  currentStep: 'bluesky' | 'bluesky-verify';
  onVerify: () => Promise<void>;
  onConfirm: (did: string) => Promise<void>;
  onBack: () => void;
  onSkip: () => void;
  mode?: 'setup' | 'settings';
}

export function SetupBluesky({ 
  blueskyHandle, 
  setBlueskyHandle, 
  userDetailsState, 
  currentStep,
  onVerify,
  onConfirm,
  onBack, 
  onSkip,
  mode = 'setup'
}: SetupBlueskyProps) {
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor(
    { light: Colors.light.text, dark: Colors.dark.text },
    'text'
  );
  const errorColor = useThemeColor(
    { light: '#dc2626', dark: '#ef4444' },
    'text'
  );
  const primaryColor = useThemeColor({}, 'button');
  const buttonTextColor = useThemeColor({}, 'buttonText');
  const cardBackgroundColor = useThemeColor(
    { light: '#f5f5f5', dark: '#1a1a1a' },
    'background'
  );

  if (currentStep === 'bluesky') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <ThemedText size="title" style={styles.title}>
            Connect with Bluesky
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Find Inkverse creators that you follow on Bluesky
          </ThemedText>
        </View>

        <View style={styles.form}>
          <ThemedText style={styles.label}>
            Enter your Bluesky handle
          </ThemedText>
          <TextInput
            style={[
              styles.input,
              { 
                color: textColor, 
                backgroundColor: backgroundColor,
                borderColor: borderColor 
              }
            ]}
            value={blueskyHandle}
            onChangeText={setBlueskyHandle}
            placeholder="bsky.app/profile/yourhandle"
            placeholderTextColor={textColor + '80'}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="default"
          />

          {userDetailsState.error && (
            <View style={[styles.errorContainer, { backgroundColor: errorColor + '20' }]}>
              <ThemedText style={[styles.errorText, { color: errorColor }]}>
                {userDetailsState.error}
              </ThemedText>
            </View>
          )}

          <PressableOpacity
            onPress={onVerify}
            disabled={userDetailsState.isLoading || !blueskyHandle.trim()}
            style={[
              styles.button,
              { backgroundColor: primaryColor },
              (userDetailsState.isLoading || !blueskyHandle.trim()) && styles.buttonDisabled
            ]}
          >
            {userDetailsState.isLoading ? (
              <ActivityIndicator size="small" color={buttonTextColor} />
            ) : (
              <ThemedText style={[styles.buttonText, { color: buttonTextColor, fontFamily: ThemedTextFontFamilyMap.semiBold }]}>
                Continue
              </ThemedText>
            )}
          </PressableOpacity>

          {mode === 'setup' && (
            <PressableOpacity onPress={onSkip} style={styles.skipButton}>
              <ThemedText style={styles.skipText}>
                Skip for now
              </ThemedText>
            </PressableOpacity>
          )}
        </View>
      </View>
    );
  }

  if (currentStep === 'bluesky-verify') {
    const profile = userDetailsState.blueskyProfile;
    
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <ThemedText size="title" style={styles.title}>
            Confirm Your Bluesky Account
          </ThemedText>
        </View>

        {profile && (
          <View style={[styles.profileCard, { backgroundColor: cardBackgroundColor }]}>
            <View style={styles.profileHeader}>
              {profile.avatar ? (
                <Image 
                  source={{ uri: profile.avatar }} 
                  style={styles.avatar}
                />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: borderColor }]}>
                  <MaterialCommunityIcons 
                    name="account" 
                    size={32} 
                    color={textColor + '80'} 
                  />
                </View>
              )}
              <View style={styles.profileInfo}>
                <ThemedText size='subtitle'>
                  {profile.displayName || profile.handle}
                </ThemedText>
                <ThemedText style={styles.profileHandle}>
                  @{profile.handle}
                </ThemedText>
              </View>
            </View>
            
            {profile.description && (
              <ThemedText style={styles.profileDescription}>
                {profile.description}
              </ThemedText>
            )}
          </View>
        )}

        <View style={styles.buttonRow}>
          <PressableOpacity
            onPress={onBack}
            style={[
              styles.secondaryButton,
              { borderColor: borderColor }
            ]}
          >
            <ThemedText style={styles.secondaryButtonText} font="semiBold">
              No, go back
            </ThemedText>
          </PressableOpacity>
          
          <PressableOpacity
            onPress={() => profile && onConfirm(profile.did)}
            disabled={userDetailsState.isLoading}
            style={[
              styles.primaryButton,
              { backgroundColor: primaryColor },
              userDetailsState.isLoading && styles.buttonDisabled
            ]}
          >
            {userDetailsState.isLoading ? (
              <ActivityIndicator size="small" color={buttonTextColor} />
            ) : (
              <ThemedText style={[styles.buttonText, { color: buttonTextColor, fontFamily: ThemedTextFontFamilyMap.semiBold }]}>
                Yes, that's me!
              </ThemedText>
            )}
          </PressableOpacity>
        </View>

        {userDetailsState.error && (
          <View style={[styles.errorContainer, { backgroundColor: errorColor + '20' }]}>
            <ThemedText style={[styles.errorText, { color: errorColor }]}>
              {userDetailsState.error}
            </ThemedText>
          </View>
        )}
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.lg,
    marginTop: 80,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: SPACING.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: SPACING.sm,
    padding: SPACING.md,
    fontSize: 16,
    marginBottom: SPACING.md,
  },
  button: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
  },
  skipButton: {
    marginTop: SPACING.md,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 14,
  },
  errorContainer: {
    padding: SPACING.md,
    borderRadius: SPACING.sm,
    marginBottom: SPACING.md,
  },
  errorText: {
    fontSize: 14,
  },
  profileCard: {
    padding: SPACING.lg,
    borderRadius: SPACING.md,
    marginBottom: SPACING.xl,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: SPACING.md,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    marginBottom: SPACING.xs,
  },
  profileHandle: {
    fontSize: 14,
  },
  profileDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 100,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  secondaryButtonText: {
    fontSize: 16,
  },
  primaryButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
});