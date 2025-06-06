import type { LoaderFunctionArgs, MetaFunction } from 'react-router-dom';
import { useLoaderData } from 'react-router';

// import { SimpleLoadingComponent } from '@/components/ui';
import { ListDetails } from '../components/list/ListDetails';

import { loadList } from '@/lib/loader/list.server';
import { getMetaTags } from '@/lib/seo';
import { getInkverseUrl, inkverseWebsiteUrl } from '@inkverse/public/utils';

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) { return []; }
  else if (!data.list) { return []; }
  return getMetaTags({
    title: data.list.name, 
    description: data.list.description,
    url: `${inkverseWebsiteUrl}${getInkverseUrl({ type: "list", id: data.list.id, name: data.list.name })}`,
    imageURL: data.list.bannerImageUrl,
  });
};

export const loader = async ({ params, request, context }: LoaderFunctionArgs) => {
  return await loadList({ params, request, context });
};

function ListScreen() {
  const listData = useLoaderData<typeof loader>();
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
      <ListDetails list={listData?.list} pageType={'list-screen'} />
    </div>
  );
}

export default ListScreen;