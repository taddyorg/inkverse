import React from 'react';
import { View, type ViewProps, StyleSheet, useColorScheme } from 'react-native';
import { SystemBars } from 'react-native-edge-to-edge';

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
      <SystemBars hidden={!showStatusBar}/>
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