import { useParams } from 'react-router-dom';
import type { LoaderFunctionArgs, MetaFunction } from 'react-router-dom';

import { ComicsListPage } from '../components/comics/ComicsListPage';
import { getMetaTags } from '@/lib/seo';
import { getInkverseUrl, inkverseWebsiteUrl } from '@inkverse/public/utils';
import { loadComicsList } from '@/lib/loader/tag.server';

function getTitle(tag: string | undefined): string | undefined {
  if (!tag) { return undefined; }
  return `Comics with ${tag?.toLowerCase()}`
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const { tag } = useParams();

  if (!data) { return []; }
  else if (!data.comicseries) { return []; }
  return getMetaTags({
    title: getTitle(tag),
    description: "Comics tagged with " + tag,
    url: `${inkverseWebsiteUrl}${getInkverseUrl({ type: "tag", name: tag })}`,
  });
};

export const loader = async (args: LoaderFunctionArgs) => {
  return await loadComicsList({ ...args, params: { pageType: 'tag', value: args.params.tag } });
};

export default function ComicsListScreen() {
  const { tag } = useParams();
  return <ComicsListPage key={tag} title={getTitle(tag)} />;
}
