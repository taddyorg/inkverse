import { useParams } from 'react-router-dom';
import type { LoaderFunctionArgs, MetaFunction } from 'react-router-dom';

import { ComicsListPage } from '../components/comics/ComicsListPage';
import { getMetaTags } from '@/lib/seo';
import { getInkverseUrl, inkverseWebsiteUrl } from '@inkverse/public/utils';
import { getPrettyGenre, getGenreFromSlug } from '@inkverse/public/genres';
import { loadComicsList } from '@/lib/loader/tag.server';

function getTitle(slug: string | undefined): string | undefined {
  const genre = getGenreFromSlug(slug);
  if (!genre) { return undefined; }
  return `${getPrettyGenre(genre)} Comics`
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const { genre } = useParams();

  if (!data) { return []; }
  else if (!data.comicseries) { return []; }
  return getMetaTags({
    title: getTitle(genre),
    description: `Read ${getTitle(genre)?.toLowerCase()} on Inkverse`,
    url: `${inkverseWebsiteUrl}${getInkverseUrl({ type: "genre", name: genre })}`,
  });
};

export const loader = async (args: LoaderFunctionArgs) => {
  const genre = getGenreFromSlug(args.params.genre);
  if (!genre) {
    throw new Response("Not Found", { status: 404 });
  }
  return await loadComicsList({ ...args, params: { pageType: 'genre', value: genre } });
};

export default function GenreScreen() {
  const { genre } = useParams();
  return <ComicsListPage key={genre} title={getTitle(genre)} />;
}
