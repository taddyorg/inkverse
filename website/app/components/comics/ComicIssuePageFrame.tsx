import type { ReactNode, Ref } from 'react';
import { Link } from 'react-router-dom';
import { MdChevronLeft } from 'react-icons/md';

interface ComicIssuePageFrameProps {
  // Link back to the series; the row is left empty without one
  comicSeriesLink?: string | null;
  // 'reader' is the page with the episode's pages; 'gate' is a sign-up / Patreon / spinner state
  variant?: 'reader' | 'gate';
  // Marks where the page content (the first page image) starts, for the peek sheet to measure
  contentRef?: Ref<HTMLDivElement>;
  ref?: Ref<HTMLDivElement>;
  children?: ReactNode;
}

// The episode page's outer column and its "All Episodes" row. The read-next-episode peek sheet renders
// the same frame so that, when the sheet expands into the next episode, the page lands exactly where
// the sheet drew it.
export function ComicIssuePageFrame({ comicSeriesLink, variant = 'reader', contentRef, ref, children }: ComicIssuePageFrameProps) {
  return (
    <div ref={ref} className="mx-auto sm:p-6 lg:p-8 zoomed-in:max-w-3xl max-w-xl">
      <div className={`flex flex-col ${variant === 'reader' ? 'py-4 sm:py-2' : 'py-4 sm:py-0'}`}>
        <div className="flex items-center mb-2">
          {comicSeriesLink && <AllEpisodesLink to={comicSeriesLink} />}
        </div>
        {contentRef && <div ref={contentRef} />}
        {children}
      </div>
    </div>
  );
}

// "‹ All Episodes" back to the series, shown at the top of the frame and again near the end of the episode
export function AllEpisodesLink({ to }: { to: string }) {
  return (
    <Link to={to} className="flex flex-row mr-2">
      <MdChevronLeft size={24} />
      <p className="font-semibold">All Episodes</p>
    </Link>
  );
}
