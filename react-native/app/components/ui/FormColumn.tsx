import React from 'react';
import { View, StyleSheet, type ViewProps, type StyleProp, type ViewStyle } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { MAX_CONTENT_WIDTH } from '@/constants/Layout';

export type FormColumnProps = ViewProps & {
  // Wrap the column in a keyboard-aware scroll view, so short windows (phone landscape) can scroll
  // and the keyboard doesn't cover the submit button
  scroll?: boolean;
  scrollContentStyle?: StyleProp<ViewStyle>;
};

// Centered column capped at the form width, so inputs and buttons don't stretch across iPad / landscape.
// Sized from the parent's width (not the window's), since modals on iPad are page sheets narrower than the window.
export function FormColumn({ scroll = false, scrollContentStyle, style, ...otherProps }: FormColumnProps) {
  const column = <View style={[styles.column, style]} {...otherProps} />;

  if (!scroll) { return column; }

  return (
    <KeyboardAwareScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.scrollContent, scrollContentStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      bottomOffset={16}
    >
      {column}
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  column: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH.form,
    alignSelf: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
