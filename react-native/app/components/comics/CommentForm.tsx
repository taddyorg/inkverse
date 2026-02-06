import React, { useState } from 'react';
import { StyleSheet, TextInput, View, useColorScheme } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ThemedText, ThemedButton, PressableOpacity } from '@/app/components/ui';
import { Colors, useThemeColor } from '@/constants/Colors';
import { RootStackParamList, SIGNUP_SCREEN } from '@/constants/Navigation';

interface CommentFormProps {
  onSubmit: (text: string) => Promise<void>;
  isSubmitting: boolean;
  isAuthenticated: boolean;
  placeholder?: string;
  initialText?: string;
  onCancel?: () => void;
  isReply?: boolean;
  isEdit?: boolean;
}

export function CommentForm({
  onSubmit,
  isSubmitting,
  isAuthenticated,
  placeholder = 'Write a comment...',
  initialText = '',
  onCancel,
  isReply = false,
  isEdit = false,
}: CommentFormProps) {
  const [text, setText] = useState(initialText);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const colorScheme = useColorScheme() ?? 'light';

  const actionColor = colorScheme === 'light' ? Colors.light.action : Colors.dark.icon;
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({ light: '#FFFFFF', dark: '#1F293740' }, 'background');
  const borderColor = useThemeColor({ light: 'rgba(64, 59, 81, 0.3)', dark: 'rgba(247, 247, 247, 0.2)' }, 'icon');
  const placeholderColor = useThemeColor({ light: '#9CA3AF', dark: '#6B7280' }, 'text');

  const handleSubmit = async () => {
    if (!text.trim() || isSubmitting) return;
    await onSubmit(text.trim());
    setText('');
  };

  const handleSignIn = () => {
    navigation.navigate(SIGNUP_SCREEN);
  };

  // Show sign-in prompt for unauthenticated users
  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <PressableOpacity onPress={handleSignIn} style={[styles.signInButton, { borderColor }]}>
          <ThemedText style={styles.signInText}>Sign in to comment...</ThemedText>
        </PressableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor={placeholderColor}
        multiline
        editable={!isSubmitting}
        style={[
          styles.textInput,
          {
            backgroundColor,
            borderColor,
            color: textColor,
          },
        ]}
      />
      <View style={styles.buttonsRow}>
        {onCancel && (
          <PressableOpacity onPress={onCancel} style={styles.cancelButton}>
            <ThemedText style={styles.cancelText}>Cancel</ThemedText>
          </PressableOpacity>
        )}
        <ThemedButton
          buttonText={isSubmitting ? 'Posting...' : isReply ? 'Reply' : isEdit ? 'Save' : 'Add comment'}
          onPress={handleSubmit}
          disabled={!text.trim() || isSubmitting}
          style={[
            styles.submitButton,
            { backgroundColor: actionColor },
            (!text.trim() || isSubmitting) && styles.disabledButton,
          ]}
          buttonTextProps={{ color: Colors.dark.text, ...styles.submitButtonText }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textInput: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 12,
    minHeight: 100,
    fontSize: 15,
    textAlignVertical: 'top',
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 10,
    gap: 10,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  cancelText: {
    fontSize: 15,
  },
  submitButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  submitButtonText: {
    fontSize: 15,
  },
  disabledButton: {
    opacity: 0.5,
  },
  signInButton: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    minHeight: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInText: {
    fontSize: 15,
    opacity: 0.6,
  },
});
