import React from 'react';
import { ActivityIndicator, View, ViewStyle } from 'react-native';
import { useThemeColor } from '@/constants/Colors';

type ThemedActivityIndicatorSize = 'small' | 'large';

export type ThemedActivityIndicatorProps = {
  passedInLightColor?: string;
  passedInDarkColor?: string;
  size?: ThemedActivityIndicatorSize;
  style?: ViewStyle;
};

interface ActivityIndicatorSizeStyle {
  container: ViewStyle;
}

export function ThemedActivityIndicator({
  passedInLightColor,
  passedInDarkColor,
  size = 'large',
  style,
}: ThemedActivityIndicatorProps) {
  const color = useThemeColor(
    { light: passedInLightColor, dark: passedInDarkColor },
    'tint'
  );

  return (
    <View style={[styles[size].container, style]}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
}

const styles: Record<ThemedActivityIndicatorSize, ActivityIndicatorSizeStyle> = {
  small: {
    container: {
      alignItems: 'center',
      justifyContent: 'center',
    },
  },
  large: {
    container: {
      alignItems: 'center',
      justifyContent: 'center',
    },
  },
}; 