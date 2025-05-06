import { Link } from 'react-router-dom';
import { MdLock } from 'react-icons/md';

import type { ComicIssue, ComicSeries } from '@inkverse/shared-client/graphql/types';
import { getThumbnailImageUrl } from '@inkverse/public/comicissue';
import { getInkverseUrl } from '@inkverse/public/utils';

interface ReadNextEpisodeProps {
  comicissue: ComicIssue | null | undefined;
  comicseries: ComicSeries | null | undefined;
  showEmptyState?: boolean;
  firstTextCTA?: string;
  secondTextCTA?: string;
}

export function ReadNextEpisode({ 
  comicissue, 
  comicseries,
  showEmptyState = true, 
  firstTextCTA = 'NEXT', 
  secondTextCTA = 'EPISODE' 
}: ReadNextEpisodeProps) {
  if (!comicseries) { return null; }
  
  if (!comicissue) {
    if (!showEmptyState) { return null; }
    return (
      <div className="w-full mt-6 px-4">
        <div className="text-center mt-8">
          <p className="text-lg font-medium">You are up to date with this series!</p>
        </div>
      </div>
    );
  }

  const isPatreonExclusive = comicissue.scopesForExclusiveContent?.includes('patreon');

  const NextEpisodeContent = () => (
    <div className={`flex items-center p-4 bg-white rounded-3xl border-2 border-brand-pink dark:border-brand-purple ${isPatreonExclusive ? '' : 'hover:opacity-80 transition-opacity duration-100'}`}>
      {comicissue.thumbnailImageAsString && (
        <div className="relative">
          <img
            src={getThumbnailImageUrl({ thumbnailImageAsString: comicissue.thumbnailImageAsString })}
            alt="Next Episode Thumbnail"
            className={`w-32 h-32 rounded-2xl object-cover ${isPatreonExclusive ? 'opacity-50' : ''}`}
          />
          {isPatreonExclusive && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <MdLock size={50} className="text-brand-pink dark:text-brand-purple" />
            </div>
          )}
        </div>
      )}
      <div className="flex-1 text-center">
        <p className="text-2xl font-bold text-brand-pink dark:text-brand-purple">{firstTextCTA}</p>
        <p className="text-2xl font-bold text-brand-pink dark:text-brand-purple">{secondTextCTA}</p>
        {isPatreonExclusive && (
          <p className="text-sm font-medium text-brand-pink dark:text-brand-purple mt-2">PATREON EXCLUSIVE</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="w-full mt-6">
      {isPatreonExclusive ? (
        <div className="block w-full overflow-hidden">
          <NextEpisodeContent />
        </div>
      ) : (
        <Link 
          to={getInkverseUrl({ type: 'comicissue', uuid: comicissue.uuid, name: comicissue.name, shortUrl: comicseries.shortUrl }) || ''}
          className="block w-full overflow-hidden"
        >
          <NextEpisodeContent />
        </Link>
      )}
    </div>
  );
} 