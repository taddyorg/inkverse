import { useLayoutEffect, useRef } from 'react';

import { ComicIssuePageFrame } from './ComicIssuePageFrame';
import type { PullPhase, ReadNextSheetController, SheetContent } from './readNextEpisodePull';

// Peek sheet for the pull-to-open motion: a full-screen panel pinned to the bottom of the viewport and
// translated down so that only the pull distance shows. While peeking it shows a grabber, the target
// episode's thumbnail and name and a hint; as it expands into the episode that compact header grows
// into the episode page's own header (Navbar height + "All Episodes" row) so the page image underneath
// lands exactly where the new page will draw it. Rendered once by the comics layout route.
const GRABBER_COLOR = '#DAD5D8';

interface ReadNextEpisodeSheetProps {
  controller: ReadNextSheetController;
  phase: PullPhase;
  armed: boolean;
  content: SheetContent | null;
}

export function ReadNextEpisodeSheet({ controller, phase, armed, content }: ReadNextEpisodeSheetProps) {
  const fullHeaderRef = useRef<HTMLDivElement>(null);
  const contentStartRef = useRef<HTMLDivElement>(null);

  // Measure where the new page's first image will start: the Navbar plus the page frame above the content
  useLayoutEffect(() => {
    if (phase !== 'opening') { return; }
    const sheet = controller.sheetRef.current;
    const fullHeader = fullHeaderRef.current;
    const contentStart = contentStartRef.current;
    if (!sheet || !fullHeader || !contentStart) { return; }
    const navHeight = document.getElementById('top-nav')?.getBoundingClientRect().height ?? 0;
    const frameHeight = contentStart.getBoundingClientRect().top - fullHeader.getBoundingClientRect().top;
    sheet.style.setProperty('--rne-nav-height', `${navHeight}px`);
    sheet.style.setProperty('--rne-full-header', `${navHeight + frameHeight}px`);
  }, [phase, controller]);

  if (phase === 'idle' || !content) { return null; }

  const busy = phase === 'opening' || phase === 'opened';
  const aspectRatio = content.pageAspectRatio
    ?? (typeof window !== 'undefined' ? window.innerWidth / window.innerHeight : 0.7);

  return (
    <div className={`fixed inset-0 z-50 ${busy ? '' : 'pointer-events-none'}`} aria-hidden="true" data-armed={armed}>
      <div ref={controller.sheetRef} className="rne-sheet bg-paper-pink dark:bg-inkverse-black">
        <div className="rne-sheet-header">
          <div className="rne-sheet-peek">
            <div
              className="absolute left-1/2 -translate-x-1/2 w-10 h-[5px] rounded-full"
              style={{ top: 9, backgroundColor: GRABBER_COLOR }}
            />
            <div className="mx-auto zoomed-in:max-w-3xl max-w-xl flex items-center gap-3 px-4 pt-5 pb-3">
              {content.thumbnailUrl && (
                <img src={content.thumbnailUrl} alt="" className="w-11 h-11 rounded-[11px] object-cover shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-bold truncate">{content.episodeName}</p>
                <div className="relative h-5 text-sm">
                  <span className="rne-hint-keep absolute left-0 top-0 whitespace-nowrap text-gray-500 dark:text-gray-400">
                    Keep pulling to open
                  </span>
                  <span className="rne-hint-release absolute left-0 top-0 whitespace-nowrap font-bold text-brand-pink dark:text-brand-purple">
                    Release to open
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div ref={fullHeaderRef} className="rne-sheet-full">
            <div style={{ height: 'var(--rne-nav-height, 0px)' }} />
            <div inert>
              <ComicIssuePageFrame comicSeriesLink={content.seriesUrl} contentRef={contentStartRef} />
            </div>
          </div>
        </div>
        {content.pageImageUrl && (
          <div className="mx-auto zoomed-in:max-w-3xl max-w-xl sm:px-6 lg:px-8">
            <img
              src={content.pageImageUrl}
              alt=""
              className="block w-full select-none"
              style={{ aspectRatio }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
