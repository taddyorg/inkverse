import { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput } from 'react-native';
import { validateUsername } from '@inkverse/public/user';
import { type AuthState } from '@inkverse/shared-client/dispatch/authentication';
import { ThemedView, ThemedText, ThemedButton } from '@/app/components/ui';
import { Colors, useThemeColor } from '@/constants/Colors';
import { UserDetailsState } from '@inkverse/shared-client/dispatch/user-details';

interface SetupUsernameProps {
  username: string;
  setUsername: (username: string) => void;
  userDetailsState: UserDetailsState;
  onSubmit: () => Promise<void>;
  mode?: 'setup' | 'edit';
  currentUsername?: string;
  onCancel?: () => void;
}

export function SetupUsername({ 
  username, 
  setUsername, 
  userDetailsState, 
  onSubmit, 
  mode = 'setup', 
  currentUsername, 
  onCancel 
}: SetupUsernameProps) {
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
  const cancelButtonColor = useThemeColor(
    { light: '#6b7280', dark: '#9ca3af' },
    'text'
  );

  // Validate username in real-time
  useEffect(() => {
    if (username.trim().length === 0) {
      setValidationError(null);
      setIsValid(false);
      return;
    }

    // If in edit mode and username hasn't changed, it's valid
    if (mode === 'edit' && username.trim() === currentUsername) {
      setValidationError(null);
      setIsValid(true);
      return;
    }

    const validation = validateUsername(username);
    if (validation.hide) {
      setValidationError(null);
      return;
    }

    setValidationError(validation.error || null);
    setIsValid(validation.isValid);
  }, [username, mode, currentUsername]);

  const handleSubmit = async () => {
    // Don't submit if validation fails or username hasn't changed in edit mode
    if (!isValid || validationError || (mode === 'edit' && username.trim() === currentUsername)) {
      return;
    }
    
    await onSubmit();
  };

  const hasChanges = mode === 'edit' ? username.trim() !== currentUsername : true;

  return (
    <View>
      <ThemedText size="subtitle" style={styles.label}>
        Choose a username
      </ThemedText>
      
      <TextInput
        style={[styles.input, { color: textColor, borderColor}]}
        value={username}
        onChangeText={setUsername}
        placeholder="Enter username"
        placeholderTextColor={textColor + '80'}
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
            buttonText="Back"
            onPress={onCancel}
            style={[styles.button, styles.cancelButton]}
          />
          <ThemedButton
            buttonText={userDetailsState.isLoading ? 'Saving...' : 'Save Changes'}
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
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  errorContainer: {
    borderRadius: 16,
    padding: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
  },
  submitButton: {
    marginTop: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
});