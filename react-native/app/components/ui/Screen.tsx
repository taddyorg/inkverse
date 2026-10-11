import React from 'react';
import { View, type ViewProps, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationBar } from 'expo-navigation-bar';

import { useThemeColor } from '@/constants/Colors';

export type ScreenProps = ViewProps & {
  passedInLightColor?: string;
  passedInDarkColor?: string;
  showStatusBar?: boolean;
};

export function Screen({ 
  style, 
  passedInLightColor, 
  passedInDarkColor, 
  showStatusBar = false, 
  ...otherProps 
}: ScreenProps) {
  const backgroundColor = useThemeColor({ light: passedInLightColor, dark: passedInDarkColor }, 'background');

  return (
    <>
      <StatusBar hidden={!showStatusBar} />
      <NavigationBar style="auto" />
      <View 
        style={[
          { backgroundColor }, 
          styles.container, 
          style
        ]} 
        {...otherProps} 
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});