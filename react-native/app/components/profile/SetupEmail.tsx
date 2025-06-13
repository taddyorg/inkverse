import { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput } from 'react-native';
import { ThemedText, ThemedButton } from '@/app/components/ui';
import { Colors, useThemeColor } from '@/constants/Colors';
import { UserDetailsState } from '@inkverse/shared-client/dispatch/user-details';
import { SPACING } from '@/constants/Spacing';
import { isAValidEmail } from '@inkverse/public/utils';

interface SetupEmailProps {
  email: string;
  setEmail: (email: string) => void;
  userDetailsState: UserDetailsState;
  onSubmit: () => Promise<void>;
  mode?: 'setup' | 'edit';
  currentEmail?: string;
  onCancel?: () => void;
}

export function SetupEmail({
  email,
  setEmail,
  userDetailsState,
  onSubmit,
  mode = 'setup',
  currentEmail,
  onCancel,
}: SetupEmailProps) {
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState<boolean>(false);

  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor(
    { light: Colors.light.text, dark: Colors.dark.text },
    'text'
  );
  const errorColor = useThemeColor(
    { light: '#dc2626', dark: '#ef4444' },
    'text'
  );

  // Validate email in real-time
  useEffect(() => {
    if (email.trim().length === 0) {
      setValidationError(null);
      setIsValid(false);
      return;
    }

    // If in edit mode and email hasn't changed, it's valid
    if (mode === 'edit' && email.trim() === currentEmail) {
      setValidationError(null);
      setIsValid(true);
      return;
    }

    const validation = isAValidEmail(email);
    if (!validation) {
      setValidationError(null);
      return;
    }

    setValidationError(null);
    setIsValid(true);
  }, [email, mode, currentEmail]);

  const handleSubmit = async () => {
    // Don't submit if validation fails or email hasn't changed in edit mode
    if (!isValid || validationError || (mode === 'edit' && email.trim() === currentEmail)) {
      return;
    }
    
    await onSubmit();
  };

  const hasChanges = mode === 'edit' ? email.trim() !== currentEmail : true;

  return (
    <View>
      <ThemedText size="subtitle" style={styles.label} font="bold">
        {mode === 'setup' ? 'Enter your email' : 'Update your email'}
      </ThemedText>
      
      <TextInput
        style={[styles.input, { color: textColor, borderColor }]}
        value={email}
        onChangeText={setEmail}
        placeholder="Enter email address"
        placeholderTextColor={textColor + '80'}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus={true}
      />

      {/* Validation error */}
      {validationError && hasChanges && (
        <View style={[styles.errorContainer, { backgroundColor: errorColor + '20' }]}>
          <ThemedText style={[styles.errorText, { color: errorColor }]}>
            {validationError}
          </ThemedText>
        </View>
      )}

      {mode === 'edit' ? (
        <View style={styles.buttonRow}>
          <ThemedButton
            buttonText={userDetailsState.isLoading ? 'Saving...' : 'Save'}
            onPress={handleSubmit}
            disabled={userDetailsState.isLoading || !isValid || !hasChanges}
            style={styles.button}
          />
        </View>
      ) : (
        <ThemedButton
          buttonText={userDetailsState.isLoading ? 'Loading...' : 'Continue'}
          onPress={handleSubmit}
          disabled={userDetailsState.isLoading || !isValid}
          style={styles.submitButton}
        />
      )}

      {/* Server-side errors */}
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

const styles = StyleSheet.create({
  label: {
    fontSize: 16,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: SPACING.md,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.md,
    fontSize: 16,
    marginBottom: SPACING.sm,
  },
  errorContainer: {
    borderRadius: SPACING.md,
    padding: SPACING.md,
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  errorText: {
    fontSize: 14,
  },
  submitButton: {
    marginTop: SPACING.md,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  button: {
    flex: 1,
  },
  cancelButton: {
    backgroundColor: 'transparent',
  },
});