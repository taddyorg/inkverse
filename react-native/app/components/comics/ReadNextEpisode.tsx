import React, { RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import type { FlashListRef } from '@shopify/flash-list';

import { ThemedText, ThemedTextFontFamilyMap, PressableOpacity } from '../ui';
import { SuperLikeButton } from './SuperLikeButton';
import type { ReadNextEpisodeSheetProps } from './ReadNextEpisodeSheet';

import { ComicIssue, Creator } from '@inkverse/shared-client/graphql/operations';
import { loadComicIssue } from '@inkverse/shared-client/dispatch/comicissue';
import { getThumbnailImageUrl } from '@inkverse/public/comicissue';
import { getStoryImageUrl } from '@inkverse/public/comicstory';
import { getPublicApolloClient } from '@/lib/apollo';
import { useThemeColor } from '@/constants/Colors';

// "Ink fill and peek": pulling past the bottom of the list fills the card with the action colour from the
// bottom up while a sheet for the target episode rises from the bottom edge. Releasing once the card is
// full expands the sheet into the episode screen; releasing earlier springs everything back. Every value
// derives from the overscroll `pull` (o) and the `armed` spring (a) that fires when o crosses the threshold.

// Hidden space rendered below the card so the list can keep scrolling past it. iOS needs none: the pull
// reads the rubber-band overscroll past the end of the list. Android doesn't report offsets past the end,
// so the spacer is tall enough to reveal the sheet's header and status line.
export const READ_NEXT_PULL_SPACER_HEIGHT = Platform.OS === 'ios' ? 0 : 120;
// Visual overscroll at which the card is full and releasing opens the episode
export const READ_NEXT_PULL_THRESHOLD = 64;
// The sheet's top edge travels from where it is to the top of the screen in this time
export const SHEET_OPEN_DURATION = 300;

const CARD_BORDER_WIDTH = 3;
const CARD_RADIUS = 27;
const CARD_PADDING = 18;
const THUMBNAIL_SIZE = 90;
const THUMBNAIL_RADIUS = 18;
const PLAY_SLOT_SIZE = 62;
const PLAY_SIZE = 56;
const PLAY_ARMED_SIZE = 62;
const CARD_BACKGROUND_LIGHT = '#FBFBFB';
const WHITE = '#FFFFFF';
// How long the sheet may cover the screen after navigating before it drops on its own. Normally the
// episode screen dismisses it as soon as its first page is on screen (onContentReady); this only
// catches a page that never displays.
const OPEN_FALLBACK_MS = 1500;
const DISMISS_DURATION = 150;
// After pushing the episode screen, how long the series screen keeps its sheet up underneath it
const BLUR_RESET_DELAY_MS = 500;

// Animated values driving the card and the sheet (owned by useReadNextEpisodePull)
export interface ReadNextEpisodePullProgress {
  // Visual overscroll past the card, in px (o)
  pull: Animated.Value;
  // Springs to 1 once the pull passes the threshold and back to 0 if the reader eases off (a)
  armed: Animated.Value;
  // 0 while pulling, tweens to 1 as the sheet expands into the episode screen
  openT: Animated.Value;
  // Height of the sheet (the window height), so translateY = sheetHeight - pull hides it at rest
  sheetHeight: Animated.Value;
  // Fades the sheet out once the episode screen has rendered underneath it
  sheetOpacity: Animated.Value;
}

interface ReadNextEpisodeProps {
  comicissue: ComicIssue;
  showEmptyState?: boolean;
  firstTextCTA?: string;
  secondTextCTA?: string;
  handleNavigateToIssue: (issueUuid: string, seriesUuid: string) => void;
  // Enables the ink fill and the spacer below the card
  pullProgress?: ReadNextEpisodePullProgress;
  // Tap handler when the pull is enabled (opens through the sheet); falls back to handleNavigateToIssue
  onOpen?: () => void;
  // Called when the card is rendered for an issue, so the target episode can be prefetched
  onVisible?: () => void;
  accessibilityLabel?: string;
  // SuperLike props (optional - only shown in empty state when authenticated)
  isAuthenticated?: boolean;
  isSuperLikeLoading?: boolean;
  onSuperLike?: () => void;
  hasLikedAllEpisodes?: boolean;
  creators?: (Creator | null)[];
}

export function ReadNextEpisode({
  comicissue,
  showEmptyState = true,
  firstTextCTA = 'NEXT',
  secondTextCTA = 'EPISODE',
  handleNavigateToIssue,
  pullProgress,
  onOpen,
  onVisible,
  accessibilityLabel = 'Read next episode',
  isAuthenticated,
  isSuperLikeLoading,
  onSuperLike,
  hasLikedAllEpisodes,
  creators,
}: ReadNextEpisodeProps) {
  const color = useThemeColor({}, 'action');
  const cardBackground = useThemeColor({ light: CARD_BACKGROUND_LIGHT }, 'navBackground');
  const pullStyles = usePullStyles(pullProgress);
  const issueUuid = comicissue?.uuid;

  useEffect(() => {
    if (issueUuid) { onVisible?.(); }
  }, [issueUuid, onVisible]);

  if (!comicissue) {
    if (!showEmptyState) { return null; }
    return (
      <View style={styles.container}>
        <View style={styles.endButtonContainer}>
          <ThemedText style={styles.emptyText}>
            You are up to date with this series!
          </ThemedText>
          {isAuthenticated && onSuperLike && (
            <SuperLikeButton
              isLoading={isSuperLikeLoading ?? false}
              onPress={onSuperLike}
              hasLikedAll={hasLikedAllEpisodes ?? false}
              creators={creators}
            />
          )}
        </View>
      </View>
    );
  }

  const bodyProps = { comicissue, firstTextCTA, secondTextCTA, actionColor: color, play: pullStyles.play };

  return (
    <View style={styles.container}>
      <Animated.View style={pullStyles.card}>
        <PressableOpacity
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={pullProgress ? 'Keep scrolling past this card and release to open it' : undefined}
          onPress={() => {
            if (onOpen) {
              onOpen();
            } else if (handleNavigateToIssue && comicissue.uuid && comicissue.seriesUuid) {
              handleNavigateToIssue(comicissue.uuid, comicissue.seriesUuid);
            }
          }}
        >
          <View style={[styles.frame, { borderColor: color, backgroundColor: cardBackground }]}>
            <CardBody {...bodyProps} variant="base" />
            {pullProgress && (
              // Second copy of the card, clipped from the top, so the colour edge crosses the text as it rises
              <Animated.View
                style={[styles.fillClip, { top: pullStyles.fillTop }]}
                pointerEvents="none"
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              >
                <View style={styles.fillAnchor}>
                  <CardBody {...bodyProps} variant="fill" />
                </View>
              </Animated.View>
            )}
          </View>
        </PressableOpacity>
      </Animated.View>
      {pullProgress && READ_NEXT_PULL_SPACER_HEIGHT > 0 && <View style={styles.pullSpacer} pointerEvents="none" />}
    </View>
  );
}

interface CardBodyProps {
  comicissue: ComicIssue;
  firstTextCTA: string;
  secondTextCTA: string;
  actionColor: string;
  // Transform for the play circle (shared between both copies)
  play?: { transform: ({ scale: Animated.AnimatedInterpolation<number> } | { rotate: Animated.AnimatedInterpolation<string> })[] };
  // 'base' is the resting card; 'fill' is the inverted copy revealed by the pull
  variant: 'base' | 'fill';
}

// The card's contents, rendered twice with identical layout so the fill copy lines up with the base
function CardBody({ comicissue, firstTextCTA, secondTextCTA, actionColor, play, variant }: CardBodyProps) {
  const inverted = variant === 'fill';
  const textColor = inverted ? WHITE : actionColor;
  const circleColor = inverted ? WHITE : actionColor;
  const triangleColor = inverted ? actionColor : WHITE;
  const isPatreonExclusive = comicissue.scopesForExclusiveContent?.includes('patreon');

  return (
    <View style={[styles.body, inverted && { backgroundColor: actionColor }]}>
      {comicissue.thumbnailImageAsString && (
        <View style={styles.thumbnailWrapper}>
          <Image
            source={getThumbnailImageUrl({ thumbnailImageAsString: comicissue.thumbnailImageAsString })}
            style={styles.thumbnail}
            contentFit="cover"
          />
          {isPatreonExclusive && (
            <View style={styles.lockIconContainer}>
              <MaterialIcons name="lock" size={50} color={textColor} />
            </View>
          )}
        </View>
      )}
      <View style={styles.titleContainer}>
        <ThemedText style={[styles.title, { color: textColor }]}>{firstTextCTA.toUpperCase()}</ThemedText>
        <ThemedText style={[styles.title, { color: textColor }]}>{secondTextCTA.toUpperCase()}</ThemedText>
        {isPatreonExclusive && (
          <ThemedText style={[styles.patreonExclusiveText, { color: textColor }]}>PATREON EXCLUSIVE</ThemedText>
        )}
      </View>
      {/* Fixed slot so the circle can grow when armed without shifting the label */}
      <View style={styles.playSlot}>
        <Animated.View style={[styles.playCircle, { backgroundColor: circleColor }, play]}>
          <MaterialIcons name="play-arrow" size={36} color={triangleColor} />
        </Animated.View>
      </View>
    </View>
  );
}

// Styles derived from the pull: the card scales up slightly, the fill rises and the play triangle turns to
// point down with the pull (p), while the play circle pops only at the moment the card becomes ready (a).
function usePullStyles(progress: ReadNextEpisodePullProgress | undefined) {
  return useMemo(() => {
    if (!progress) {
      return { card: undefined, fillTop: undefined, play: undefined };
    }

    const p = progress.pull.interpolate({
      inputRange: [0, READ_NEXT_PULL_THRESHOLD],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });
    const cardScale = p.interpolate({ inputRange: [0, 1], outputRange: [1, 1.015] });
    const fillTop = p.interpolate({ inputRange: [0, 1], outputRange: ['100%', '0%'] });
    // Scale is not clamped: the spring's overshoot is the pop
    const playScale = progress.armed.interpolate({ inputRange: [0, 1], outputRange: [1, PLAY_ARMED_SIZE / PLAY_SIZE] });
    const playRotate = p.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '90deg'] });

    return {
      card: { transform: [{ scale: cardScale }] },
      fillTop,
      play: { transform: [{ scale: playScale }, { rotate: playRotate }] },
    };
  }, [progress]);
}

