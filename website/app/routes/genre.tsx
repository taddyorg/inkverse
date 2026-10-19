import { Link, useParams } from 'react-router-dom';
import type { LoaderFunctionArgs, MetaFunction } from 'react-router-dom';
import { useLoaderData } from 'react-router';

import { ComicSeriesDetails } from '../components/comics/ComicSeriesDetails';
import { getMetaTags } from '@/lib/seo';
import { getInkverseUrl, inkverseWebsiteUrl } from '@inkverse/public/utils';
import { getPrettyGenre, getGenreFromSlug } from '@inkverse/public/genres';
import { loadComicsList, type ComicsListLoaderData } from '@/lib/loader/tag.server';

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
  const { comicseries } = useLoaderData<ComicsListLoaderData>();

  if (!comicseries) {
    throw new Response("Not Found", { status: 404 });
  }

  const title = getTitle(genre);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>
          {comicseries.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-lg">No comics found.</p>
            </div>
          ) : (
            <div className="rounded-md">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {comicseries.map((comicSeries) => (
                  <div key={comicSeries.uuid} className="flex flex-col">
                    {/* Cover art */}
                    <ComicSeriesDetails
                      comicseries={comicSeries}
                      pageType={'cover'}
                    />
                    {/* Title below the cover */}
                    <div className="mt-2 text-center">
                      <Link
                        to={getInkverseUrl({ type: "comicseries", shortUrl: comicSeries.shortUrl }) || ''}
                        className="font-semibold text-sm hover:text-brand-pink transition-colors truncate block">
                        {comicSeries.name}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
    </div>
  );
}
