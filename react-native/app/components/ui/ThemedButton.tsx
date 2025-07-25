import * as React from 'react';
import { StyleProp, useColorScheme, TouchableOpacity, StyleSheet, TouchableOpacityProps, TextStyle } from 'react-native';

import { ThemedText, ThemedTextFontFamilyMap } from './ThemedText';
import { Colors } from '@/constants/Colors';

type ThemedButtonProps = TouchableOpacityProps & {
  buttonText: string;
  buttonTextProps?: StyleProp<TextStyle>;
  props?: StyleProp<TouchableOpacityProps>;
}

export function ThemedButton({ buttonText, onPress, style, buttonTextProps, ...props }: ThemedButtonProps) {
  const colorScheme = useColorScheme() ?? 'light';

  const backgroundColor = colorScheme === 'light' ? Colors.light.button : Colors.dark.button;
  const buttonTextColor = colorScheme === 'light' ? Colors.light.buttonText : Colors.dark.buttonText;

  return (
      <TouchableOpacity 
        onPress={onPress}
        style={[styles.button, { backgroundColor }, style]}
        {...props}
        >
        <ThemedText style={[styles.buttonText, { color: buttonTextColor }, buttonTextProps]}>
            {buttonText}
        </ThemedText>
      </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 100,
  },
  buttonText: {
    fontSize: 18,
    fontFamily: ThemedTextFontFamilyMap.semiBold,
    textAlign: 'center',
  },
  icon: {
    marginRight: 4
  }
}); 