import React from 'react';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider } from './ThemeProvider';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

interface AppLoaderProviderProps {
  children: React.ReactNode;
}

export function AppLoaderProvider({ children }: AppLoaderProviderProps) {
  const [fontsLoaded] = useFonts({
    'SourceSans3-Regular': require('../../../assets/fonts/SourceSans3-Regular.ttf'),
    'SourceSans3-SemiBold': require('../../../assets/fonts/SourceSans3-SemiBold.ttf'),
    'SourceSans3-Bold': require('../../../assets/fonts/SourceSans3-Bold.ttf'),
  });

  React.useEffect(() => {
    if (fontsLoaded) {
      // Hide splash screen once fonts are loaded
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return <ThemeProvider>{children}</ThemeProvider>;
}