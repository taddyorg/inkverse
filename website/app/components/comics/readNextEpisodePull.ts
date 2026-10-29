import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { useNavigate, useOutletContext } from 'react-router';

import type { ComicIssue, ComicSeries } from '@inkverse/shared-client/graphql/operations';
import { loadComicIssue } from '@inkverse/shared-client/dispatch/comicissue';
import { getInkverseUrl } from '@inkverse/public/utils';
import { getThumbnailImageUrl } from '@inkverse/public/comicissue';
import { getStoryImageUrl } from '@inkverse/public/comicstory';
import { getPublicApolloClient } from '@/lib/apollo/client.client';

// "Ink fill and peek" (web port of the React Native ReadNextEpisode pull): pulling past the bottom of the
// page fills the card with the brand colour from the bottom up while a sheet for the target episode rises
// from the bottom edge. Releasing once the card is full expands the sheet into the episode page; releasing
// earlier springs everything back. Every value derives from the overscroll `o` and the `armed` spring `a`
// that fires when `o` crosses the threshold.
//
// The page scrolls the window, so the pull is read from touch and wheel deltas once the document cannot
// scroll any further (overscroll-behavior stops the native bounce). Per-frame values are written as CSS
// custom properties on the page container (the card inherits them) and on the sheet, never through React.
// The sheet itself is owned by the comics layout route (see ReadNextSheetController) so that it survives
// the route change and keeps covering the screen until the new page's first image is on screen.

// Visual overscroll at which the card is full and releasing opens the episode
export const PULL_THRESHOLD = 64;
// The page and the sheet rise this many times the overscroll, so more of the next page shows by the
// time the card arms
const PEEK_LIFT = 1.6;
// The sheet's top edge travels from where it is to the top of the screen in this time
export const SHEET_OPEN_DURATION = 300;
// How long the sheet may cover the screen after navigating before it drops on its own. Normally the new
// page dismisses it as soon as its first image has loaded; this only catches a page that never reports.
export const OPEN_FALLBACK_MS = 1500;
export const DISMISS_DURATION = 150;

// Rubber band: finger distance r -> visual overscroll o, so the pull resists like a native bounce
const RUBBER_K = 0.7;
const RUBBER_D = 260;
// Trackpad/mouse wheel deltas count for less and release after a short idle
const WHEEL_FACTOR = 0.6;
const WHEEL_RELEASE_MS = 170;
const ARMED_STIFFNESS = 520;
const ARMED_DAMPING = 17;
const RELEASE_STIFFNESS = 380;
const RELEASE_DAMPING = 30;
const REDUCED_MOTION_MS = 150;
// Pixels of scroll left before the end of the page that still count as "at the bottom"
const SCROLL_SLACK = 2;
const MAX_FRAME_MS = 50;
const SUBSTEP_S = 0.006;
const CSS_VARS = ['--rne-o', '--rne-p', '--rne-a', '--rne-open'] as const;

export type PullPhase = 'idle' | 'dragging' | 'settling' | 'opening' | 'opened';

// What the sheet shows: the target episode's title row and the top of its first page. Frozen when the
// sheet starts opening so it stays put while the route changes underneath.
export interface SheetContent {
  url: string;
  seriesUrl?: string;
  episodeName?: string | null;
  thumbnailUrl?: string;
  pageImageUrl?: string;
  pageAspectRatio?: number;
}

// Owned by the comics layout route and handed to the comic routes through the outlet context
export interface ReadNextSheetController {
  sheetRef: RefObject<HTMLDivElement | null>;
  getPhase: () => PullPhase;
  setPhase: (phase: PullPhase) => void;
  setArmed: (armed: boolean) => void;
  setContent: (content: SheetContent | null) => void;
  // The sheet covers the screen: start the fallback that drops it if the new page never reports in
  markOpened: () => void;
  // The new page's first image is on screen (or it has nothing to show): fade the sheet away
  contentReady: () => void;
  // Back to rest: sheet gone, ready for the next pull
  hardReset: () => void;
}

