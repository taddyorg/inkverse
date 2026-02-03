import { useState, useEffect, useRef } from "react";
import { Link, useLoaderData, type LoaderFunctionArgs, type MetaFunction } from "react-router";

import { ComicSeriesDetails } from "../components/comics/ComicSeriesDetails";
import { GetAppButton } from "../components/ui/GetAppButton";

import { getMetaTags } from "@/lib/seo";
import { loadHomeScreen } from "@/lib/loader/home.server";
import { getPublicApolloClient } from "@/lib/apollo/client.client";
import type { ComicSeries, List } from "@inkverse/shared-client/graphql/operations";
import { loadTrendingComicSeries, trendingMetricOptions, trendingPeriodOptions } from "@inkverse/shared-client/dispatch/homefeed";
import { TrendingMetric, TrendingPeriod } from "@inkverse/shared-client/graphql/operations";
import { getInkverseUrl } from "@inkverse/public/utils";
import { MdKeyboardArrowDown } from "react-icons/md";
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

const footerNavigation = {
  company: [
    { name: 'Blog', href: '/blog', type: 'internal' },
    { name: 'Terms', href: '/terms-of-service', type: 'internal' },
    { name: 'Privacy', href: '/terms-of-service/privacy-policy', type: 'internal' },
    // { name: 'Brand Kit', href: '/brand-kit', type: 'internal' },
    { name: 'Open Source', href: '/open-source', type: 'internal' },
    { name: 'Our Roadmap', href: '/updates/our-roadmap', type: 'internal', additionalStyling: 'pb-2' },
    // { name: 'Download Mobile App', href: '/download-app', type: 'internal', additionalStyling: 'pb-2' },
    { name: 'Publish on Inkverse', href: 'https://taddy.org/upload-on-taddy?ref=inkverse.co', type: 'external', buttonStyling: 'bg-red-500 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-800 text-white font-semibold px-6 py-3 rounded-full' },
  ],
  social: [
    {
      name: 'Instagram',
      href: 'https://www.instagram.com/inkverse_app',
      icon: (props: any) => (
        <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
          <path
            fillRule="evenodd"
            d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    {
      name: 'Bluesky',
      href: 'https://bsky.app/profile/inkverse.co',
      icon: (props: any) => (
        <svg fill="currentColor" viewBox="0 0 600 530" width="24" height="24" {...props}>
          <path d="m135.72 44.03c66.496 49.921 138.02 151.14 164.28 205.46 26.262-54.316 97.782-155.54 164.28-205.46 47.98-36.021 125.72-63.892 125.72 24.795 0 17.712-10.155 148.79-16.111 170.07-20.703 73.984-96.144 92.854-163.25 81.433 117.3 19.964 147.14 86.092 82.697 152.22-122.39 125.59-175.91-31.511-189.63-71.766-2.514-7.3797-3.6904-10.832-3.7077-7.8964-0.0174-2.9357-1.1937 0.51669-3.7077 7.8964-13.714 40.255-67.233 197.36-189.63 71.766-64.444-66.128-34.605-132.26 82.697-152.22-67.108 11.421-142.55-7.4491-163.25-81.433-5.9562-21.282-16.111-152.36-16.111-170.07 0-88.687 77.742-60.816 125.72-24.795z" />
        </svg>
      ),
    },
    {
      name: 'GitHub',
      internalLink: '/open-source',
      icon: (props: any) => (
        <svg width="24" height="24" viewBox="0 0 98 96" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" clipRule="evenodd" d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z" fill="currentColor"/></svg>
      ),
    },
    {
      name: 'Download on App Store',
      href: 'https://inkverse.co/ios',
      icon: (props: any) => (
        <svg fill="currentColor" viewBox="2 2 20 20" width="24" height="24" {...props}>
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
        </svg>
      ),
    },
    {
      name: 'Download for Android',
      href: 'https://inkverse.co/android',
      icon: (props: any) => (
        <svg fill="currentColor" viewBox="0 -30 300 300" width="24" height="24" {...props}>
          <path d="M40.732,91.013c-10.051,0-18.198,7.119-18.198,15.922v68.105c0,8.794,8.148,15.932,18.198,15.932
		c10.041,0,18.198-7.137,18.198-15.932v-68.105C58.931,98.141,50.774,91.013,40.732,91.013z M178.38,24.41l15.904-15.859
		c1.966-1.957,1.966-5.116,0-7.083c-1.966-1.957-5.134-1.957-7.101,0l-19.572,19.538c-7.001-1.712-14.384-2.658-22.067-2.658
		c-7.592,0-14.912,0.938-21.831,2.604L104.176,1.469c-1.966-1.957-5.144-1.957-7.101,0c-1.966,1.957-1.966,5.125,0,7.083
		l15.822,15.777c-26.4,10.123-44.744,32.072-44.744,57.58c0,0.31,154.763,0.018,154.763,0
		C222.925,56.465,204.681,34.57,178.38,24.41z M122.775,63.748c-5.034,0-9.104-4.06-9.104-9.086c0-5.016,4.069-9.086,9.104-9.086
		s9.104,4.069,9.104,9.086C131.888,59.678,127.791,63.748,122.775,63.748z M168.303,63.748c-5.034,0-9.104-4.06-9.104-9.086
		c0-5.016,4.069-9.086,9.104-9.086c5.034,0,9.104,4.069,9.104,9.086S173.328,63.748,168.303,63.748z M250.145,91.013
		c-10.051,0-18.207,7.119-18.207,15.922v68.105c0,8.794,8.157,15.932,18.207,15.932c10.05,0,18.189-7.146,18.189-15.932v-68.105
		C268.334,98.141,260.177,91.013,250.145,91.013z M68.153,199.976c0,15.021,12.181,27.184,27.22,27.238v47.722
		c0,8.803,8.148,15.932,18.198,15.932c10.041,0,18.189-7.128,18.189-15.932v-47.722h27.348v47.722
		c0,8.803,8.148,15.932,18.198,15.932c10.041,0,18.189-7.128,18.189-15.932v-47.722h0.118c15.085,0,27.311-12.199,27.311-27.238
		V90.986H68.162v108.99H68.153z"/>
        </svg>
      ),
    },
  ],
}

export const loader = async ({ params, request, context }: LoaderFunctionArgs) => {
  return await loadHomeScreen({ params, request, context });
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
          className="text-base font-medium text-inkverse-black dark:text-white hover:text-gray-700 dark:hover:text-gray-200"
        >
          See All <MdKeyboardArrowDown className="inline text-inkverse-black dark:text-white ml-1 h-4 w-4" />
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

const Footer = () => {
  return (
    <footer aria-labelledby="footer-heading" className="flex flex-col gap-4 px-2 md:px-10 lg:px-20 mb-16 md:mb-4">
      <h2 id="footer-heading" className="sr-only"> Footer </h2>
      <div>
        <div>
          {/* <h3 className="text-base font-medium text-gray-400">Company</h3> */}
          <ul role="list" className="space-y-4">
            {footerNavigation.company.map((item) => (
              <li key={item.name} className={item.additionalStyling}>
                {item.type === 'internal' 
                  ? <Link to={item.href} prefetch="intent" className="text-base hover:text-gray-400">
                      {item.name}
                    </Link>
                  : <a href={item.href} target="_blank" className={item.buttonStyling || 'text-base hover:text-gray-400'}>
                      {item.name}
                    </a>
                }
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="flex justify-center items-center space-y-8 xl:col-span-1 px-6 py-6">
        <div className="flex space-x-6">
          {footerNavigation.social.map((item) => (
            item.internalLink ? (
              <Link key={item.name} to={item.internalLink} className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">{item.name}</span>
                <item.icon className="h-6 w-6" aria-hidden="true" />
              </Link>
            ) : (
              <a key={item.name} href={item.href} target='_blank' className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">{item.name}</span>
                <item.icon className="h-6 w-6" aria-hidden="true" />
              </a>
            )
          ))}
        </div>
      </div>
    </footer>
  );
}