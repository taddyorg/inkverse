import type { ReactNode } from 'react';
import { Link } from "react-router";
import { MdFavorite } from 'react-icons/md';
import { BsFillChatFill } from 'react-icons/bs';

import type { ComicSeries } from '@inkverse/shared-client/graphql/operations';
import { getInkverseUrl, formatCompactNumber } from '@inkverse/public/utils';
import { getPrettyGenre } from '@inkverse/public/genres';
import { getBannerImageUrl, getCoverImageUrl, getThumbnailImageUrl } from '@inkverse/public/comicseries';
import { getGenreAndTagPills } from '@inkverse/shared-client/utils/genre-tag-pills';
import { ExpandableText } from '../ui/ExpandableText';

export type ComicSeriesPageType =
  | 'comicseries-screen'
  | 'featured-banner'
  | 'most-popular'
  | 'cover'
  | 'grid-item-with-genres'
  | 'search'
  | 'list-item'
  | 'list-item-no-link';

type ComicSeriesDetailsProps = {
  comicseries: ComicSeries | null | undefined;
  pageType: ComicSeriesPageType;
  index?: number;
  likeCount?: number;
  commentCount?: number;
  // Rendered between the stats and the description on the comicseries screen
  actions?: ReactNode;
}

export function ComicSeriesDetails(props: ComicSeriesDetailsProps){
  const { comicseries, pageType, likeCount, commentCount, actions } = props;

  if (!comicseries) { return <></>; }

  if (pageType === 'most-popular') {
      const link = getInkverseUrl({ type: "comicseries", shortUrl: comicseries.shortUrl });
      if (!link) { return <></>; }

      return (
        <Link to={link} className="flex flex-row">
          <CoverArt comicseries={comicseries} pageType={pageType} />
          <div className="flex flex-col px-2">
            <Name comicseries={comicseries} pageType={pageType} />
            <Genre comicseries={comicseries} pageType={pageType} />
          </div>
        </Link>
      );
  }

  else if (pageType === 'featured-banner') {
      const link = getInkverseUrl({ type: "comicseries", shortUrl: comicseries.shortUrl });
      if (!link) { return <></>; }

      return (
        <Link to={link}>
          <CoverArt comicseries={comicseries} pageType={pageType} />
        </Link>
      );
  }

  else if (pageType === 'cover') {
    const link = getInkverseUrl({ type: "comicseries", shortUrl: comicseries.shortUrl });
    if (!link) { return <></>; }

      return (
        <Link to={link}>
          <CoverArt comicseries={comicseries} pageType={pageType} />
        </Link>
      );
  }

  else if (pageType === 'grid-item-with-genres') {
    const link = getInkverseUrl({ type: "comicseries", shortUrl: comicseries.shortUrl });
    if (!link) { return <></>; }

    return (
      <Link to={link} className="flex flex-col">
        <CoverArt comicseries={comicseries} pageType={pageType} />
        <p className="mt-2 text-base text-center opacity-80 font-semibold">{formatGenresString({ comicseries })}</p>
      </Link>
    );
  }

  else if (pageType === 'search') {
    const link = getInkverseUrl({ type: "comicseries", shortUrl: comicseries.shortUrl });
    if (!link) { return <></>; }
    return (
      <Link to={link} className="flex flex-row p-6" onClick={() => {
        window.dispatchEvent(new Event('closeSearchBox'));
      }}>
        <CoverArt comicseries={comicseries} pageType={pageType} />
        <div className="w-2/3 pl-4">
          <Name comicseries={comicseries} pageType={pageType}/>
          <div className='flex flex-row justify-between'>
            <Genre comicseries={comicseries} pageType={pageType}/>
          </div>
        </div>
      </Link>
    );
  }
  

  else if (pageType === 'list-item') {
    const link = getInkverseUrl({ type: "comicseries", shortUrl: comicseries.shortUrl });
    if (!link) { return <></>; }

    return (
      <Link to={link} className="block w-full">
        <div className="flex gap-6 py-6">
          <span className="text-lg font-semibold">{props.index || 1}.</span>
          <div className="flex flex-1 gap-6">
            <CoverArt comicseries={comicseries} pageType={pageType} />
            <div className="flex-1">
              <Name comicseries={comicseries} pageType={pageType}/>
              <Genre comicseries={comicseries} pageType={pageType}/>
              <p className='mt-3'>{comicseries?.description}</p>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  else if (pageType === 'list-item-no-link') {
    return (
      <div className="block w-full">
        <div className="flex gap-6 py-6">
          <span className="text-lg font-semibold">{props.index || 1}.</span>
          <div className="flex flex-1 gap-6">
            <CoverArt comicseries={comicseries} pageType={pageType} />
            <div className="flex-1">
              <Name comicseries={comicseries} pageType={pageType}/>
              <Genre comicseries={comicseries} pageType={pageType}/>
              <p className='mt-3'>{comicseries?.description}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // comicseries-screen
  // No visible title: the cover art always includes it, so the h1 is for search engines and screen readers.
  // Every width uses the same single column with a centered cover on top, capped to the viewport height on phones.
  const description = comicseries.description?.trim();
  return (
    <div>
      <h1 className="sr-only">{comicseries.name}</h1>
      <CoverArt comicseries={comicseries} pageType={pageType} />
      <Counts likeCount={likeCount} commentCount={commentCount} />
      {actions}
      <div className="mx-4">
        {!!description && (
          <ExpandableText text={description} numberOfLines={3} className="mb-4" />
        )}
        <GenreAndTagPills comicseries={comicseries} />
      </div>
    </div>
  );
}

const Name = ({ comicseries, pageType }: { comicseries: ComicSeries, pageType: ComicSeriesPageType }) => {
  switch (pageType) {
    case 'list-item':
    case 'list-item-no-link':
      return <h2 className="font-bold text-xl">{comicseries.name}</h2>;
    default:
      return <h2 className="mt-4 sm:mt-0 font-bold text-xl">{comicseries.name}</h2>;
  }
}

const CoverArt = ({ comicseries, pageType }: { comicseries: ComicSeries, pageType: ComicSeriesPageType }) => {
  switch (pageType) {
    case 'featured-banner':
      return (
        <img
          src={getBannerImageUrl({ bannerImageAsString: comicseries.bannerImageAsString, variant: "large" }) || undefined}
          alt={`${comicseries.name} banner art`}
          className="w-full aspect-[16/9] max-h-[470px] rounded-lg object-cover object-center"
        />
      );
    case 'most-popular':
      return (
        <img
          src={getThumbnailImageUrl({ thumbnailImageAsString: comicseries.thumbnailImageAsString }) || undefined}
          alt={`${comicseries.name} thumbnail art`}
          className="h-32 aspect-1 rounded-md object-contain object-center mr-2"
        />
    );
    case 'cover':
      return (
        <img
          src={getCoverImageUrl({ coverImageAsString: comicseries.coverImageAsString }) || undefined}
          alt={`${comicseries.name} comic cover art`}
          className="h-60 aspect-4/6 rounded-md object-contain object-center mr-2"
        />
    );
    case 'grid-item-with-genres':
      return (
        <img
          src={getCoverImageUrl({ coverImageAsString: comicseries.coverImageAsString }) || undefined}
          alt={`${comicseries.name} comic cover art`}
          className="w-full aspect-2/3 rounded-xl object-cover"
        />
      );
    case 'search':
    case 'list-item':
    case 'list-item-no-link':
      return (
        <img
          src={getThumbnailImageUrl({ thumbnailImageAsString: comicseries.thumbnailImageAsString }) || undefined}
          alt={`${comicseries.name} thumbnail art`}
          className="h-20 aspect-1 rounded-md object-contain object-center mr-2"
        />
    );
    case 'comicseries-screen':
    default:
      return (
        <img
          src={getCoverImageUrl({ coverImageAsString: comicseries.coverImageAsString }) || undefined}
          alt={`${comicseries.name} comic cover art`}
          className="block mx-auto mt-4 h-[min(50vh,360px)] aspect-4/6 rounded-lg object-cover sm:mt-0 sm:h-[360px]"
        />
      );
  }
}

function formatGenresString({ comicseries }: { comicseries: ComicSeries }) {
  const genres = [ comicseries.genre0, comicseries.genre1, comicseries.genre2 ];
  return genres.filter(Boolean).map((genre) => genre && getPrettyGenre(genre)).join('  •  ');
};

const Genre = ({ comicseries, pageType }: { comicseries: ComicSeries, pageType: ComicSeriesPageType }) => {
  if (pageType === 'most-popular') {
    return (
      <p className='mt-2 font-semibold'>{formatGenresString({ comicseries })}</p>
    );
  }

  return (
    <p className='mt-2 font-semibold'>{formatGenresString({ comicseries })}</p>
  );
}

const pillClassName = 'px-3.5 py-2 rounded-full text-[15px] bg-brand-pink/20 dark:bg-taddy-blue/20';

// Genres and tags share one group of lowercase pills. The website has no genre page, so only tags link.
const GenreAndTagPills = ({ comicseries }: { comicseries: ComicSeries }) => {
  const pills = getGenreAndTagPills(comicseries);
  if (pills.length === 0) { return null; }

  return (
    <div className='flex flex-row flex-wrap justify-center gap-2'>
      {pills.map((pill) => {
        const link = pill.kind === 'tag' ? getInkverseUrl({ type: "tag", name: pill.value.toLowerCase() }) : undefined;
        return link
          ? (
            <Link key={pill.label} to={link} className={`${pillClassName} transition-colors hover:bg-brand-pink/30 dark:hover:bg-taddy-blue/30`}>
              {pill.label}
            </Link>
          )
          : <span key={pill.label} className={pillClassName}>{pill.label}</span>;
      })}
    </div>
  );
}

const Counts = ({ likeCount, commentCount }: { likeCount?: number, commentCount?: number }) => {
  if (!likeCount && !commentCount) return null;

  return (
    <div className='mt-4 flex flex-row justify-center items-center gap-4'>
      {!!likeCount && likeCount > 0 && (
        <div className='flex items-center gap-1'>
          <MdFavorite className='text-rose-500' size={18} />
          <span className='font-semibold'>{formatCompactNumber(likeCount)}</span>
        </div>
      )}
      {!!commentCount && commentCount > 0 && (
        <div className='flex items-center gap-1'>
          <BsFillChatFill className='text-inkverse-black dark:text-white' size={15} />
          <span className='font-semibold'>{formatCompactNumber(commentCount)}</span>
        </div>
      )}
    </div>
  );
}
