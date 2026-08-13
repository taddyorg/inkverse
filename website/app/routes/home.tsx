import { useState, useEffect, useRef } from "react";
import { Link, useLoaderData, type LoaderFunctionArgs, type MetaFunction } from "react-router";
import { MdKeyboardArrowRight } from "react-icons/md";

import { ComicSeriesDetails } from "../components/comics/ComicSeriesDetails";
import { GetAppButton } from "../components/ui/GetAppButton";
import { Footer } from "../components/ui/Footer";

import { getMetaTags } from "@/lib/seo";
import { loadHomeScreen } from "@/lib/loader/home.server";
import { getPublicApolloClient } from "@/lib/apollo/client.client";
import type { ComicSeries, List } from "@inkverse/shared-client/graphql/operations";
import { loadTrendingComicSeries, trendingMetricOptions, trendingPeriodOptions } from "@inkverse/shared-client/dispatch/homefeed";
import { TrendingMetric, TrendingPeriod } from "@inkverse/shared-client/graphql/operations";
import { getInkverseUrl } from "@inkverse/public/utils";
import type { NewsItem } from "@inkverse/public/news-items";
import { inkverseNewsItems } from "@inkverse/public/news-items";

const MainCopy = {
  title: "Discover the best webtoons!",
  description: "Find great webtoons & webcomics, Read original stories from emerging creators, with new chapters updated daily. Download now to join our growing community of readers and artists.",
}

export const meta: MetaFunction = () => {
  return getMetaTags({
    title: MainCopy.title,
    description: MainCopy.description,
    url: "https://inkverse.co",
  });
}

export const loader = async (args: LoaderFunctionArgs) => {
  return await loadHomeScreen(args);
};

export default function Home() {
  const homeScreenData = useLoaderData<typeof loader>();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <main className="flex flex-col gap-4 p-2 md:p-10 lg:p-20 lg:pt-10">
        <FeaturedWebtoons comicSeries={homeScreenData.featuredComicSeries} />
        <MostTrendingComics initialComicSeries={homeScreenData.trendingComicSeries} />
        <CuratedLists lists={homeScreenData.curatedLists} />
        <Announcements newsItems={inkverseNewsItems} />
        <RecentlyUpdatedWebtoons comicSeries={homeScreenData.recentlyUpdatedComicSeries} />
        <RecentlyAddedWebtoons comicSeries={homeScreenData.recentlyAddedComicSeries} />
      </main>
      <Footer />
      <GetAppButton />
    </div>
  );
}

const FeaturedWebtoons = ({ comicSeries }: { comicSeries: ComicSeries[] | null | undefined }) => {
  const firstComicSeries = comicSeries?.[0];
  return (
    <div className="mb-2 sm:mb-6">
      {firstComicSeries && (
        <ComicSeriesDetails
          key={firstComicSeries.uuid}
          comicseries={firstComicSeries}
          pageType={'featured-banner'}
        />
      )}
    </div>
  );
}

