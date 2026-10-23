import { useReducer, useState } from "react";
import { useLoaderData } from "react-router";

import { ComicSeriesDetails } from "./ComicSeriesDetails";
import { getPublicApolloClient } from "@/lib/apollo/client.client";
import type { ComicsListLoaderData } from "@/lib/loader/tag.server";
import { comicsListReducer, comicsListInitialState, fetchComics, getComicsListFilters, COMICS_LIST_LIMIT_PER_PAGE } from "@inkverse/shared-client/dispatch/comicslist";

export function ComicsListPage({ title }: { title: string | undefined }) {
  const loaderData = useLoaderData<ComicsListLoaderData>();
  const [currentPage, setCurrentPage] = useState(1);

  const [state, dispatch] = useReducer(comicsListReducer, {
    ...comicsListInitialState,
    comics: loaderData.comicseries,
    hasMore: loaderData.hasMore,
    totalCount: loaderData.totalCount,
  });

  const handleLoadMore = async () => {
    const publicClient = getPublicApolloClient();
    if (!publicClient || state.isLoadingMore || !state.hasMore) return;

    const nextPage = currentPage + 1;
    const result = await fetchComics({
      publicClient,
      page: nextPage,
      limitPerPage: COMICS_LIST_LIMIT_PER_PAGE,
      filterForTypes: ["COMICSERIES"],
      ...getComicsListFilters(loaderData.pageType, loaderData.value),
      isLoadingMore: true,
    }, dispatch);

    if (result) {
      setCurrentPage(nextPage);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>

      {state.comics.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-lg">No comics found.</p>
        </div>
      ) : (
        <div className="rounded-md">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {state.comics.map((comicSeries) => (
              <div key={comicSeries.uuid} className="flex flex-col">
                <ComicSeriesDetails
                  comicseries={comicSeries}
                  pageType={'grid-item-with-tagline'}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {state.hasMore && (
        <div className="flex justify-center mt-8">
          <button
            onClick={handleLoadMore}
            disabled={state.isLoadingMore}
            className="px-6 py-3 bg-inkverse-black text-white rounded-full font-normal hover:bg-gray-800 transition-colors disabled:opacity-50 dark:bg-white dark:text-inkverse-black dark:hover:bg-gray-200"
          >
            {state.isLoadingMore ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white dark:border-inkverse-black" />
                Loading...
              </span>
            ) : (
              'Load More'
            )}
          </button>
        </div>
      )}
    </div>
  );
}
