import { useState, useEffect, useRef, useReducer } from "react";
import { Link, useLoaderData, useNavigate, type LoaderFunctionArgs, type MetaFunction } from "react-router";
import { MdSort } from "react-icons/md";

import { ComicSeriesDetails } from "../components/comics/ComicSeriesDetails";
import { getMetaTags } from "@/lib/seo";
import { getInkverseUrl, inkverseWebsiteUrl } from "@inkverse/public/utils";
import { TrendingMetric } from "@inkverse/shared-client/graphql/operations";
import { loadTrending, type TrendingLoaderData } from "@/lib/loader/trending.server";
import { getPublicApolloClient } from "@/lib/apollo/client.client";
import { trendingReducer, loadMoreTrending, makeTrendingInitialState, trendingMetricTitles } from "@inkverse/shared-client/dispatch/homefeed";

export const meta: MetaFunction = () => {
  return getMetaTags({
    title: "Most Discussed Comics",
    description: "Discover the most discussed webtoons and webcomics on Inkverse.",
    url: `${inkverseWebsiteUrl}/most-discussed`,
  });
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return await loadTrending(request, TrendingMetric.DISCUSSED);
};

const periodOptions = [
  { value: 'this-week', label: 'This Week' },
  { value: 'this-month', label: 'This Month' },
  { value: 'this-year', label: 'This Year' },
];

export function TrendingComicsPage({ title, basePath }: { title: string; basePath: string }) {
  const loaderData = useLoaderData<TrendingLoaderData>();
  const navigate = useNavigate();
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);
  const periodRef = useRef<HTMLDivElement>(null);

  const [state, dispatch] = useReducer(trendingReducer, makeTrendingInitialState({
    metric: loaderData.metric,
    period: loaderData.period,
    comicSeries: loaderData.comicSeries,
    limitPerPage: loaderData.limitPerPage,
  }));

  useEffect(() => {
    if (!isPeriodOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (periodRef.current && !periodRef.current.contains(event.target as Node)) {
        setIsPeriodOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isPeriodOpen]);

  const handleLoadMore = async () => {
    const publicClient = getPublicApolloClient();
    if (publicClient) {
      await loadMoreTrending({ publicClient, state }, dispatch);
    }
  };

  const currentPeriodLabel = periodOptions.find(o => o.value === loaderData.period)?.label || 'This Week';

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 sm:px-8 lg:px-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">{title}</h1>
        <div className="relative" ref={periodRef}>
          <button
            onClick={() => setIsPeriodOpen(!isPeriodOpen)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-full bg-white/80 hover:bg-white transition-colors dark:bg-gray-800 dark:hover:bg-gray-700"
          >
            <MdSort className="w-4 h-4" />
            <span>{currentPeriodLabel}</span>
          </button>
          {isPeriodOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-10 overflow-hidden dark:bg-gray-800 dark:border-gray-700">
              {periodOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    navigate(`${basePath}?period=${option.value}`);
                    setIsPeriodOpen(false);
                  }}
                  className={`block w-full text-left px-4 py-2.5 text-sm whitespace-nowrap hover:bg-gray-100 transition-colors dark:hover:bg-gray-700 ${
                    loaderData.period === option.value
                      ? 'text-brand-pink dark:text-taddy-blue font-semibold bg-gray-50 dark:bg-gray-750'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {state.comicSeries.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-lg">No comics found for this period.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {state.comicSeries.map((series) => (
            <div key={series.uuid} className="flex flex-col">
              <ComicSeriesDetails
                comicseries={series}
                pageType={'cover'}
              />
            </div>
          ))}
        </div>
      )}

      {state.hasMore && (
        <div className="flex justify-center mt-8">
          <button
            onClick={handleLoadMore}
            disabled={state.isLoadingMore}
            className="px-6 py-3 bg-inkverse-black text-white rounded-full font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 dark:bg-white dark:text-inkverse-black dark:hover:bg-gray-200"
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

export default function MostDiscussedPage() {
  return <TrendingComicsPage title={trendingMetricTitles[TrendingMetric.DISCUSSED]} basePath="/most-discussed" />;
}
