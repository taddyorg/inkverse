import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from "react-router";
import { MdFavorite } from 'react-icons/md';
import { BsFillChatFill } from 'react-icons/bs';

import type { ComicSeries, Genre } from '@inkverse/shared-client/graphql/operations';
import { getInkverseUrl, formatCompactNumber } from '@inkverse/public/utils';
import { getPrettyGenre, getGenreSlug } from '@inkverse/public/genres';
import { getBannerImageUrl, getCoverImageUrl, getThumbnailImageUrl } from '@inkverse/public/comicseries';
import { getGenreAndTagPills } from '@inkverse/shared-client/utils/genre-tag-pills';
import { ExpandableText } from '../ui/ExpandableText';
import { ZoomableImage } from '../ui/ZoomableImage';
import { ComicSeriesTagline } from './ComicSeriesTagline';

export type ComicSeriesPageType =
  | 'comicseries-screen'
  | 'featured-banner'
  | 'most-popular'
  | 'cover'
  | 'cover-with-tagline'
  | 'grid-item-with-tagline'
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
  const [isCoverOpen, setIsCoverOpen] = useState(false);

  if (!comicseries) { return <></>; }

  if (pageType === 'most-popular') {
      const link = getInkverseUrl({ type: "comicseries", shortUrl: comicseries.shortUrl });
      if (!link) { return <></>; }

      return (
        <Link to={link} className="flex flex-row">
          <CoverArt comicseries={comicseries} pageType={pageType} />
          <div className="flex flex-col px-2">
            <Name comicseries={comicseries} pageType={pageType} />
            <Tagline comicseries={comicseries} pageType={pageType} />
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

  else if (pageType === 'cover-with-tagline') {
    const link = getInkverseUrl({ type: "comicseries", shortUrl: comicseries.shortUrl });
    if (!link) { return <></>; }

    return (
      <Link to={link} className="flex flex-col w-44 sm:w-[180px]">
        <CoverArt comicseries={comicseries} pageType={pageType} />
        <Tagline comicseries={comicseries} pageType={pageType} />
      </Link>
    );
  }

  else if (pageType === 'grid-item-with-tagline') {
    const link = getInkverseUrl({ type: "comicseries", shortUrl: comicseries.shortUrl });
    if (!link) { return <></>; }

    return (
      <Link to={link} className="flex flex-col">
        <CoverArt comicseries={comicseries} pageType={pageType} />
        <Tagline comicseries={comicseries} pageType={pageType} />
      </Link>
    );
  }

  else if (pageType === 'search') {
    const link = getInkverseUrl({ type: "comicseries", shortUrl: comicseries.shortUrl });
    if (!link) { return <></>; }
    return (
      <Link to={link} className="flex flex-row items-center p-6" onClick={() => {
        window.dispatchEvent(new Event('closeSearchBox'));
      }}>
        <CoverArt comicseries={comicseries} pageType={pageType} />
        <div className="flex-1 min-w-0 pl-4">
          <Name comicseries={comicseries} pageType={pageType}/>
          <Tagline comicseries={comicseries} pageType={pageType}/>
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
              <Tagline comicseries={comicseries} pageType={pageType}/>
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
              <Tagline comicseries={comicseries} pageType={pageType}/>
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
      <button
        type="button"
        onClick={() => setIsCoverOpen(true)}
        className="block mx-auto mt-4 sm:mt-0 rounded-lg cursor-zoom-in"
        aria-label={`${comicseries.name} cover art, open full screen`}
      >
        <CoverArt comicseries={comicseries} pageType={pageType} />
      </button>
      {/* Opens the large cover, showing the already-loaded medium cover while it loads */}
      <ZoomableImage
        isOpen={isCoverOpen}
        onClose={() => setIsCoverOpen(false)}
        source={getCoverImageUrl({ coverImageAsString: comicseries.coverImageAsString, variant: 'large' })}
        placeholder={getCoverImageUrl({ coverImageAsString: comicseries.coverImageAsString })}
        alt={`${comicseries.name} cover art`}
      />
      {/* empty:hidden collapses the row when there is no tagline, edit icon or counts */}
      <div className="mx-4 mt-3 flex items-center justify-center gap-4 empty:hidden">
        <ComicSeriesTagline comicseries={comicseries} />
        <Counts likeCount={likeCount} commentCount={commentCount} />
      </div>
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
    case 'search':
      return <h2 className="font-bold text-lg leading-snug line-clamp-2">{comicseries.name}</h2>;    default:
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
    case 'cover-with-tagline':
      return (
        <img
          src={getCoverImageUrl({ coverImageAsString: comicseries.coverImageAsString }) || undefined}
          alt={`${comicseries.name} comic cover art`}
          className="h-[264px] sm:h-[270px] aspect-4/6 rounded-md object-contain object-center mr-2"
        />
    );
    case 'grid-item-with-tagline':
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
          className="block h-[min(50vh,360px)] aspect-4/6 rounded-lg object-cover sm:h-[360px]"
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

// No tagline shows nothing; genres are too broad to tell comics apart on the home screen
const Tagline = ({ comicseries, pageType }: { comicseries: ComicSeries, pageType: ComicSeriesPageType }) => {
  if (!comicseries.tagline) { return null; }

  if (pageType === 'cover-with-tagline') {
    return (
      <p className='mt-2 text-sm font-semibold text-center line-clamp-2'>{comicseries.tagline}</p>
    );
  }

  if (pageType === 'search') {
    return (
      <p className='mt-1 font-semibold opacity-80 line-clamp-1'>{comicseries.tagline}</p>
    );
  }

  if (pageType === 'grid-item-with-tagline') {
    return (
      <p className='mt-2 text-base text-center opacity-80 font-semibold line-clamp-2'>{comicseries.tagline}</p>
    );
  }

  return (
    <p className='mt-2 font-semibold'>{comicseries.tagline}</p>
  );
}

const pillClassName = 'px-3.5 py-2 rounded-full text-[15px] bg-brand-pink/20 dark:bg-taddy-blue/20';

// Genres and tags share one group of lowercase pills. Each links to its comics list page.
const GenreAndTagPills = ({ comicseries }: { comicseries: ComicSeries }) => {
  const pills = getGenreAndTagPills(comicseries);
  if (pills.length === 0) { return null; }

  return (
    <div className='flex flex-row flex-wrap justify-center gap-2'>
      {pills.map((pill) => {
        const link = pill.kind === 'tag'
          ? getInkverseUrl({ type: "tag", name: pill.value.toLowerCase() })
          : getInkverseUrl({ type: "genre", name: getGenreSlug(pill.value as Genre) });
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
    <div className='flex shrink-0 items-center gap-4'>
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
