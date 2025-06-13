// #FFE9E4 : paper-pink
// #ED5959 : brand-pink
// #A372F2 : brand-purple
// #403B51 : inkverse-black
// #2A2633 : inkverse-black-dark  
// #55BC31 : action-green
// #F7F7F7 : soft-white
// #567CD6 : taddy-blue
// #3E5FBC : taddy-blue-dark

export const Colors = {
  light: {
    text: '#403B51',      // inkverse-black
    background: '#FFE9E4', // paper-pink
    navBackground: '#F7F7F7', // soft-white
    tint: '#ED5959',       // brand-pink
    link: '#ED5959',       // brand-pink
    icon: '#567CD6',       // taddy-blue
    action: '#ED5959', // brand-pink
    tag: '#ED5959', // brand-pink
    category: '#567CD6', // taddy-blue
    actionText: '#F7F7F7', // action-text
    button: '#ED5959', // taddy-blue
    buttonText: '#F7F7F7', // soft-white
    error: '#ED5959', // brand-pink
  },
  dark: {
    text: '#F7F7F7',      // soft-white
    background: '#403B51', // inkverse-black
    navBackground: '#2A2633', // inkverse-black-dark
    tint: '#F7F7F7',      // soft-white
    link: '#A372F2',      // soft-white
    icon: '#3E5FBC',      // taddy-blue-dark
    action: '#A372F2', // brand-purple
    tag: '#567CD6', // taddy-blue
    category: '#ED5959', // taddy-blue-dark
    actionText: '#F7F7F7', // action-text
    button: '#F7F7F7', // soft-white
    buttonText: '#403B51', // inkverse-black
    error: '#ED5959', // brand-pink
  },
} as const;

import { useMemo } from 'react';
import { useColorScheme } from 'react-native';

type ColorName = keyof typeof Colors.light & keyof typeof Colors.dark;
type ThemeProps = { light?: string; dark?: string };

export function useThemeColor(props: ThemeProps, colorName: ColorName) {
  const theme = useColorScheme() ?? 'light';
  
  return useMemo(() => {
    const colorPassedInFromProps = props[theme];
    return colorPassedInFromProps || Colors[theme][colorName];
  }, [props, theme, colorName]);
}