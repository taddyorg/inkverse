import React, { useRef, useEffect } from 'react';
import { Animated, ViewStyle, StyleProp } from 'react-native';

type FadeInViewProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  duration?: number;
  // false renders at full opacity straight away (read once, at mount)
  fadeIn?: boolean;
};

export function FadeInView({ children, style, duration = 300, fadeIn = true }: FadeInViewProps) {
  const opacity = useRef(new Animated.Value(fadeIn ? 0 : 1)).current;

  useEffect(() => {
    if (!fadeIn) { return; }
    Animated.timing(opacity, {
      toValue: 1,
      duration,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[{ opacity, flex: 1 }, style]}>
      {children}
    </Animated.View>
  );
}