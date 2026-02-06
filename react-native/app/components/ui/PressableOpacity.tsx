import React, { useRef, useEffect } from "react";
import { Pressable, Animated, PressableProps, ViewStyle, StyleProp } from "react-native";

type PressableOpacityProps = Omit<PressableProps, 'style'> & {
  fadeLevel?: number;
  style?: StyleProp<ViewStyle>;
  innerStyle?: StyleProp<ViewStyle>;
};

export const PressableOpacity = ({ children, fadeLevel = 0.5, style, innerStyle, disabled, ...props }: PressableOpacityProps) => {
  const animated = useRef(new Animated.Value(1)).current;

  // Reset animation when disabled changes to prevent stuck opacity
  useEffect(() => {
    if (disabled) {
      animated.setValue(1);
    }
  }, [disabled]);

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
