import { FaRegFlag } from 'react-icons/fa';
import { useState } from 'react';

import type { ComicSeries } from '@inkverse/shared-client/graphql/operations';
import { getPrettySeriesStatus } from '@inkverse/public/status';
import { getPrettyContentRating } from '@inkverse/public/ratings';
import { ReportModal } from '../ui/ReportModal';

interface ComicSeriesInfoProps {
  comicseries: ComicSeries;
}

export function ComicSeriesInfo({ comicseries }: ComicSeriesInfoProps) {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  return (
    <div className="mt-6 px-8 sm:px-10 lg:px-12">
      <div className="grid grid-cols-2 gap-4 mb-4">
        {comicseries.status && (
          <div>
            <p className="text-sm text-muted-foreground mb-1">Series Status</p>
            <p className="text-base">{getPrettySeriesStatus(comicseries.status)}</p>
          </div>
        )}
        {comicseries.contentRating && (
          <div>
            <p className="text-sm text-muted-foreground mb-1">Age Rating</p>
            <p className="text-base">{getPrettyContentRating(comicseries.contentRating)}</p>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4 items-center">
        <div>
          <p className="text-sm text-muted-foreground mb-1"># of Episodes</p>
          <p className="text-base">{comicseries.issueCount || 0}</p>
        </div>
        <div className="flex">
          <button 
            onClick={() => setIsReportModalOpen(true)}
            className="inline-flex items-center hover:opacity-80 transition-opacity duration-100">
            <FaRegFlag className="h-4 w-4 mr-2" />
            Report Comic
          </button>
        </div>
      </div>

      <ReportModal
        variant="comicseries"
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        uuid={comicseries.uuid}
      />
    </div>
  );
} 