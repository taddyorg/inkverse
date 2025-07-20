import type { LoaderFunctionArgs, MetaFunction } from 'react-router-dom';
import { useLoaderData } from 'react-router';

// import { SimpleLoadingComponent } from '@/components/ui';
import { CreatorDetails } from '../components/creator/CreatorDetails';
import { CreatorComics } from '../components/creator/CreatorComics';

import { loadCreator, type CreatorLoaderData } from '@/lib/loader/creator.server';
import { getMetaTags } from '@/lib/seo';
import { getInkverseUrl, inkverseWebsiteUrl } from '@inkverse/public/utils';
import { getAvatarImageUrl } from '@inkverse/public/creator';

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) { return []; }
  else if (!data.creator) { return []; }
  return getMetaTags({
      title: data.creator.name, 
      description: data.creator.bio,
      url: `${inkverseWebsiteUrl}${getInkverseUrl({ type: "creator", shortUrl: data.creator.shortUrl })}`,
      imageURL: getAvatarImageUrl({ avatarImageAsString: data.creator.avatarImageAsString }),
    }
  );
};

export const loader = async ({ params, request, context }: LoaderFunctionArgs) => {
  return await loadCreator({ params, request, context });
};

export default function Creator() {
  const creatorData = useLoaderData<typeof loader>();
  const creatorKey = creatorData.creator?.uuid || 'no-creator';
  return <CreatorContent key={creatorKey} initialData={creatorData} />;
}

function CreatorContent({ initialData }: { initialData: CreatorLoaderData }) {
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
      <CreatorDetails 
        creator={initialData?.creator} 
        pageType={'creator-screen'} 
      />
      <CreatorComics 
        comicseries={initialData?.comicseries?.filter((comicseries) => comicseries !== null)} 
        pageType={'creator-screen'} 
      />
    </div>
  );
}