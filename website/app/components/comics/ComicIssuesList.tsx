import { ComicIssueDetails } from './ComicIssueDetails';
import type { ComicSeries, ComicIssue } from '@inkverse/shared-client/graphql/operations';
import { useState, useMemo } from 'react';
import { FaSortAmountDown, FaSortAmountUp } from 'react-icons/fa';

type ComicIssuesBoxProps = {
  comicseries: ComicSeries | null | undefined;
  issues: ComicIssue[] | null | undefined;
  currentIssueUuid: string | undefined;
  likedIssueUuids?: string[];
  issueLikeLoadingMap?: Record<string, boolean>;
  onLikeIssue?: (issueUuid: string) => void;
  initialVisibleCount?: number;
}

export function ComicIssuesList(props: ComicIssuesBoxProps) {
  const { comicseries, issues, currentIssueUuid, likedIssueUuids, issueLikeLoadingMap, onLikeIssue, initialVisibleCount } = props;
  const [isNewestFirst, setIsNewestFirst] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const sortedIssues = useMemo(() => {
    return [...(issues ?? [])].sort((a, b) => {
      const posA = a.position ?? 0;
      const posB = b.position ?? 0;
      
      return isNewestFirst 
        ? posB - posA // Newest first
        : posA - posB; // Oldest first
    });
  }, [issues, isNewestFirst]);

  if (!comicseries || !issues) {
    return <></>;
  }

  // Collapse to the first few episodes (in the current sort order) until expanded
  const isCollapsible = !!initialVisibleCount && sortedIssues.length > initialVisibleCount;
  const visibleIssues = isCollapsible && !isExpanded ? sortedIssues.slice(0, initialVisibleCount) : sortedIssues;

  const toggleSortOrder = () => {
    setIsNewestFirst(!isNewestFirst);
  };

  return (
    <div className="mb-4 px-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className='text-2xl font-semibold'>Episodes</h2>
        <button 
          onClick={toggleSortOrder}
          className="flex items-center px-2 py-1 rounded hover:opacity-80 transition-opacity duration-100"
        >
          {isNewestFirst 
            ? <FaSortAmountUp size={20} />
            : <FaSortAmountDown size={20} />
          }
        </button>
      </div>
      {visibleIssues.map((comicissue, index) => {
        const isLiked = likedIssueUuids?.includes(comicissue.uuid) || false;
        const isLikeLoading = issueLikeLoadingMap?.[comicissue.uuid] || false;

        return (
          <ComicIssueDetails
            key={comicissue.uuid}
            comicseries={comicseries}
            comicissue={comicissue}
            position={isNewestFirst
              ? sortedIssues.length - 1 - index // Count down for newest first
              : index // Count up for oldest first
            }
            isCurrentIssue={comicissue.uuid === currentIssueUuid}
            isLiked={isLiked}
            isLikeLoading={isLikeLoading}
            onLikePress={onLikeIssue ? () => onLikeIssue(comicissue.uuid) : undefined}
          />
        );
      })}
      {isCollapsible && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="block mx-auto mt-2 h-10 px-6 rounded-full border border-current text-base hover:opacity-80 transition-opacity duration-100"
        >
          {isExpanded ? 'Show less episodes' : 'See all episodes'}
        </button>
      )}
    </div>
  );
}