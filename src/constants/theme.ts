/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0D2C45',
    background: '#F7F4EE',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E7E2DA',
    textSecondary: '#5C6370',
    primary: '#C49840',
    primaryForeground: '#0D2C45',
    accent: '#365A87',
    accentForeground: '#FFFFFF',
    border: '#CFC2B0',
    destructive: '#CC2424',
    destructiveForeground: '#FFFFFF',
  },
  dark: {
    text: '#F7F4EE',
    background: '#071C2C',
    backgroundElement: '#0D2C45',
    backgroundSelected: '#163D5E',
    textSecondary: '#D9D1C5',
    primary: '#C49840',
    primaryForeground: '#0D2C45',
    accent: '#365A87',
    accentForeground: '#FFFFFF',
    border: '#5F6F7E',
    destructive: '#FF6868',
    destructiveForeground: '#FFFFFF',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
