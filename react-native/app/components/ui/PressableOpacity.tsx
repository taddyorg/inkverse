import React, { useRef } from "react";
import { Pressable, Animated, PressableProps } from "react-native";

type PressableOpacityProps = PressableProps & {
  fadeLevel?: number;
};

export const PressableOpacity = ({ children, fadeLevel = 0.5,  ...props }: PressableOpacityProps) => {
  const animated = useRef(new Animated.Value(1)).current;
  const fadeIn = () => {
    Animated.timing(animated, {
      toValue: fadeLevel,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };
  const fadeOut = () => {
    Animated.timing(animated, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable onPressIn={fadeIn} onPressOut={fadeOut} {...props}>
      <Animated.View style={{ opacity: animated }}>
        {typeof children === 'function' ? children({ pressed: false, hovered: false }) : children}
      </Animated.View>
    </Pressable>
  );
};