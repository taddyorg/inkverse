import * as React from 'react';
import { StyleProp, useColorScheme, TouchableOpacity, StyleSheet, TouchableOpacityProps } from 'react-native';

import { ThemedText, ThemedTextFontFamilyMap } from './ThemedText';
import { Colors } from '@/constants/Colors';

type ThemedButtonProps = TouchableOpacityProps & {
  buttonText: string;
  props?: StyleProp<TouchableOpacityProps>;
}

export function ThemedButton({ buttonText, onPress, style, ...props }: ThemedButtonProps) {
  const colorScheme = useColorScheme() ?? 'light';

  const backgroundColor = colorScheme === 'light' ? Colors.light.tint : Colors.dark.tint;
  const buttonTextColor = colorScheme === 'light' ? Colors.dark.text : Colors.light.text;

  return (
      <TouchableOpacity 
        onPress={onPress}
        style={[styles.button, { backgroundColor }, style]}
        {...props}
        >
        <ThemedText style={[styles.buttonText, { color: buttonTextColor }]}>
            {buttonText}
        </ThemedText>
      </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 100,
  },
  buttonText: {
    fontSize: 18,
    fontFamily: ThemedTextFontFamilyMap.semiBold,
  },
  icon: {
    marginRight: 4
  }
}); 