type PullPhase = 'idle' | 'dragging' | 'settling' | 'opening' | 'opened';

// What the sheet shows: the episode screen's header titles and the top of its first page. Serialisable,
// so the series screen can hand it to the pushed episode screen as a route param.
export interface SheetContent {
  seriesName?: string | null;
  episodeName?: string | null;
  pageImageUrl?: string;
  pageAspectRatio?: number;
}

interface SheetPreview {
  // The target the preview was fetched for; a preview for another target is ignored rather than cleared
  forUuid: string;
  pageImageUrl?: string;
  pageAspectRatio?: number;
}

interface UseReadNextEpisodePullOptions {
  // A target issue exists and the card (with its spacer) is rendered at the end of the list
  enabled: boolean;
  listRef: RefObject<FlashListRef<any> | null>;
  // The episode the card opens (mini details are enough)
  target: ComicIssue | null | undefined;
  seriesName: string | null | undefined;
  // Called once the sheet covers the screen; should open the episode without a transition. `content` is
  // what the sheet is showing, for a pushed screen to continue covering itself with (see initialCover).
  onNavigate: (issueUuid: string, seriesUuid: string, content: SheetContent) => void;
  // Mount with the sheet already expanded and showing this content (read once). Used by the episode
  // screen when it was pushed from underneath another screen's sheet, so its own empty first frames stay
  // covered until onContentReady is called.
  initialCover?: SheetContent | null;
}

