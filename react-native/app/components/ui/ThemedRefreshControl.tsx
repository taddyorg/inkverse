import React from 'react';
import { Platform, RefreshControl, RefreshControlProps } from 'react-native';
import { useThemeColor } from '@/constants/Colors';

export type ThemedRefreshControlProps = Omit<RefreshControlProps, 'tintColor' | 'colors'> & {
  passedInLightColor?: string;
  passedInDarkColor?: string;
};

export function ThemedRefreshControl({
  passedInLightColor,
  passedInDarkColor,
  progressViewOffset = Platform.OS === 'ios' ? 60 : 40,
  ...props
}: ThemedRefreshControlProps) {
  const tintColor = useThemeColor(
    { light: passedInLightColor, dark: passedInDarkColor },
    'tint'
  );

  return (
    <RefreshControl
      {...props}
      tintColor={tintColor}
      colors={[tintColor]}
      progressViewOffset={progressViewOffset}
    />
  );
} 