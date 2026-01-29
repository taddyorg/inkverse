import { ComicSeriesDetails } from '../comics/ComicSeriesDetails';
import type { CreatorPageType } from './CreatorDetails';

import type { ComicSeries } from '@inkverse/shared-client/graphql/operations';

type CreatorComicsProps = {
  comicseries?: ComicSeries[] | null | undefined;
  pageType: CreatorPageType;
}

export function CreatorComics(props: CreatorComicsProps){
  const { comicseries, pageType } = props;

  return (
    <div className="px-4 py-2 mt-4 sm:px-6 lg:px-8 rounded-md">
      <div className="flex flex-col">
        <h2 className='text-xl font-bold mb-2'>My Comics</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {comicseries?.map((comicseries) => (
            <div key={comicseries.uuid}>
              <ComicSeriesDetails 
                comicseries={comicseries} 
                pageType={'cover'} 
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}