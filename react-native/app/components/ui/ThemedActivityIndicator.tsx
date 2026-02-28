import React, { useRef, useEffect } from 'react';
import { ActivityIndicator, Animated, View, ViewStyle } from 'react-native';
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

  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles[size].container, { opacity }, style]}>
      <ActivityIndicator size={size} color={color} />
    </Animated.View>
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