import { ComicIssueDetails } from './ComicIssueDetails';
import type { ComicSeries, ComicIssue } from '@inkverse/shared-client/graphql/types';
import { useState, useMemo } from 'react';
import { FaSortAmountDown, FaSortAmountUp } from 'react-icons/fa';

type ComicIssuesBoxProps = {
  comicseries: ComicSeries | null | undefined;
  issues: ComicIssue[] | null | undefined;
  currentIssueUuid: string | undefined;
}
  
export function ComicIssuesList(props: ComicIssuesBoxProps) {
  const { comicseries, issues, currentIssueUuid } = props;
  const [isNewestFirst, setIsNewestFirst] = useState(false);

  if (!comicseries || !issues) {
    return <></>;
  }

  const sortedIssues = useMemo(() => {
    return [...issues].sort((a, b) => {
      const posA = a.position ?? 0;
      const posB = b.position ?? 0;
      
      return isNewestFirst 
        ? posB - posA // Newest first
        : posA - posB; // Oldest first
    });
  }, [issues, isNewestFirst]);

  const toggleSortOrder = () => {
    setIsNewestFirst(!isNewestFirst);
  };

  return (
    <div className="mt-2 mb-4 px-4 sm:px-6 lg:px-8 rounded-md">
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
      {sortedIssues.map((comicissue, index) => (
        <ComicIssueDetails
          key={comicissue.uuid}
          comicseries={comicseries}
          comicissue={comicissue}
          position={isNewestFirst 
            ? sortedIssues.length - 1 - index // Count down for newest first
            : index // Count up for oldest first
          }
          isCurrentIssue={comicissue.uuid === currentIssueUuid}
        />
      ))}
    </div>
  );
}