import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BREAKPOINTS, MAX_CONTENT_WIDTH } from '@/constants/Layout';

export type Layout = {
  contentWidth: number;
  contentInsetX: number;
  isSm: boolean;
  isMd: boolean;
  isLg: boolean;
  isLandscape: boolean;
};

// Width-based layout for a centered content column (same spacing on the left and right).
// Breakpoints use the available (uncapped) width; contentWidth is capped for sizing.
export function useLayout(maxContentWidth: number = MAX_CONTENT_WIDTH.page): Layout {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const sideInset = Math.max(insets.left, insets.right);
  const safeWidth = width - 2 * sideInset;
  const contentWidth = Math.min(safeWidth, maxContentWidth);
  const contentInsetX = (width - contentWidth) / 2;

  return {
    contentWidth,
    contentInsetX,
    isSm: safeWidth >= BREAKPOINTS.sm,
    isMd: safeWidth >= BREAKPOINTS.md,
    isLg: safeWidth >= BREAKPOINTS.lg,
    isLandscape: width > height,
  };
}
