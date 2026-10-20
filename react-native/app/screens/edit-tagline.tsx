import React, { useReducer, useState, useEffect } from 'react';
import { StyleSheet, View, TextInput } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Screen, ScreenHeader, ThemedView, ThemedText, HeaderBackButton, ThemedButton } from '../components/ui';
import { RootStackParamList, EDIT_TAGLINE_SCREEN } from '@/constants/Navigation';
import { getUserApolloClient } from '@/lib/apollo';
import { taglineReducer, taglineInitialState, submitComicSeriesTagline } from '@inkverse/shared-client/dispatch/tagline';
import { MAX_TAGLINE_LENGTH, TAGLINE_INVALID_MESSAGE, isValidTagline, normalizeTagline } from '@inkverse/public/comicseries';
import { useThemeColor } from '@/constants/Colors';
import { SPACING } from '@/constants/Spacing';

export interface EditTaglineScreenParams {
  seriesUuid: string;
  currentTagline?: string | null;
}

export function EditTaglineScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, typeof EDIT_TAGLINE_SCREEN>>();
  const { seriesUuid, currentTagline } = route.params;
  const [tagline, setTagline] = useState(currentTagline ?? '');
  const [taglineState, dispatch] = useReducer(taglineReducer, taglineInitialState);

  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({ light: 'rgba(64, 59, 81, 0.3)', dark: 'rgba(247, 247, 247, 0.2)' }, 'icon');
  const errorColor = useThemeColor({ light: '#dc2626', dark: '#ef4444' }, 'text');

  // Go back once the tagline is saved
  useEffect(() => {
    if (taglineState.success) { navigation.goBack(); }
  }, [taglineState.success]);

  const isUnchanged = normalizeTagline(tagline) === normalizeTagline(currentTagline ?? '');
  const hasInvalidFormat = tagline.trim() !== '' && !isValidTagline(tagline);
  const errorMessage = hasInvalidFormat ? TAGLINE_INVALID_MESSAGE : taglineState.error;
  const isSaveDisabled = isUnchanged || taglineState.isSubmitting || hasInvalidFormat;

  const handleSave = () => {
    const userClient = getUserApolloClient();
    if (!userClient || isUnchanged || hasInvalidFormat) return;
    submitComicSeriesTagline({ userClient, seriesUuid, tagline }, dispatch);
  };

  return (
    <Screen>
      <View>
        <HeaderBackButton onPress={() => navigation.goBack()} />
      </View>
      <ScreenHeader />
      <ThemedView style={styles.container}>
        <ThemedText size="subtitle" style={styles.headerTitle}>
          Edit Your Tagline
        </ThemedText>
        <ThemedText style={styles.helperText}>
          In 1 to 3 words, what is this comic? It shows under the cover, e.g. "Romance • Comedy".
        </ThemedText>

        <TextInput
          value={tagline}
          onChangeText={setTagline}
          placeholder="Romance • Comedy"
          placeholderTextColor={textColor + '80'}
          maxLength={MAX_TAGLINE_LENGTH}
          autoFocus={true}
          returnKeyType="done"
          onSubmitEditing={handleSave}
          editable={!taglineState.isSubmitting}
          style={[styles.input, { color: textColor, borderColor }]}
        />
        <ThemedText style={styles.counterText}>
          {tagline.length}/{MAX_TAGLINE_LENGTH}
        </ThemedText>

        {errorMessage && (
          <View style={[styles.errorContainer, { backgroundColor: errorColor + '20' }]}>
            <ThemedText style={[styles.errorText, { color: errorColor }]}>
              {errorMessage}
            </ThemedText>
          </View>
        )}

        <View style={styles.submitButtonContainer}>
          <ThemedButton
            buttonText={taglineState.isSubmitting ? 'Saving...' : 'Save'}
            onPress={handleSave}
            style={[styles.submitButton, isSaveDisabled && styles.disabledButton]}
            disabled={isSaveDisabled}
          />
        </View>
      </ThemedView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.md,
  },
  headerTitle: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
  helperText: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  input: {
    borderWidth: 1,
    borderRadius: SPACING.md,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.md,
    fontSize: 16,
  },
  counterText: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: 'right',
    marginTop: 4,
  },
  errorContainer: {
    borderRadius: SPACING.md,
    padding: SPACING.md,
    marginTop: SPACING.sm,
  },
  errorText: {
    fontSize: 14,
  },
  submitButtonContainer: {
    marginTop: 25,
    alignItems: 'center',
  },
  submitButton: {
    padding: 16,
    paddingHorizontal: 24,
    alignSelf: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
});
