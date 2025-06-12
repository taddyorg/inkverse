import { Link } from "react-router";

import type { ComicSeries } from '@inkverse/shared-client/graphql/operations';
import { getInkverseUrl } from '@inkverse/public/utils';
import { getPrettyGenre } from '@inkverse/public/genres';
import { getBannerImageUrl, getCoverImageUrl, getThumbnailImageUrl } from '@inkverse/public/comicseries';
import { getAvatarImageUrl } from '@inkverse/public/creator';

export type ComicSeriesPageType = 
  | 'comicseries-screen'
  | 'featured-banner'
  | 'most-popular'
  | 'cover'
  | 'search'
  | 'list-item'
  | 'list-item-no-link';

type ComicSeriesDetailsProps = {
  comicseries: ComicSeries | null | undefined;
  pageType: ComicSeriesPageType;
  index?: number;
}

export function ComicSeriesDetails(props: ComicSeriesDetailsProps){
  const { comicseries, pageType } = props;

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

  
  return (
    <div className="py-6 mt-2 px-4 sm:px-6 lg:px-8 rounded-md">
      <div className="flex flex-col sm:flex-row ">
        <CoverArt comicseries={comicseries} pageType={pageType} />
        <div className="sm:w-2/3 sm:pl-4">
          <Name comicseries={comicseries} pageType={pageType}/>
          <div className='flex flex-row justify-between'>
            <Genre comicseries={comicseries} pageType={pageType}/>
            <Counts comicseries={comicseries} pageType={pageType}/>
          </div>
          <Creators comicseries={comicseries} pageType={pageType}/>
          <p className='mt-2'>{comicseries?.description?.trim()}</p>
          <Tags comicseries={comicseries} pageType={pageType}/>
        </div>
      </div>
    </div>
  );
}

const Name = ({ comicseries, pageType }: { comicseries: ComicSeries, pageType: ComicSeriesPageType }) => {
  switch (pageType) {
    case 'comicseries-screen':
      return <h1 className="mt-4 sm:mt-0 font-bold text-xl">{comicseries.name}</h1>;
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
    default:
      return (
        <img
          src={getCoverImageUrl({ coverImageAsString: comicseries.coverImageAsString }) || undefined}
          alt={`${comicseries.name} comic cover art`}
          className="h-90 sm:h-60 aspect-4/6 rounded-lg object-contain object-center mr-2"
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

const Tags = ({ comicseries, pageType }: { comicseries: ComicSeries, pageType: ComicSeriesPageType }) => {
  if (pageType !== 'comicseries-screen' || !comicseries.tags || comicseries.tags.length === 0) {
    return <></>;
  }

  return (
    <div className='mt-2 flex flex-row flex-wrap gap-2'>
      {comicseries.tags.map((tag) => (
        tag && (
          <Link
            key={tag.toLowerCase()}
            to={getInkverseUrl({ type: "tag", name: tag.toLowerCase() }) || ''}
            className='px-3 py-1 rounded-full text-sm bg-brand-pink bg-opacity-20 transition-colors hover:bg-opacity-30 cursor-pointer dark:bg-taddy-blue dark:bg-opacity-20 dark:hover:bg-opacity-30'
          >
            <span>{tag.toLowerCase()}</span>
          </Link>
        )
      ))}
    </div>
  );
}

const Counts = ({ comicseries, pageType }: { comicseries: ComicSeries, pageType: ComicSeriesPageType }) => {
  return (
    <div className='mt-2 flex flex-row gap-2'>
      {/* <div className='flex items-center'>
        <FaThumbsUp className='mr-2 text-brand-pink' />
        <p className='text-brand-pink font-bold'>{comicseries.recommendationsCount} recommendations</p>
      </div>
      <div className='flex items-center'>
        <FaBookmark className='mr-2 text-brand-pink' />
        <p className='text-brand-pink font-bold'>{comicseries.issuesCount} issues</p>
      </div>
      {comicseries.recommendationsCount > 0 && (
        <div className='flex items-center'>
          <FaThumbsUp className='mr-2 text-brand-pink' />
          <p className='text-brand-pink font-bold'>{comicseries.recommendationsCount}</p>
        </div>
      )}
      {comicseries.saveCount > 0 && (
        <div className='flex items-center'>
          <FaBookmark className='mr-2 text-brand-pink' />
          <p className='text-brand-pink font-bold'>{comicseries.saveCount}</p>
        </div>
      )} */}
    </div>
  );
}

const Creators = ({ comicseries, pageType }: { comicseries: ComicSeries, pageType: ComicSeriesPageType }) => {
  if (!comicseries.creators || comicseries.creators.length === 0) {
    return <></>;
  }

  const creators = comicseries.creators.filter((creator) => creator !== null);
  
  return (
    <div className='mt-2 flex flex-row gap-2'>
      {creators.map((creator) => {
        const link = getInkverseUrl({ type: "creator", shortUrl: creator.shortUrl });
        if (!link) { return <></> }
        return (
          <Link 
            key={creator.uuid}
            to={link} 
            className='flex items-center' 
          >
          <img 
            src={getAvatarImageUrl({ avatarImageAsString: creator.avatarImageAsString })} 
            alt={creator.name || undefined} 
            className='h-8 aspect-1 rounded-sm object-contain object-center mr-2' 
          />
          <p className='font-semibold'>{creator.name}</p>
          </Link>
        );
      })}
    </div> 
  );
}

// const RecommendButton = ({ isLoading, recommendHandler }) => {
//     return (
//         <a href='https://inkverse.co/download' target='_blank' className={`flex items-center justify-center px-4 py-2 rounded-full text-sm font-bold transition-colors duration-150 bg-background-primary border-2 border-button-disabled text-text-primary hover:bg-brand-pink hover:text-white hover:border-brand-pink`}>
//             <div className="flex items-center">
//                 <FaThumbsUp
//                     className={`mr-2 text-text-primary group-hover:text-white`}
//                     size={16}
//                 />
//                 <span>Recommend</span>
//             </div>
//         </a>
//     );
// };

// const SaveButton = ({ isLoading, saveHandler }) => {
//     return (
//         <a href='https://inkverse.co/download' target='_blank' className={`flex items-center justify-center px-4 py-2 rounded-full text-sm font-bold transition-colors duration-150 bg-background-primary border-2 border-button-disabled text-text-primary hover:bg-brand-pink hover:text-white hover:border-brand-pink ml-2`}>
//             <div className="flex items-center">
//                 <FaBookmark
//                     className={`mr-2 text-text-primary`}
//                     size={16}
//                 />
//                 <span>Save</span>
//             </div>
//         </a>
//     );
// };