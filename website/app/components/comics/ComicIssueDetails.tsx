import { Link } from 'react-router-dom';
import { MdLock, MdFavorite, MdFavoriteBorder } from 'react-icons/md';

import { prettyFormattedDate, prettyFormattedFreeInDays } from '@inkverse/shared-client/utils/date';
import { getThumbnailImageUrl } from '@inkverse/public/comicseries';
import { getInkverseUrl } from '@inkverse/public/utils';
import type { ComicSeries, ComicIssue } from '@inkverse/shared-client/graphql/operations';

type ComicIssueDetailsProps = {
  comicseries: ComicSeries,
  comicissue: ComicIssue,
  position: number,
  isCurrentIssue?: boolean,
  isLiked?: boolean,
  isLikeLoading?: boolean,
  onLikePress?: () => void,
};

export const ComicIssueDetails = ({ comicseries, comicissue, position, isCurrentIssue, isLiked, isLikeLoading, onLikePress }: ComicIssueDetailsProps) => {
  const freeInDaysText = prettyFormattedFreeInDays(comicissue.dateExclusiveContentAvailable || undefined);
  const isPatreonExclusive = comicissue.scopesForExclusiveContent && comicissue.scopesForExclusiveContent.includes('patreon');

  const handleLikeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onLikePress?.();
  };

  const dateAndFreeContent = (
    <div className="text-sm">
      {comicissue.datePublished && prettyFormattedDate(new Date(comicissue.datePublished * 1000))}
      {freeInDaysText && freeInDaysText > 0 && (
        <>
          <span className="mx-1">·</span>
          <span className="text-brand-pink">{`Free in ${freeInDaysText} day${freeInDaysText > 1 ? 's' : ''}`}</span>
        </>
      )}
    </div>
  );

  const linkToComicIssue = getInkverseUrl({ type: "comicissue", shortUrl: comicseries.shortUrl, name: comicissue.name, uuid: comicissue.uuid });
  if (!linkToComicIssue) {
    return <></>;
  }

  return (
    <Link to={linkToComicIssue} className="block">
      <div className={`flex justify-between items-center ${isCurrentIssue ? 'bg-brand-pink dark:bg-brand-purple rounded-2xl py-2 mb-2' : 'h-16 mb-2'}`}>
        <div className="flex items-center pl-4">
          <div className="w-16 h-16 mr-4 relative">
            <img 
              src={getThumbnailImageUrl({ thumbnailImageAsString: comicissue.thumbnailImageAsString })} 
              alt={comicissue.name || ''}
              className='w-full h-full rounded-2xl object-cover'
            />
            {isPatreonExclusive && (
              <div className="absolute inset-0 flex items-center justify-center">
                <MdLock size={30} className="text-brand-pink dark:text-white" />
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <h2 className={`text-base font-normal m-0 ${isCurrentIssue ? 'text-white' : ''}`}>{comicissue.name}</h2>
            <div className={isCurrentIssue ? 'text-white' : ''}>
            {isPatreonExclusive
              ? <div className="text-sm">
                  {dateAndFreeContent}
                  <p className="font-semibold mt-1 text-brand-pink">
                    PATREON EXCLUSIVE
                  </p>
                </div>
              : <>{dateAndFreeContent}</>
            }
            </div>
          </div>
        </div>
        <div className="flex items-center pr-4 gap-3">
          {onLikePress && (
            <button
              onClick={handleLikeClick}
              disabled={isLikeLoading}
              className="flex items-center gap-1 px-2 py-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              {isLikeLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
              ) : isLiked ? (
                <MdFavorite className={isCurrentIssue ? "text-white font-bold" : "text-rose-500"} size={18} />
              ) : (
                <MdFavoriteBorder className={isCurrentIssue ? "text-white font-bold" : ""} size={18} />
              )}
            </button>
          )}
          <span className={`text-base ${isCurrentIssue ? 'text-white font-bold' : ''}`}>
            #{position + 1}
          </span>
        </div>
      </div>
    </Link>
  );
}