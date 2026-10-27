import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BREAKPOINTS, MAX_CONTENT_WIDTH, TABLET_MIN_SIDE } from '@/constants/Layout';
import { SPACING } from '@/constants/Spacing';

export type Layout = {
  contentWidth: number;
  contentInsetX: number;
  isSm: boolean;
  isMd: boolean;
  isLg: boolean;
  isTablet: boolean;
};

// Minimum inset on each side of the iPad page column, so with a screen's own 16pt padding
// the content sits 32pt from the edge (same as home / search)
const TABLET_GUTTER = 16;

// Width-based layout for a centered content column (same spacing on the left and right).
// Breakpoints use the available (uncapped) width; contentWidth is capped for sizing.
// Without an explicit max width, iPad gets a wider page column than phones.
export function useLayout(maxContentWidth?: number): Layout {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const isTablet = Math.min(width, height) >= TABLET_MIN_SIDE;
  const useTabletColumn = isTablet && maxContentWidth === undefined;
  const maxWidth = maxContentWidth ?? (isTablet ? MAX_CONTENT_WIDTH.tablet : MAX_CONTENT_WIDTH.page);

  const sideInset = Math.max(insets.left, insets.right);
  const safeWidth = width - 2 * sideInset;
  const contentWidth = Math.min(useTabletColumn ? safeWidth - 2 * TABLET_GUTTER : safeWidth, maxWidth);
  const contentInsetX = (width - contentWidth) / 2;

  return {
    contentWidth,
    contentInsetX,
    isSm: safeWidth >= BREAKPOINTS.sm,
    isMd: safeWidth >= BREAKPOINTS.md,
    isLg: safeWidth >= BREAKPOINTS.lg,
    isTablet,
  };
}

// Side padding for full-width screens (home, search). Phones in portrait keep a 16pt gutter,
// phones in landscape a 10pt gutter plus the notch inset, and iPad a wider 32pt gutter.
export function useScreenPaddingX(): number {
  const { isSm, isTablet } = useLayout();
  const insets = useSafeAreaInsets();

  if (isTablet) { return 32; }
  return isSm ? Math.max(insets.left, insets.right) + 10 : 16;
}

// Side padding for cover-grid pages (creator, profile): the column is capped at the grid width,
// and on wider layouts it's pulled in past the 40pt header buttons that sit 32pt from the edges
export function useGridPagePaddingX(): number {
  const { contentInsetX, isSm } = useLayout(MAX_CONTENT_WIDTH.grid);

  return isSm ? Math.max(16 + contentInsetX, SPACING.xl + 40 + SPACING.md) : 16 + contentInsetX;
}

// Cover grid columns: 2 on phone portrait, 4 on phone landscape and iPad portrait, 5 on iPad landscape
export function useGridColumns(): number {
  const { width, height } = useWindowDimensions();
  const { isSm, isTablet } = useLayout();

  return isTablet && width > height ? 5 : isSm ? 4 : 2;
}
