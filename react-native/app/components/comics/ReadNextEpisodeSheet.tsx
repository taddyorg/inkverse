import React, { useMemo } from 'react';
import { Animated, LayoutChangeEvent, Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';

import { ComicHeaderBar, COMIC_HEADER_CONTENT_HEIGHT, COMIC_HEADER_PADDING_BOTTOM } from './ComicHeader';
import type { ReadNextEpisodePullProgress } from './ReadNextEpisode';
import { useThemeColor } from '@/constants/Colors';

// Peek sheet for the pull-to-open motion: a full-screen-height panel pinned to the bottom of the screen
// and translated down so that only the pull distance shows. Its header mirrors the episode screen's
// ComicHeader so that, when the sheet expands into the episode, the same title row slides into place.
// Rendered by the screen as a sibling of the list, above the pinned header and footer.
const SHEET_RADIUS = 26;
// Compact header while peeking, so the preview image shows sooner as the sheet is pulled up
const SHEET_PEEK_HEADER_HEIGHT = 64;
const SHEET_PEEK_HEADER_PADDING_BOTTOM = 8;
const GRABBER_COLOR = '#DAD5D8';
const ABSOLUTE_FILL = { position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0 };

export interface ReadNextEpisodeSheetProps {
  // Undefined hides the sheet entirely
  progress?: ReadNextEpisodePullProgress;
  // While the sheet expands into the episode, it swallows touches
  isOpening: boolean;
  seriesName?: string | null;
  episodeName?: string | null;
  // Top of the target episode's first page, shown under the header like the real list
  pageImageUrl?: string;
  pageAspectRatio?: number;
  onLayout: (event: LayoutChangeEvent) => void;
}

export function ReadNextEpisodeSheet({ progress, isOpening, seriesName, episodeName, pageImageUrl, pageAspectRatio, onLayout }: ReadNextEpisodeSheetProps) {
  const background = useThemeColor({}, 'background');
  const { width, height: windowHeight } = useWindowDimensions();

  const derived = useMemo(() => {
    if (!progress) { return null; }
    const { pull, openT, sheetHeight, sheetOpacity } = progress;
    return {
      // H - o while pulling; the open tween scales that down to 0 so the sheet continues from where it is
      translateY: Animated.multiply(Animated.subtract(sheetHeight, pull), Animated.subtract(1, openT)),
      radius: openT.interpolate({ inputRange: [0, 1], outputRange: [SHEET_RADIUS, 0] }),
      headerHeight: openT.interpolate({ inputRange: [0, 1], outputRange: [SHEET_PEEK_HEADER_HEIGHT, COMIC_HEADER_CONTENT_HEIGHT] }),
      headerPaddingBottom: openT.interpolate({ inputRange: [0, 1], outputRange: [SHEET_PEEK_HEADER_PADDING_BOTTOM, COMIC_HEADER_PADDING_BOTTOM] }),
      opacity: sheetOpacity,
    };
  }, [progress]);

  if (!derived) { return null; }

  const pageHeight = Math.floor(width / (pageAspectRatio ?? width / windowHeight));
  const radiusStyle = { borderTopLeftRadius: derived.radius, borderTopRightRadius: derived.radius };

  return (
    <View style={styles.overlay} pointerEvents={isOpening ? 'auto' : 'none'}>
      <Animated.View
        onLayout={onLayout}
        style={[styles.sheet, radiusStyle, { backgroundColor: background, opacity: derived.opacity, transform: [{ translateY: derived.translateY }] }]}
      >
        <Animated.View style={[styles.clip, radiusStyle, { backgroundColor: background }]}>
          {pageImageUrl && (
            <Image
              source={pageImageUrl}
              style={{ position: 'absolute', top: 0, left: 0, width, height: pageHeight }}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          )}
          <Animated.View style={[styles.header, { height: derived.headerHeight, paddingBottom: derived.headerPaddingBottom }]}>
            <View style={styles.grabber} />
            <ComicHeaderBar comicseries={{ name: seriesName }} comicissue={{ name: episodeName }} />
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...ABSOLUTE_FILL,
    zIndex: 20,
    elevation: 20,
  },
  // Shadow lives here; the clipping (overflow hidden) lives on the child, since iOS drops shadows on clipped views
  sheet: {
    ...ABSOLUTE_FILL,
    ...Platform.select({
      ios: {
        shadowColor: '#3E3B4D',
        shadowOffset: { width: 0, height: -10 },
        shadowRadius: 30,
        shadowOpacity: 0.14,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  clip: {
    flex: 1,
    overflow: 'hidden',
  },
  header: {
    backgroundColor: '#000000',
    justifyContent: 'flex-end',
  },
  grabber: {
    position: 'absolute',
    top: 9,
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: GRABBER_COLOR,
  },
});
