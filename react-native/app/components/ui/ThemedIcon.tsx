import React, { ReactNode } from 'react';
import { View, ViewStyle } from 'react-native';
import { useThemeColor } from '@/constants/Colors';

type ThemedIconSize = 'small' | 'medium' | 'large';

export type ThemedIconProps = {
  children: ReactNode;
  passedInLightColor?: string;
  passedInDarkColor?: string;
  size?: ThemedIconSize;
  style?: ViewStyle;
};

interface IconSizeStyle {
  container: ViewStyle;
  size: number;
}

export function ThemedIcon({
  children,
  passedInLightColor,
  passedInDarkColor,
  size = 'medium',
  style,
}: ThemedIconProps) {
  const color = useThemeColor(
    { light: passedInLightColor, dark: passedInDarkColor },
    'text'
  );

  // Clone the child element and pass the color prop
  const iconWithColor = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        color,
        size: styles[size].size,
        ...(child.props as any),
      });
    }
    return child;
  });

  return <View style={[styles[size].container, style]}>{iconWithColor}</View>;
}

const styles: Record<ThemedIconSize, IconSizeStyle> = {
  small: {
    container: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    size: 16,
  },
  medium: {
    container: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    size: 24,
  },
  large: {
    container: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    size: 32,
  },
}; 