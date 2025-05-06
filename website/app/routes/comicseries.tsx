import type { LoaderFunctionArgs, MetaFunction } from 'react-router-dom';
import { useLoaderData } from 'react-router';

// import { SimpleLoadingComponent } from '@/components/ui';
import { ComicSeriesDetails } from '../components/comics/ComicSeriesDetails';
import { ComicIssuesList } from '../components/comics/ComicIssuesList';
import { ComicSeriesInfo } from '../components/comics/ComicSeriesInfo';
import { ReadNextEpisode } from '../components/comics/ReadNextEpisode';

import { loadComicSeries } from '@/lib/loader/comicseries.server';
import { getMetaTags } from '@/lib/seo';
import { getInkverseUrl, inkverseWebsiteUrl } from '@inkverse/public/utils';
import { getBannerImageUrl } from '@inkverse/public/comicseries';

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) { return []; }
  else if (!data.comicseries) { return []; }
  return getMetaTags(
    data.comicseries.name, 
    data.comicseries.description,
    `${inkverseWebsiteUrl}${getInkverseUrl({ type: "comicseries", shortUrl: data.comicseries.shortUrl })}`,
    getBannerImageUrl({ bannerImageAsString: data.comicseries.bannerImageAsString }),
  );
};

export const loader = async ({ params, request, context }: LoaderFunctionArgs) => {
  return await loadComicSeries({ params, request, context });
};

function ComicSeriesScreen() {
  const comicSeriesData = useLoaderData<typeof loader>();
  // const { match = {}, location, comicseries:SSRComicseries } = props;

  // const [ comicseriesQuery, comicseriesQueryDispatch] = useReducer(comicInfoReducer, {});
  // const { isLoading, comicseries:CSRComicseries, issues, recommendations } = comicseriesQuery;

  // const comicseries = CSRComicseries || SSRComicseries;

  // useEffect(() => {
  //   const uuid = location.state
  //     ? location.state.passedInUuid
  //     : comicseries?.uuid;

  //   if (!uuid) { return; }

  //   getComicInfoScreen({ uuid }, comicseriesQueryDispatch);
  // }, [comicseries?.uuid, location.state?.passedInUuid]);

  // if (!comicseries) {
  //   return (
  //     <SimpleLoadingComponent />
  //   )
  // }
  
  return (
    <div className="max-w-3xl mx-auto sm:p-6 lg:p-8">
      <ComicSeriesDetails 
        comicseries={comicSeriesData?.comicseries} 
        pageType={'comicseries-screen'} 
      />
      <ComicIssuesList 
        comicseries={comicSeriesData?.comicseries} 
        issues={comicSeriesData?.issues?.filter((issue) => issue !== null)}
        currentIssueUuid={comicSeriesData?.issues?.[0]?.uuid}
      />
      {comicSeriesData?.comicseries && (
        <ComicSeriesInfo comicseries={comicSeriesData.comicseries} />
      )}
      {comicSeriesData.comicseries && comicSeriesData?.issues?.[0] && comicSeriesData?.issues?.length > 3 && (
        <div className="px-4 lg:px-8 pb-8">
          <ReadNextEpisode 
            comicissue={comicSeriesData.issues[0]}
            comicseries={comicSeriesData.comicseries}
            firstTextCTA="READ THE FIRST"
            secondTextCTA="EPISODE"
          />
        </div>
      )}
    </div>
  );
}

export default ComicSeriesScreen;