import { Text, type TextProps, StyleSheet } from 'react-native';

import { useThemeColor } from '@/constants/Colors';

type ThemedTextSize = 'default' | 'title' | 'subtitle';
type ThemedTextFont = 'regular' | 'semiBold' | 'bold';

export const ThemedTextFontFamilyMap = {
  regular: 'SourceSans3-Regular',
  semiBold: 'SourceSans3-SemiBold',
  bold: 'SourceSans3-Bold',
}

export type ThemedTextProps = TextProps & {
  passedInLightColor?: string;
  passedInDarkColor?: string;
  size?: ThemedTextSize;
  font?: ThemedTextFont;
};

export function ThemedText({
  style,
  passedInLightColor,
  passedInDarkColor,
  size = 'default',
  font = 'regular',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: passedInLightColor, dark: passedInDarkColor }, 'text');

  return (
    <Text
      style={[
        { color },
        { fontFamily: ThemedTextFontFamilyMap[font] },
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
    fontWeight: '500',
    fontFamily: ThemedTextFontFamilyMap.semiBold,
  },
});