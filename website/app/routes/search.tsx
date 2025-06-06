import type { LoaderFunctionArgs, MetaFunction } from 'react-router-dom';
import { useLoaderData } from 'react-router';

import { ComicSeriesDetails } from '@/app/components/comics/ComicSeriesDetails';

import { loadSearch } from '@/lib/loader/search.server';
import { getMetaTags } from '@/lib/seo';
import { getInkverseUrl, inkverseWebsiteUrl } from '@inkverse/public/utils';
import type { ComicSeries } from '@inkverse/shared-client/graphql/operations';

export const meta: MetaFunction<typeof loader> = ({ data, params }) => {
  if (!data) { return []; }
  if (!data.search) { return []; }

  const searchTerm = params.term || '';
  const searchTypes = params.types || 'comics';

  return getMetaTags({
    title: `Search for ${searchTypes.split(',').join('& ')} with '${searchTerm}'`,
    description: `Search for comics, creators, lists, and more on Inkverse.`,
    url: `${inkverseWebsiteUrl}${getInkverseUrl({ type: "search", term: searchTerm, types: searchTypes.split(',') })}`,
  });
};

export const loader = async ({ params, request, context }: LoaderFunctionArgs) => {
  return await loadSearch({ params, request, context });
};

function SearchScreen() {
  const searchData = useLoaderData<typeof loader>();
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
      {searchData?.search?.comicSeries?.filter((comicseries: any) => comicseries !== null).map((comicseries: any) => comicseries as ComicSeries).map((comicseries: ComicSeries) => (
        <ComicSeriesDetails 
          key={comicseries.uuid}
          comicseries={comicseries} 
          pageType={'search'}
        />
      ))}
    </div>
  );
}

export default SearchScreen;