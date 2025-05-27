import { useRef, useState, useEffect } from 'react';
import { MdChevronLeft, MdChevronRight, MdLock } from 'react-icons/md';

import type { ComicSeries, ComicIssue } from '@inkverse/shared-client/graphql/operations';
import { getInkverseUrl } from '@inkverse/public/utils';
import { Link } from 'react-router-dom';
import { getThumbnailImageUrl } from '@inkverse/public/comicseries';

interface GridOfComicIssuesProps {
  comicseries: ComicSeries | null | undefined;
  comicissue: ComicIssue | null | undefined;
  allIssues: ComicIssue[] | null | undefined;
}

export const GridOfComicIssues = (props: GridOfComicIssuesProps) => {
  const { comicseries, comicissue, allIssues } = props;
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const checkScrollPosition = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  const scrollToCurrentIssue = () => {
    if (scrollRef.current && comicissue?.uuid) {
      const currentIssueElement = scrollRef.current.querySelector(`[data-issue-id="${comicissue.uuid}"]`);
      if (currentIssueElement) {
        const scrollContainer = scrollRef.current;
        const elementOffset = (currentIssueElement as HTMLElement).offsetLeft;
        const containerWidth = scrollContainer.clientWidth;
        const elementWidth = currentIssueElement.clientWidth;
        
        const scrollPosition = elementOffset - (containerWidth / 2) + (elementWidth / 2);
        
        scrollContainer.scrollTo({
          left: scrollPosition,
          behavior: 'instant'
        });
      }
    }
  };

  useEffect(() => {
    checkScrollPosition();
    scrollToCurrentIssue();
    window.addEventListener('resize', checkScrollPosition);
    return () => window.removeEventListener('resize', checkScrollPosition);
  }, [comicissue?.uuid]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth / 2;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="relative overflow-hidden mt-4">
      {showLeftArrow && (
        <button
          className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-30 dark:bg-opacity-50 p-2 rounded-r-md z-10"
          onClick={() => scroll('left')}
        >
          <MdChevronLeft size={24} />
        </button>
      )}
      {showRightArrow && (
        <button
          className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-30 dark:bg-opacity-50 p-2 rounded-l-md z-10"
          onClick={() => scroll('right')}
        >
          <MdChevronRight size={24} />
        </button>
      )}
      <div
        ref={scrollRef}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
        onScroll={checkScrollPosition}
      >
        {allIssues && allIssues.map((issue) => (
          <PreviewComicIssueWrapper 
            key={issue.uuid} 
            comicissue={issue} 
            comicseries={comicseries} 
            isCurrentIssue={issue.uuid === comicissue?.uuid}
          />
        ))}
      </div>
    </div>
  );
}; 

type PreviewComicIssueProps = {
  comicseries: ComicSeries | null | undefined;
  comicissue: ComicIssue | null | undefined;
  isCurrentIssue: boolean;
}

export const PreviewComicIssueWrapper = (props: PreviewComicIssueProps) => {
  const { comicseries, comicissue, isCurrentIssue } = props;
  if (!comicseries || !comicissue) {
    return null;
  }

  const wrapperProps = {
    className: `flex-shrink-0 w-1/2 md:w-1/3 zoomed-in:w-1/4 p-2 snap-start`,
    'data-issue-id': comicissue?.uuid
  };

  if (comicissue?.scopesForExclusiveContent && comicissue?.scopesForExclusiveContent.includes('patreon')) {
    return (
      <div {...wrapperProps}>
        <PreviewComicIssue 
          comicseries={comicseries} 
          comicissue={comicissue} 
          isCurrentIssue={isCurrentIssue} />
      </div>
    );
  } else if (isCurrentIssue) {
    return (
      <div {...wrapperProps}>
        <PreviewComicIssue 
          comicseries={comicseries} 
          comicissue={comicissue} 
          isCurrentIssue={isCurrentIssue} 
        />
      </div>
    );
  }

  const comicIssueLink = getInkverseUrl({ type: "comicissue", shortUrl: comicseries?.shortUrl, name: comicissue?.name, uuid: comicissue?.uuid });
  if (!comicIssueLink) return null;

  return (
    <Link to={comicIssueLink} {...wrapperProps}>
      <PreviewComicIssue 
        comicseries={comicseries} 
        comicissue={comicissue} 
        isCurrentIssue={isCurrentIssue} 
      />
    </Link>
  );
};

const PreviewComicIssue = (props: PreviewComicIssueProps) => {
  const { comicissue, isCurrentIssue } = props;
  const isPatreonExclusive = comicissue?.scopesForExclusiveContent && comicissue?.scopesForExclusiveContent.includes('patreon');

  return (
    <div className={`rounded-lg p-4 relative ${isCurrentIssue ? 'ring-2 ring-brand-pink' : ''}`}>
      <div className="relative">
        <img 
          src={getThumbnailImageUrl({ thumbnailImageAsString: comicissue?.thumbnailImageAsString })} 
          alt={comicissue?.name || undefined} 
          className={`w-full h-40 object-cover rounded-lg ${isCurrentIssue ? 'opacity-100' : isPatreonExclusive ? 'opacity-50' : 'opacity-70'}`} 
        />
        {isPatreonExclusive && (
          <div className="absolute inset-0 flex items-center justify-center">
            <MdLock size={60} />
          </div>
        )}
      </div>
      <p className={`font-bold mt-1 ${isCurrentIssue ? 'text-brand-pink' : isPatreonExclusive ? 'text-gray-400' : 'text-gray-500'}`}>
        {comicissue?.name} {isPatreonExclusive ? "(PATREON EXCLUSIVE)" : ""}
      </p>
    </div>
  );
};