// Reads the list's own scroll events to detect the reader pulling past the ReadNextEpisode card (into the
// iOS overscroll bounce, or the hidden spacer on Android). Drives the card's fill and the peek sheet from
// the pull, arms (with a haptic) at the threshold, and on release past it expands the sheet into the
// episode screen. Releasing early lets the list settle (iOS bounce / Android scrollToOffset) and the
// fill and sheet follow. Tapping the card opens through the same sheet expansion.
export function useReadNextEpisodePull({ enabled, listRef, target, seriesName, onNavigate, initialCover }: UseReadNextEpisodePullOptions) {
  const navigation = useNavigation();
  const windowHeight = useWindowDimensions().height;
  const pull = useRef(new Animated.Value(0)).current;
  const armed = useRef(new Animated.Value(0)).current;
  // openT at 1 with pull at 0 puts the sheet at translateY 0, i.e. covering the screen from the first frame
  const openT = useRef(new Animated.Value(initialCover ? 1 : 0)).current;
  const sheetHeight = useRef(new Animated.Value(windowHeight)).current;
  const sheetOpacity = useRef(new Animated.Value(1)).current;

  const phase = useRef<PullPhase>(initialCover ? 'opened' : 'idle');
  const pastThreshold = useRef(false);
  const hasTriggered = useRef(false);
  const reduceMotion = useRef(false);
  const prefetchedFor = useRef<string | undefined>(undefined);
  const fallbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onNavigateRef = useRef(onNavigate);
  onNavigateRef.current = onNavigate;

  const [isOpening, setIsOpening] = useState(!!initialCover);
  const [preview, setPreview] = useState<SheetPreview | null>(null);
  // Snapshot of the sheet's content taken when it starts opening, so the titles and page stay put while
  // the target changes underneath (the episode screen swaps issues in place) until the sheet is dismissed
  const [frozen, setFrozen] = useState<SheetContent | null>(initialCover ?? null);

  const targetUuid = target?.uuid;
  const targetSeriesUuid = target?.seriesUuid;
  const targetIsExclusive = !!target?.scopesForExclusiveContent?.includes('patreon');

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => { if (mounted) { reduceMotion.current = value; } });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (value) => { reduceMotion.current = value; });
    return () => { mounted = false; subscription.remove(); };
  }, []);

  const isBusy = useCallback(() => phase.current === 'opening' || phase.current === 'opened', []);

  // Back to rest: card empty, sheet hidden, ready for the next pull
  const hardReset = useCallback(() => {
    if (fallbackTimer.current) { clearTimeout(fallbackTimer.current); fallbackTimer.current = null; }
    openT.stopAnimation();
    armed.stopAnimation();
    sheetOpacity.stopAnimation();
    pull.setValue(0);
    armed.setValue(0);
    openT.setValue(0);
    sheetOpacity.setValue(1);
    pastThreshold.current = false;
    hasTriggered.current = false;
    phase.current = 'idle';
    setIsOpening(false);
    setFrozen(null);
  }, [pull, armed, openT, sheetOpacity]);

  // Once the episode has rendered underneath the expanded sheet, fade the sheet away and reset
  const dismiss = useCallback(() => {
    if (phase.current !== 'opened') { hardReset(); return; }
    Animated.timing(sheetOpacity, { toValue: 0, duration: DISMISS_DURATION, useNativeDriver: false }).start(() => hardReset());
  }, [sheetOpacity, hardReset]);

  // The episode screen calls this once its first page is actually on screen (or it has nothing to show)
  const onContentReady = useCallback(() => {
    if (phase.current === 'opened') { dismiss(); }
  }, [dismiss]);

  // Mounted already covering the screen: drop the cover on the fallback if the content never reports in
  useEffect(() => {
    if (phase.current === 'opened' && !fallbackTimer.current) {
      fallbackTimer.current = setTimeout(dismiss, OPEN_FALLBACK_MS);
    }
    return () => {
      if (fallbackTimer.current) { clearTimeout(fallbackTimer.current); fallbackTimer.current = null; }
    };
  }, []);

  // Leaving the screen resets everything underneath. After pushing the episode, wait until the new
  // screen is certainly on top before dropping the sheet, so the series page never flashes through.
  useEffect(() => navigation.addListener('blur', () => {
    if (phase.current === 'opened') {
      if (fallbackTimer.current) { clearTimeout(fallbackTimer.current); }
      fallbackTimer.current = setTimeout(hardReset, BLUR_RESET_DELAY_MS);
    } else {
      hardReset();
    }
  }), [navigation, hardReset]);

  // The target changes when the episode screen moves to the next issue in place (or runs out of issues).
  // While the sheet is covering the screen it keeps its frozen content and waits for onContentReady; the
  // preview is keyed by target, so a stale one is simply ignored rather than cleared here.
  useEffect(() => {
    if (phase.current === 'opened') { return; }
    hardReset();
  }, [targetUuid, hardReset]);

  const setArmed = useCallback((isArmed: boolean) => {
    pastThreshold.current = isArmed;
    if (isArmed) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    const toValue = isArmed ? 1 : 0;
    armed.stopAnimation();
    if (reduceMotion.current) {
      Animated.timing(armed, { toValue, duration: 150, easing: Easing.out(Easing.quad), useNativeDriver: false }).start();
    } else {
      Animated.spring(armed, { toValue, stiffness: 520, damping: 17, mass: 1, useNativeDriver: false }).start();
    }
  }, [armed]);

  // How far the list is scrolled past the card, and the offset at which the card sits at the bottom of the viewport
  const measure = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const maxBeforeSpacer = Math.max(0, contentSize.height - READ_NEXT_PULL_SPACER_HEIGHT - layoutMeasurement.height);
    const pullPx = Math.max(0, contentOffset.y - maxBeforeSpacer);
    return { pullPx, maxBeforeSpacer };
  }, []);

  // Without a spacer (iOS) the bounce settles the list on its own
  const scrollBack = useCallback((offset: number) => {
    if (READ_NEXT_PULL_SPACER_HEIGHT === 0) { return; }
    listRef.current?.scrollToOffset({ offset, animated: true });
  }, [listRef]);

  // The preview only applies to the target it was fetched for
  const livePreview = preview?.forUuid === targetUuid ? preview : null;

  // Freeze the pull, armed state and sheet content, expand the sheet to full screen, then hand over to
  // the episode screen
  const commitOpen = useCallback(() => {
    if (isBusy() || !targetUuid || !targetSeriesUuid) { return; }
    const content: SheetContent = {
      seriesName,
      episodeName: target?.name,
      pageImageUrl: livePreview?.pageImageUrl,
      pageAspectRatio: livePreview?.pageAspectRatio,
    };
    phase.current = 'opening';
    setIsOpening(true);
    setFrozen(content);
    Animated.timing(openT, {
      toValue: 1,
      duration: SHEET_OPEN_DURATION,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (!finished || phase.current !== 'opening') { return; }
      phase.current = 'opened';
      onNavigateRef.current(targetUuid, targetSeriesUuid, content);
      fallbackTimer.current = setTimeout(dismiss, OPEN_FALLBACK_MS);
    });
  }, [isBusy, targetUuid, targetSeriesUuid, seriesName, target?.name, livePreview, openT, dismiss]);

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!enabled || isBusy()) { return; }
    const { pullPx } = measure(event);
    pull.setValue(pullPx);

    // Only a drag can arm (a fling bouncing past the end opens nothing on release); disarming can happen any time
    const isPast = pullPx >= READ_NEXT_PULL_THRESHOLD && (phase.current === 'dragging' || pastThreshold.current);
    if (isPast !== pastThreshold.current) {
      setArmed(isPast);
    }
  }, [enabled, isBusy, measure, pull, setArmed]);

  const onScrollBeginDrag = useCallback(() => {
    if (isBusy()) { return; }
    phase.current = 'dragging';
    hasTriggered.current = false;
  }, [isBusy]);

  const onScrollEndDrag = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!enabled || phase.current !== 'dragging') { return; }
    const { pullPx, maxBeforeSpacer } = measure(event);
    if (pullPx >= READ_NEXT_PULL_THRESHOLD && !hasTriggered.current) {
      hasTriggered.current = true;
      commitOpen();
      // Settle the list under the sheet so the card is back in place when the reader returns
      scrollBack(maxBeforeSpacer);
      return;
    }
    phase.current = pullPx > 0 ? 'settling' : 'idle';
    if (pullPx > 0) {
      scrollBack(maxBeforeSpacer);
    }
  }, [enabled, measure, commitOpen, scrollBack]);

  const onMomentumScrollEnd = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!enabled || isBusy()) { return; }
    const { pullPx, maxBeforeSpacer } = measure(event);
    if (pullPx > 0) {
      scrollBack(maxBeforeSpacer);
    } else {
      phase.current = 'idle';
    }
  }, [enabled, isBusy, measure, scrollBack]);

  // Tap: the sheet rises from the bottom edge and expands, no fill
  const open = useCallback(() => {
    commitOpen();
  }, [commitOpen]);

  // Warm Apollo with the target episode (so it opens without a spinner), prefetch its first two pages and
  // use the first one for the sheet
  const onCardVisible = useCallback(() => {
    if (!targetUuid || !targetSeriesUuid || prefetchedFor.current === targetUuid) { return; }
    prefetchedFor.current = targetUuid;
    loadComicIssue({ publicClient: getPublicApolloClient(), issueUuid: targetUuid, seriesUuid: targetSeriesUuid })
      .then((data) => {
        if (prefetchedFor.current !== targetUuid || targetIsExclusive) { return; }
        const stories = data?.comicissue?.stories ?? [];
        const story = stories[0];
        if (!story?.storyImageAsString) { return; }
        const pageImageUrl = getStoryImageUrl({ storyImageAsString: story.storyImageAsString });
        if (!pageImageUrl) { return; }
        const secondStory = stories[1];
        const secondPageImageUrl = secondStory?.storyImageAsString
          ? getStoryImageUrl({ storyImageAsString: secondStory.storyImageAsString })
          : undefined;
        Image.prefetch(secondPageImageUrl ? [pageImageUrl, secondPageImageUrl] : pageImageUrl);
        setPreview({
          forUuid: targetUuid,
          pageImageUrl,
          pageAspectRatio: story.width && story.height ? story.width / story.height : undefined,
        });
      })
      .catch(() => {});
  }, [targetUuid, targetSeriesUuid, targetIsExclusive]);

  const onSheetLayout = useCallback((event: LayoutChangeEvent) => {
    sheetHeight.setValue(event.nativeEvent.layout.height);
  }, [sheetHeight]);

  const progress = useMemo<ReadNextEpisodePullProgress>(
    () => ({ pull, armed, openT, sheetHeight, sheetOpacity }),
    [pull, armed, openT, sheetHeight, sheetOpacity],
  );

  // Keep the sheet mounted while it is covering the screen, even if the target has just gone away. Once
  // opening, the sheet shows the frozen snapshot rather than whatever the target is now.
  const sheetProps = useMemo<ReadNextEpisodeSheetProps>(() => ({
    progress: enabled || isOpening ? progress : undefined,
    isOpening,
    seriesName: frozen ? frozen.seriesName : seriesName,
    episodeName: frozen ? frozen.episodeName : target?.name,
    pageImageUrl: frozen ? frozen.pageImageUrl : livePreview?.pageImageUrl,
    pageAspectRatio: frozen ? frozen.pageAspectRatio : livePreview?.pageAspectRatio,
    onLayout: onSheetLayout,
  }), [enabled, isOpening, progress, frozen, seriesName, target?.name, livePreview, onSheetLayout]);

  return { progress, open, onCardVisible, onContentReady, sheetProps, onScroll, onScrollBeginDrag, onScrollEndDrag, onMomentumScrollEnd };
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    justifyContent: "center",
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  frame: {
    width: '100%',
    borderWidth: CARD_BORDER_WIDTH,
    borderRadius: CARD_RADIUS,
    overflow: 'hidden',
  },
  body: {
    flexDirection: "row",
    alignItems: "center",
    padding: CARD_PADDING,
  },
  // Clips the fill copy from the top; its `top` is driven by the pull
  fillClip: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  // Bottom-anchored so the copy stays aligned with the base card as the clip moves
  fillAnchor: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  thumbnailWrapper: {
    position: 'relative',
  },
  thumbnail: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: THUMBNAIL_RADIUS,
  },
  lockIconContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -25 }, { translateY: -25 }],
  },
  title: {
    textAlign: "center",
    fontSize: 24,
    fontFamily: ThemedTextFontFamilyMap.bold,
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  playSlot: {
    width: PLAY_SLOT_SIZE,
    height: PLAY_SLOT_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  playCircle: {
    width: PLAY_SIZE,
    height: PLAY_SIZE,
    borderRadius: PLAY_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  patreonExclusiveText: {
    fontSize: 14,
    marginTop: 8,
    fontFamily: ThemedTextFontFamilyMap.semiBold,
  },
  endButtonContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 32,
  },
  emptyText: {
    fontSize: 18,
  },
  pullSpacer: {
    height: READ_NEXT_PULL_SPACER_HEIGHT,
  },
});
