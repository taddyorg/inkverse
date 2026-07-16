import { Text, type TextProps, StyleSheet } from 'react-native';

import { useThemeColor } from '@/constants/Colors';

type ThemedTextSize = 'default' | 'title' | 'subtitle';

// iOS does not synthesize weight for custom font families, so `fontWeight` is
// silently ignored on any text using these fonts. Weight must be selected by
// font family instead: style={{ fontFamily: ThemedTextFontFamilyMap.semiBold }}.
export const ThemedTextFontFamilyMap = {
  regular: 'SourceSans3-Regular',
  semiBold: 'SourceSans3-SemiBold',
  bold: 'SourceSans3-Bold',
}

export type ThemedTextProps = TextProps & {
  passedInLightColor?: string;
  passedInDarkColor?: string;
  size?: ThemedTextSize;
};

export function ThemedText({
  style,
  passedInLightColor,
  passedInDarkColor,
  size = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: passedInLightColor, dark: passedInDarkColor }, 'text');

  return (
    <Text
      style={[
        { color },
        styles[size],
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    fontFamily: ThemedTextFontFamilyMap.regular,
  },
  title: {
    fontSize: 28,
    fontFamily: ThemedTextFontFamilyMap.bold,
  },
  subtitle: {
    fontSize: 20,
    fontFamily: ThemedTextFontFamilyMap.semiBold,
  },
});