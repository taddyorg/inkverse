import { useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router';

import { ReadNextEpisodeSheet } from '../components/comics/ReadNextEpisodeSheet';
import {
  DISMISS_DURATION,
  OPEN_FALLBACK_MS,
  type PullPhase,
  type ReadNextSheetController,
  type SheetContent,
} from '../components/comics/readNextEpisodePull';

// Pathless layout around the comic series and episode routes. It outlives the navigation between them,
// so it owns the read-next-episode peek sheet: the sheet expands over the current page, the next page
// loads underneath, and the sheet drops once that page reports its first image is on screen.
export default function ComicsLayout() {
  const [phase, setPhaseState] = useState<PullPhase>('idle');
  const [armed, setArmed] = useState(false);
  const [content, setContent] = useState<SheetContent | null>(null);
  const phaseRef = useRef<PullPhase>('idle');
  const contentRef = useRef<SheetContent | null>(null);
  contentRef.current = content;
  const sheetRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const location = useLocation();

  const controller = useMemo<ReadNextSheetController>(() => {
    const clearTimer = () => {
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
    };
    const setPhase = (next: PullPhase) => {
      phaseRef.current = next;
      setPhaseState(next);
    };
    const hardReset = () => {
      clearTimer();
      setPhase('idle');
      setArmed(false);
      setContent(null);
      const sheet = sheetRef.current;
      if (sheet) {
        sheet.style.opacity = '';
        for (const name of ['--rne-o', '--rne-p', '--rne-a', '--rne-open', '--rne-full-header', '--rne-nav-height']) {
          sheet.style.removeProperty(name);
        }
      }
    };
    // Once the new page has rendered underneath the expanded sheet, fade the sheet away and reset
    const contentReady = () => {
      if (phaseRef.current !== 'opened') { return; }
      clearTimer();
      const sheet = sheetRef.current;
      if (sheet) { sheet.style.opacity = '0'; }
      timer.current = setTimeout(hardReset, DISMISS_DURATION);
    };
    const markOpened = () => {
      setPhase('opened');
      clearTimer();
      timer.current = setTimeout(contentReady, OPEN_FALLBACK_MS);
    };
    return {
      sheetRef,
      getPhase: () => phaseRef.current,
      setPhase,
      setArmed,
      setContent,
      markOpened,
      contentReady,
      hardReset,
    };
  }, []);

  // A location change is either the page the sheet opened (keep covering until it reports in) or
  // something else, such as the reader going back, which drops everything
  useEffect(() => {
    if (phaseRef.current === 'idle') { return; }
    const expected = contentRef.current?.url;
    if (phaseRef.current === 'opened' && expected && location.pathname === expected) { return; }
    controller.hardReset();
  }, [location.key, controller]);

  useEffect(() => () => {
    if (timer.current) { clearTimeout(timer.current); }
  }, []);

  return (
    <>
      <Outlet context={controller} />
      <ReadNextEpisodeSheet controller={controller} phase={phase} armed={armed} content={content} />
    </>
  );
}