interface SheetPreview {
  // The target the preview was fetched for; a preview for another target is ignored rather than cleared
  forUuid: string;
  pageImageUrl?: string;
  pageAspectRatio?: number;
}

interface UseReadNextEpisodePullOptions {
  // A target issue exists and the card is rendered at the end of the page
  enabled: boolean;
  // The episode the card opens (mini details are enough)
  target: ComicIssue | null | undefined;
  comicseries: ComicSeries | null | undefined;
  // The route's outer page container: it receives the CSS variables and shifts up with the pull
  pageRef: RefObject<HTMLElement | null>;
}

const rubber = (r: number) => (r <= 0 ? 0 : (1 - 1 / ((r * RUBBER_K) / RUBBER_D + 1)) * RUBBER_D);
const rubberInverse = (o: number) =>
  o <= 0 ? 0 : o >= RUBBER_D - 1 ? 1e5 : (RUBBER_D * (1 / (1 - o / RUBBER_D) - 1)) / RUBBER_K;
const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);

// How far the page can still scroll before its end (<= 0 means the reader is at the bottom)
function remainingScroll(): number {
  if (window.visualViewport && window.visualViewport.scale !== 1) { return Infinity; }
  const doc = document.documentElement;
  return Math.ceil(doc.scrollHeight - window.innerHeight - window.scrollY) - SCROLL_SLACK;
}

function writeVars(element: HTMLElement, vars: Record<(typeof CSS_VARS)[number], string>) {
  for (const name of CSS_VARS) {
    element.style.setProperty(name, vars[name]);
  }
}

function clearVars(element: HTMLElement) {
  for (const name of CSS_VARS) {
    element.style.removeProperty(name);
  }
}

interface Engine {
  // Opens through the sheet (used by a click on the card); false when nothing could be opened
  open: () => boolean;
  // Pushes the latest live content to the sheet while it is peeking
  syncContent: () => void;
}

export type ReadNextEpisodePull = ReturnType<typeof useReadNextEpisodePull>;

