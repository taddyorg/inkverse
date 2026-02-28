import React, { useRef, useEffect } from 'react';
import { Animated, ViewStyle, StyleProp } from 'react-native';

type FadeInViewProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  duration?: number;
};

export function FadeInView({ children, style, duration = 300 }: FadeInViewProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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