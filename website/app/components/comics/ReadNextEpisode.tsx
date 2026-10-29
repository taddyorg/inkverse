import { useEffect, useRef, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { MdLock, MdPlayArrow } from 'react-icons/md';

import type { ComicIssue, ComicSeries, Creator } from '@inkverse/shared-client/graphql/operations';
import { getThumbnailImageUrl } from '@inkverse/public/comicissue';
import { getInkverseUrl } from '@inkverse/public/utils';
import { SuperLikeButton } from './SuperLikeButton';
import type { ReadNextEpisodePull } from './readNextEpisodePull';

// How far ahead of the viewport the card starts prefetching its target episode
const PREFETCH_ROOT_MARGIN = '600px';

interface ReadNextEpisodeProps {
  comicissue: ComicIssue | null | undefined;
  comicseries: ComicSeries | null | undefined;
  showEmptyState?: boolean;
  firstTextCTA?: string;
  secondTextCTA?: string;
  // Enables the ink fill and the peek sheet (see useReadNextEpisodePull)
  pull?: ReadNextEpisodePull;
  // A plain click opens through the sheet too (otherwise it is a regular link navigation)
  openOnClick?: boolean;
  // SuperLike props (optional - only shown in empty state when authenticated)
  isAuthenticated?: boolean;
  isSuperLikeLoading?: boolean;
  onSuperLike?: () => void;
  hasLikedAllEpisodes?: boolean;
}

export function ReadNextEpisode({
  comicissue,
  comicseries,
  showEmptyState = true,
  firstTextCTA = 'NEXT',
  secondTextCTA = 'EPISODE',
  pull,
  openOnClick = false,
  isAuthenticated,
  isSuperLikeLoading,
  onSuperLike,
  hasLikedAllEpisodes,
}: ReadNextEpisodeProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const onCardVisible = pull?.onCardVisible;
  const issueUuid = comicissue?.uuid;

  // Prefetch the target once the card is near the viewport
  useEffect(() => {
    const element = wrapperRef.current;
    if (!element || !onCardVisible || !issueUuid || typeof IntersectionObserver === 'undefined') { return; }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        onCardVisible();
        observer.disconnect();
      }
    }, { rootMargin: PREFETCH_ROOT_MARGIN });
    observer.observe(element);
    return () => observer.disconnect();
  }, [onCardVisible, issueUuid]);

  if (!comicseries) { return null; }

  if (!comicissue) {
    if (!showEmptyState) { return null; }
    return (
      <div className="w-full mt-6 px-4">
        <div className="text-center mt-8">
          <p className="text-lg font-normal">You are up to date with this series!</p>
          {isAuthenticated && onSuperLike && (
            <SuperLikeButton
              isLoading={isSuperLikeLoading ?? false}
              onPress={onSuperLike}
              hasLikedAll={hasLikedAllEpisodes ?? false}
              creators={comicseries.creators?.filter((creator): creator is Creator => creator !== null) ?? []}
            />
          )}
        </div>
      </div>
    );
  }

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!pull || !openOnClick) { return; }
    // Modified clicks keep their link behaviour (new tab, etc.)
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) { return; }
    if (pull.open()) { event.preventDefault(); }
  };

  const bodyProps = { comicissue, firstTextCTA, secondTextCTA };

  return (
    <div className="w-full mt-6">
      <div ref={wrapperRef} className={`relative w-full ${pull ? 'rne-card' : ''}`}>
        <Link
          to={getInkverseUrl({ type: 'comicissue', uuid: comicissue.uuid, name: comicissue.name, shortUrl: comicseries.shortUrl }) || ''}
          prefetch="viewport"
          onClick={handleClick}
          className="block w-full"
          aria-label={`${firstTextCTA} ${secondTextCTA}: ${comicissue.name ?? ''}`}
        >
          <div className="relative overflow-hidden rounded-[27px] border-[3px] border-brand-pink dark:border-brand-purple bg-white">
            <CardBody {...bodyProps} variant="base" />
            {pull && (
              // Second copy of the card, clipped from the top, so the colour edge crosses the text as it rises
              <CardBody {...bodyProps} variant="fill" />
            )}
          </div>
        </Link>
      </div>
    </div>
  );
}

interface CardBodyProps {
  comicissue: ComicIssue;
  firstTextCTA: string;
  secondTextCTA: string;
  // 'base' is the resting card; 'fill' is the inverted copy revealed by the pull
  variant: 'base' | 'fill';
}

// The card's contents, rendered twice with identical layout so the fill copy lines up with the base
function CardBody({ comicissue, firstTextCTA, secondTextCTA, variant }: CardBodyProps) {
  const inverted = variant === 'fill';
  const textColor = inverted ? 'text-white' : 'text-brand-pink dark:text-brand-purple';
  const circleColor = inverted ? 'bg-white' : 'bg-brand-pink dark:bg-brand-purple';
  const arrowColor = inverted ? 'text-brand-pink dark:text-brand-purple' : 'text-white';
  const isPatreonExclusive = comicissue.scopesForExclusiveContent?.includes('patreon');

  return (
    <div
      className={`flex items-center gap-2 p-[18px] ${inverted ? 'rne-fill absolute inset-0 bg-brand-pink dark:bg-brand-purple pointer-events-none' : ''}`}
      aria-hidden={inverted || undefined}
    >
      {comicissue.thumbnailImageAsString && (
        <div className="relative shrink-0">
          <img
            src={getThumbnailImageUrl({ thumbnailImageAsString: comicissue.thumbnailImageAsString })}
            alt=""
            className="w-[90px] h-[90px] rounded-[18px] object-cover"
          />
          {isPatreonExclusive && (
            <div className="absolute inset-0 flex items-center justify-center">
              <MdLock size={50} className={textColor} />
            </div>
          )}
        </div>
      )}
      <div className={`flex-1 min-w-0 text-center ${textColor}`}>
        <p className="text-2xl font-bold leading-tight">{firstTextCTA.toUpperCase()}</p>
        <p className="text-2xl font-bold leading-tight">{secondTextCTA.toUpperCase()}</p>
        {isPatreonExclusive && (
          <p className="text-sm font-semibold mt-2">PATREON EXCLUSIVE</p>
        )}
      </div>
      {/* Fixed slot so the circle can grow when armed without shifting the label */}
      <div className="w-[62px] h-[62px] shrink-0 grid place-items-center">
        <div className={`rne-play w-14 h-14 rounded-full grid place-items-center ${circleColor}`}>
          <MdPlayArrow size={36} className={`rne-play-arrow ${arrowColor}`} />
        </div>
      </div>
    </div>
  );
}