// Reads touch and wheel input past the end of the page to detect the reader pulling past the
// ReadNextEpisode card. Drives the card's fill and the peek sheet from the pull, arms (with a vibration
// where supported) at the threshold, and on release past it expands the sheet and navigates to the
// episode. Releasing early springs the fill and sheet back. Clicking the card opens through the same
// sheet expansion.
export function useReadNextEpisodePull({ enabled, target, comicseries, pageRef }: UseReadNextEpisodePullOptions) {
  const controller = useOutletContext<ReadNextSheetController | undefined>();
  const navigate = useNavigate();
  const [preview, setPreview] = useState<SheetPreview | null>(null);
  const engineRef = useRef<Engine | null>(null);
  const prefetchedFor = useRef<string | undefined>(undefined);
  // Keeps the preloaded page images referenced until they have been fetched
  const preloaded = useRef<HTMLImageElement[]>([]);

  const targetUuid = target?.uuid;
  const targetSeriesUuid = target?.seriesUuid ?? comicseries?.uuid;
  const targetIsExclusive = !!target?.scopesForExclusiveContent?.includes('patreon');
  const url = target && comicseries
    ? getInkverseUrl({ type: 'comicissue', uuid: target.uuid, name: target.name, shortUrl: comicseries.shortUrl })
    : undefined;
  const seriesUrl = comicseries ? getInkverseUrl({ type: 'comicseries', shortUrl: comicseries.shortUrl }) : undefined;

  // The preview only applies to the target it was fetched for
  const livePreview = preview?.forUuid === targetUuid ? preview : null;

  const liveContent = useMemo<SheetContent | null>(() => {
    if (!url) { return null; }
    return {
      url,
      seriesUrl,
      episodeName: target?.name,
      thumbnailUrl: target?.thumbnailImageAsString
        ? getThumbnailImageUrl({ thumbnailImageAsString: target.thumbnailImageAsString })
        : undefined,
      pageImageUrl: targetIsExclusive ? undefined : livePreview?.pageImageUrl,
      pageAspectRatio: targetIsExclusive ? undefined : livePreview?.pageAspectRatio,
    };
  }, [url, seriesUrl, target?.name, target?.thumbnailImageAsString, targetIsExclusive, livePreview]);
  const liveContentRef = useRef(liveContent);
  liveContentRef.current = liveContent;
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  useEffect(() => {
    if (!enabled || !controller || typeof window === 'undefined') { return; }

    const st = {
      // Finger/wheel distance past the end of the page, and its rubber-banded visual overscroll (o)
      r: 0,
      o: 0,
      ov: 0,
      // Armed spring (a) and its velocity
      a: 0,
      av: 0,
      pastThreshold: false,
      hasTriggered: false,
      openStart: 0,
      openT: 0,
      lastY: 0,
      touching: false,
      prevented: false,
      raf: 0,
      last: 0,
      wheelTimer: null as ReturnType<typeof setTimeout> | null,
    };
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const phase = controller.getPhase;
    const isBusy = () => phase() === 'opening' || phase() === 'opened';

    const render = () => {
      const o = Math.max(0, st.o);
      const p = Math.min(o / PULL_THRESHOLD, 1);
      const lift = o * PEEK_LIFT;
      const vars = {
        '--rne-o': lift.toFixed(2),
        '--rne-p': p.toFixed(4),
        '--rne-a': st.a.toFixed(4),
        '--rne-open': st.openT.toFixed(4),
      };
      const page = pageRef.current;
      if (page) {
        writeVars(page, vars);
        // Only while pulling: a resting transform would make fixed-position modals inside the page
        // position against it instead of the viewport
        page.style.transform = lift > 0 ? `translateY(${(-lift).toFixed(2)}px)` : '';
      }
      const sheet = controller.sheetRef.current;
      if (sheet) { writeVars(sheet, vars); }
    };

    const resetLocal = () => {
      st.r = 0; st.o = 0; st.ov = 0; st.a = 0; st.av = 0;
      st.pastThreshold = false; st.hasTriggered = false; st.openT = 0;
      render();
    };

    const ensureLoop = () => {
      if (!st.raf) {
        st.last = performance.now();
        st.raf = requestAnimationFrame(frame);
      }
    };

    // Freeze the sheet content, expand the sheet to full screen, then hand over to the new page
    const commitOpen = (): boolean => {
      const content = liveContentRef.current;
      if (isBusy() || !content) { return false; }
      controller.setContent(content);
      controller.setPhase('opening');
      st.openStart = performance.now();
      st.openT = 0;
      ensureLoop();
      return true;
    };

    const finishOpen = () => {
      if (phase() !== 'opening') { return; }
      st.openT = 1;
      render();
      const content = liveContentRef.current;
      controller.markOpened();
      if (content) { navigateRef.current(content.url); }
    };

    const frame = (now: number) => {
      st.raf = 0;
      const dt = Math.min(now - st.last, MAX_FRAME_MS);
      st.last = now;
      const h = dt / 1000;
      const n = Math.max(1, Math.ceil(h / SUBSTEP_S));
      const hh = h / n;
      let p = phase();

      // The layout reset the sheet from under us (e.g. the reader went back mid-open)
      if (p === 'idle' && st.openT > 0) { resetLocal(); }

      if (p === 'settling') {
        for (let i = 0; i < n; i++) {
          const acc = -RELEASE_STIFFNESS * st.o - RELEASE_DAMPING * st.ov;
          st.ov += acc * hh;
          st.o += st.ov * hh;
        }
        if (Math.abs(st.o) < 0.3 && Math.abs(st.ov) < 4) {
          st.o = 0; st.ov = 0; st.r = 0; st.hasTriggered = false;
          controller.setPhase('idle');
          p = 'idle';
        }
      }

      if (p === 'opening') {
        st.openT = easeOutCubic(Math.min(1, (now - st.openStart) / SHEET_OPEN_DURATION));
        if (st.openT >= 1) {
          finishOpen();
          p = phase();
        }
      }

      // Only a drag can arm (a spring bouncing past the line opens nothing); disarming can happen any time
      const o = Math.max(0, st.o);
      const armedNow = p === 'opening' || p === 'opened'
        ? st.pastThreshold
        : o >= PULL_THRESHOLD && (p === 'dragging' || st.pastThreshold);
      if (armedNow !== st.pastThreshold) {
        st.pastThreshold = armedNow;
        controller.setArmed(armedNow);
        if (armedNow) {
          try { navigator.vibrate?.(8); } catch { /* unsupported */ }
        }
      }

      // The play circle pops only at the moment the card becomes ready: the spring's overshoot is the pop
      const armedTarget = st.pastThreshold ? 1 : 0;
      if (reduceMotion) {
        st.a += (armedTarget - st.a) * Math.min(1, dt / REDUCED_MOTION_MS);
        if (Math.abs(armedTarget - st.a) < 0.001) { st.a = armedTarget; }
        st.av = 0;
      } else {
        for (let i = 0; i < n; i++) {
          const acc = -ARMED_STIFFNESS * (st.a - armedTarget) - ARMED_DAMPING * st.av;
          st.av += acc * hh;
          st.a += st.av * hh;
        }
      }

      render();

      const armedSettled = Math.abs(st.a - armedTarget) < 0.001 && Math.abs(st.av) < 0.01;
      const done = (p === 'idle' && st.o === 0 && armedSettled) || p === 'opened';
      if (!done) { st.raf = requestAnimationFrame(frame); }
    };

    // Picking up the pull during the release spring continues from where it is rather than jumping
    const grabFromSpring = () => {
      if (phase() === 'settling') {
        st.o = Math.max(0, st.o);
        st.r = rubberInverse(st.o);
        st.ov = 0;
      }
    };

    const beginDrag = () => {
      if (phase() !== 'dragging') {
        st.hasTriggered = false;
        controller.setContent(liveContentRef.current);
        controller.setPhase('dragging');
      }
    };

    // Feeds the part of a delta past the end of the page into the pull; returns the leftover downward
    // delta once the pull is fully unwound
    const applyPull = (delta: number): number => {
      let d = delta;
      if (d > 0) {
        const remaining = remainingScroll();
        if (remaining > 0) { d -= remaining; }
      }
      if (d > 0) {
        st.r += d;
        d = 0;
      } else if (d < 0) {
        const take = Math.min(st.r, -d);
        st.r -= take;
        d += take;
      }
      st.o = rubber(st.r);
      return d;
    };

    const release = (allowCommit: boolean) => {
      if (isBusy()) { return; }
      const o = Math.max(0, st.o);
      if (allowCommit && o >= PULL_THRESHOLD && !st.hasTriggered) {
        st.hasTriggered = true;
        if (commitOpen()) { return; }
      }
      if (o > 0) {
        controller.setPhase('settling');
        st.ov = 0;
      } else {
        st.r = 0;
        controller.setPhase('idle');
      }
      ensureLoop();
    };

    const onTouchStart = (event: TouchEvent) => {
      if (isBusy() || event.touches.length !== 1) { st.touching = false; return; }
      st.touching = true;
      st.lastY = event.touches[0].clientY;
      st.hasTriggered = false;
      st.prevented = false;
      grabFromSpring();
      if (st.o > 0) {
        beginDrag();
        ensureLoop();
      }
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!st.touching || isBusy() || event.touches.length !== 1) { return; }
      const y = event.touches[0].clientY;
      const dy = st.lastY - y;
      st.lastY = y;
      if (dy === 0) { return; }
      if (st.r > 0 || (dy > 0 && remainingScroll() <= 0)) {
        beginDrag();
        const leftover = applyPull(dy);
        // Keeps the page from scrolling under a reversed pull. A no-op once the gesture has already
        // scrolled natively, which is fine: the page is pinned at its end by overscroll-behavior.
        if (event.cancelable) {
          event.preventDefault();
          st.prevented = true;
        }
        // The finger kept moving down after the pull unwound: scroll the page ourselves
        if (leftover < 0 && st.prevented) { window.scrollBy(0, leftover); }
        ensureLoop();
      }
    };

    const onTouchEnd = () => {
      if (!st.touching) { return; }
      st.touching = false;
      if (phase() === 'dragging') { release(true); }
    };

    const onTouchCancel = () => {
      if (!st.touching) { return; }
      st.touching = false;
      if (phase() === 'dragging') { release(false); }
    };

    const onWheel = (event: WheelEvent) => {
      // An overlay (e.g. the zoomable banner) already took this event
      if (event.defaultPrevented || isBusy()) { return; }
      const d = event.deltaMode === 1
        ? event.deltaY * 16
        : event.deltaMode === 2
          ? event.deltaY * window.innerHeight
          : event.deltaY;
      if (d === 0) { return; }
      if (st.r > 0 || (d > 0 && remainingScroll() <= 0)) {
        grabFromSpring();
        beginDrag();
        applyPull(d * WHEEL_FACTOR);
        if (st.wheelTimer) { clearTimeout(st.wheelTimer); }
        st.wheelTimer = setTimeout(() => {
          st.wheelTimer = null;
          if (phase() === 'dragging') { release(true); }
        }, WHEEL_RELEASE_MS);
        ensureLoop();
      }
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onTouchCancel, { passive: true });
    window.addEventListener('wheel', onWheel, { passive: true });
    // Stops the native bounce at the end of the page (iOS/macOS Safari) so the pull reads cleanly. An
    // inline style rather than a class: root.tsx rewrites the <html> class whenever the theme changes.
    const previousOverscroll = document.documentElement.style.overscrollBehaviorY;
    document.documentElement.style.overscrollBehaviorY = 'none';

    engineRef.current = {
      open: commitOpen,
      syncContent: () => {
        if (!isBusy() && phase() !== 'idle') { controller.setContent(liveContentRef.current); }
      },
    };

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchCancel);
      window.removeEventListener('wheel', onWheel);
      document.documentElement.style.overscrollBehaviorY = previousOverscroll;
      if (st.raf) { cancelAnimationFrame(st.raf); }
      if (st.wheelTimer) { clearTimeout(st.wheelTimer); }
      engineRef.current = null;
      const page = pageRef.current;
      if (page) {
        clearVars(page);
        page.style.transform = '';
      }
      // The route remounts for the new episode while the sheet is still covering it: the layout owns
      // that cover and drops it once the new page reports in
      if (phase() !== 'opened') { controller.hardReset(); }
    };
  }, [enabled, controller, pageRef, targetUuid]);

  // A preview that arrives mid-pull shows up in the peeking sheet
  useEffect(() => {
    engineRef.current?.syncContent();
  }, [liveContent]);

  // Click: the sheet rises from the bottom edge and expands, no fill
  const open = useCallback(() => engineRef.current?.open() ?? false, []);

  // Warm Apollo with the target episode, prefetch its first two pages and use the first one for the sheet
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
        for (const src of [pageImageUrl, secondPageImageUrl]) {
          if (!src) { continue; }
          const image = new Image();
          image.src = src;
          preloaded.current.push(image);
        }
        setPreview({
          forUuid: targetUuid,
          pageImageUrl,
          pageAspectRatio: story.width && story.height ? story.width / story.height : undefined,
        });
      })
      .catch(() => {});
  }, [targetUuid, targetSeriesUuid, targetIsExclusive]);

  return useMemo(() => ({ open, onCardVisible, preview: livePreview }), [open, onCardVisible, livePreview]);
}
