import type { LoaderFunctionArgs, MetaFunction } from 'react-router-dom';
import { useLoaderData } from 'react-router';

// import { SimpleLoadingComponent } from '@/components/ui';
import { ListDetails } from '../components/list/ListDetails';

import { loadList } from '@/lib/loader/list.server';
import { getMetaTags } from '@/lib/seo';
import { getInkverseUrl, inkverseWebsiteUrl } from '@inkverse/public/utils';
import { NotFound } from '../components/ui';

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

export const loader = async (args: LoaderFunctionArgs) => {
  return await loadList(args);
};

function ListScreen() {
  const listData = useLoaderData<typeof loader>();
  
  if (listData.loaderError) {
    return <NotFound message="Something went wrong" subtitle="Please try again later." />;
  }

  if (!listData?.list) {
    return <NotFound message="List not found" />;
  }
  
  return (
    <div className="max-w-3xl mx-auto sm:p-6 lg:p-8">
      <ListDetails list={listData.list} pageType={'list-screen'} />
    </div>
  );
}

export default ListScreen;