import React, { useEffect, useState } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);

  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('userThemePreference');
        if (savedTheme) {
          // Apply the saved theme preference
          Appearance.setColorScheme(savedTheme === 'dark' ? 'dark' : 'light');
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
      } finally {
        setIsThemeLoaded(true);
      }
    };

    loadThemePreference();
  }, []);

  // We can either wait for theme to load or just render immediately
  // For minimal flickering, you can wait, but it's not strictly necessary
  if (!isThemeLoaded) {
    return null;
  }

  return <>{children}</>;
} 