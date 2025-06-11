import { Link, useLoaderData, type LoaderFunctionArgs, type MetaFunction } from "react-router";

import { ComicSeriesDetails } from "../components/comics/ComicSeriesDetails";
import { GetAppButton } from "../components/ui/GetAppButton";

import { getMetaTags } from "@/lib/seo";
import { loadHomeScreen } from "@/lib/loader/home.server";
import type { ComicSeries, List } from "@inkverse/shared-client/graphql/operations";
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

const footerNavigation = {
  company: [
    { name: 'Blog', href: '/blog', type: 'internal' },
    { name: 'Terms', href: '/terms-of-service', type: 'internal' },
    { name: 'Privacy', href: '/terms-of-service/privacy-policy', type: 'internal' },
    { name: 'Brand Kit', href: '/brand-kit', type: 'internal' },
    { name: 'Open Source', href: '/open-source', type: 'internal' },
    { name: 'Product Roadmap', href: '/updates/our-roadmap', type: 'internal' },
    { name: 'Download Mobile App', href: '/download-app', type: 'internal', additionalStyling: 'pb-2' },
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
        <MostRecommendedWebtoons comicSeries={homeScreenData.mostPopularComicSeries} />
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

const MostRecommendedWebtoons = ({ comicSeries }: { comicSeries: ComicSeries[] | null | undefined }) => {
  const seeAllUrl = getInkverseUrl({ type: "list", id: '1', name: 'Most Recommended' });

  return (
    <div className="mb-2 sm:mb-6">
      <h2 className='text-2xl font-semibold mt-2 mb-4'>Most Recommended Comics</h2>
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {comicSeries?.map((series) => (
            <ComicSeriesDetails 
              key={series.uuid} 
              comicseries={series} 
              pageType={'most-popular'} 
            />
          ))}
        </div>
      </div>
      {seeAllUrl && (
        <div className="flex justify-center mt-6">
          <Link to={seeAllUrl} className="font-semibold hover:text-gray-500">
            See All
          </Link>
        </div>
      )}
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