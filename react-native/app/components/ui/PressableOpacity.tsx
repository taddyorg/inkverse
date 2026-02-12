import React, { useRef } from "react";
import { Pressable, Animated, PressableProps, StyleProp, ViewStyle } from "react-native";

type PressableOpacityProps = PressableProps & {
  fadeLevel?: number;
  style?: StyleProp<ViewStyle>;
  innerStyle?: StyleProp<ViewStyle>;
  disabled?: boolean;
};

export const PressableOpacity = ({ children, fadeLevel = 0.5, style, innerStyle, disabled, ...props }: PressableOpacityProps) => {
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
    <Pressable onPressIn={fadeIn} onPressOut={fadeOut} disabled={disabled} style={style} {...props}>
      <Animated.View style={[{ opacity: animated }, innerStyle]}>
        {typeof children === 'function' ? children({ pressed: false }) : children}
      </Animated.View>
    </Pressable>
  );
};