import React from 'react';
import { View, type ViewProps, StyleSheet, Platform } from 'react-native';
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

  // Configure system bars visibility
  // On iOS: Only status bar can be hidden (navigation bar hiding not supported)
  // On Android: Both status bar and navigation bar can be hidden
  let hideSystemBars: boolean | { statusBar: boolean; navigationBar: boolean };
  
  if (Platform.OS === 'ios') {
    // iOS only supports hiding the status bar
    hideSystemBars = !showStatusBar;
  } else {
    // Android supports hiding both bars independently
    if (!showStatusBar) {
      hideSystemBars = {
        statusBar: !showStatusBar,
        navigationBar: false
      };
    } else {
      hideSystemBars = false;
    }
  }

  return (
    <>
      <SystemBars hidden={hideSystemBars}/>
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