const TrendingDropdown = <T extends string>({ value, options, onChange }: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative inline-block" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1 mx-1 px-3 py-1.5 text-base text-inkverse-black font-semibold bg-white/80 hover:bg-white rounded-full transition-colors"
      >
        <span>{options.find(o => o.value === value)?.label}</span>
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-10 overflow-hidden">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => { onChange(option.value); setIsOpen(false); }}
              className={`block w-full text-left px-4 py-2.5 text-sm whitespace-nowrap hover:bg-gray-100 transition-colors ${
                value === option.value ? 'text-brand-pink dark:text-taddy-blue font-semibold bg-gray-50' : 'text-gray-700'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const MostTrendingComics = ({ initialComicSeries }: { initialComicSeries: ComicSeries[] | null }) => {
  const [metric, setMetric] = useState<TrendingMetric>(TrendingMetric.LIKED);
  const [period, setPeriod] = useState<TrendingPeriod>(TrendingPeriod.WEEK);
  const [comicSeries, setComicSeries] = useState<ComicSeries[] | null>(initialComicSeries);
  const [isLoading, setIsLoading] = useState(false);
  const prevMetric = useRef(metric);
  const prevPeriod = useRef(period);

  useEffect(() => {
    if (prevMetric.current === metric && prevPeriod.current === period) {
      return;
    }
    prevMetric.current = metric;
    prevPeriod.current = period;

    let cancelled = false;
    setIsLoading(true);

    const publicClient = getPublicApolloClient();
    if (publicClient) {
      loadTrendingComicSeries({ publicClient, metric, period }).then((result) => {
        if (!cancelled) {
          setComicSeries(result);
          setIsLoading(false);
        }
      });
    }

    return () => { cancelled = true; };
  }, [metric, period]);

  return (
    <div className="mb-2 sm:mb-6">
      <h2 className='text-2xl font-semibold flex items-center flex-wrap gap-1 mt-2 mb-4'>
        <span>Most</span>
        <TrendingDropdown
          value={metric}
          options={trendingMetricOptions}
          onChange={setMetric}
        />
        <span>Comics</span>
        <TrendingDropdown
          value={period}
          options={trendingPeriodOptions}
          onChange={setPeriod}
        />
      </h2>
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {comicSeries?.map((series, index) => (
            <div key={series.uuid} className={index >= 3 ? 'hidden md:block' : undefined}>
              <ComicSeriesDetails
                comicseries={series}
                pageType={'most-popular'}
              />
            </div>
          ))}
        </div>
      )}
      <div className="flex justify-center sm:mt-8 mt-4">
        <Link
          to={metric === TrendingMetric.DISCUSSED ? '/most-discussed' : '/most-liked'}
          className="text-base font-normal text-inkverse-black dark:text-white hover:text-gray-700 dark:hover:text-gray-200"
        >
          See All <MdKeyboardArrowRight className="inline text-inkverse-black dark:text-white ml-1 h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

const CuratedLists = ({ lists }: { lists: List[] | null | undefined }) => {
  return (
    <div className="mb-2 sm:mb-6">
      <h2 className='text-2xl font-semibold mt-2 mb-4'>Picks by Inkverse</h2>
      <div className="overflow-x-auto">
        <div className="flex gap-4 pb-4">
          {lists?.map((list) => {
            const url = getInkverseUrl({ type: "list", id: list.id, name: list.name })
            if (!url) return null;
            return (
              <Link key={list.id} to={url} className="flex-none w-[80vw] md:w-[60vw]">
                <img
                  className="w-full rounded-lg object-cover object-center"
                  src={list.bannerImageUrl || undefined}
                  alt={list.name || undefined}
                />
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  );
}

const Announcements = ({ newsItems }: { newsItems: NewsItem[] | null | undefined }) => {
  return (
    <div className="mb-2 sm:mb-6">
      <h2 className='text-2xl font-semibold mt-2 mb-4'>Inkverse News</h2>
      <div className="overflow-x-auto">
        <div className="flex gap-4 pb-4">
          {newsItems?.map((item, index) => (
            <a
              key={item.url}
              href={item.url}
              target="_blank"
              className="flex-none w-[280px] p-4 bg-white rounded-lg shadow-sm border border-gray-100 ">
              <p className="font-semibold text-inkverse-black">{item.title}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

const RecentlyUpdatedWebtoons = ({ comicSeries }: { comicSeries: ComicSeries[] | null | undefined }) => {
  return (
    <div className="mb-2 sm:mb-6">
      <h2 className='text-2xl font-semibold mb-4'>Recently Updated</h2>
      <div className="overflow-x-auto">
        <div className="flex gap-4 pb-4">
          {comicSeries?.map((series) => (
            <div
              key={series.uuid}
              className="flex-none"
            >
              <ComicSeriesDetails
                comicseries={series}
                pageType={'cover'}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const RecentlyAddedWebtoons = ({ comicSeries }: { comicSeries: ComicSeries[] | null | undefined }) => {
  return (
    <div>
      <h2 className='text-2xl font-semibold mb-4'>Recently Added</h2>
      <div className="overflow-x-auto">
        <div className="flex gap-4 pb-4">
          {comicSeries?.map((series) => (
            <div
              key={series.uuid}
              className="flex-none"
            >
              <ComicSeriesDetails
                comicseries={series}
                pageType={'cover'}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
