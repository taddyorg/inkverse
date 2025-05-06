import React from 'react';
import { View, type ViewProps, StyleSheet, StatusBar } from 'react-native';

import { useThemeColor } from '@/constants/Colors';

export type ScreenProps = ViewProps & {
  passedInLightColor?: string;
  passedInDarkColor?: string;
  showStatusBar?: boolean;
};

export function Screen({ style, passedInLightColor, passedInDarkColor, showStatusBar = false, ...otherProps }: ScreenProps) {
  const backgroundColor = useThemeColor({ light: passedInLightColor, dark: passedInDarkColor }, 'background');

  return (
    <>
      <StatusBar backgroundColor={backgroundColor} hidden={!showStatusBar} showHideTransition="fade" />
      <View style={[{ backgroundColor }, styles.container, style]} {...otherProps} />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});