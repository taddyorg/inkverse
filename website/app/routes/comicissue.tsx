import { useLoaderData } from "react-router";
import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { Link } from 'react-router-dom';
import { MdChevronLeft } from 'react-icons/md';

import { ImageWithLoader } from "../components/ui";
import { ReadNextEpisode } from "../components/comics/ReadNextEpisode";

import { getMetaTags } from "@/lib/seo";
import { loadComicIssue } from "@/lib/loader/comicissue.server";
import { inkverseWebsiteUrl, getInkverseUrl } from "@inkverse/public/utils";
import type { ComicIssue, Creator } from '@inkverse/shared-client/graphql/types';
import { getBannerImageUrl } from "@inkverse/public/comicissue";
import { getStoryImageUrl } from "@inkverse/public/comicstory";
import { CreatorsForIssue } from "../components/creator/CreatorsForIssue";

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) { return []; }
  else if (!data.comicissue) { return []; }
  return getMetaTags(
    data.comicissue.name, 
    data.comicissue.creatorNote,
    `${inkverseWebsiteUrl}${getInkverseUrl({ type: "comicissue", shortUrl: data.comicseries?.shortUrl, name: data.comicissue.name, uuid: data.comicissue.uuid })}`,
    getBannerImageUrl({ bannerImageAsString: data.comicissue.bannerImageAsString }),
  );
};

export const loader = async ({ params, request, context }: LoaderFunctionArgs) => {
  return await loadComicIssue({ params, request, context });
};

export default function ComicIssue() {
  const { comicissue, comicseries, allIssues } = useLoaderData<typeof loader>();
  const comicSeriesLink = getInkverseUrl({ type: "comicseries", shortUrl: comicseries?.shortUrl });

  return (
    <div className={`mx-auto sm:p-6 lg:p-8 zoomed-in:max-w-3xl max-w-xl`}>
      <div className='flex flex-col py-4 sm:py-0'>
        <div className="flex items-center mb-2">
          {comicSeriesLink && (
            <Link to={comicSeriesLink} className="flex flex-row mr-2">
              <MdChevronLeft size={24} />
              <p className="font-semibold">All Episodes</p>
            </Link>
          )}
        </div>
        {comicissue?.stories && comicissue.stories.map((story, index) => {
          const storyImageUrl = getStoryImageUrl({ storyImageAsString: story?.storyImageAsString });
          if (!storyImageUrl) return null;

          return (
            <ImageWithLoader
              key={story?.uuid}
              className="w-full select-none pointer-events-none"
              src={storyImageUrl}
              priority={index < 2 ? 'high' : 'auto'}
            />
          )
        })}
        <div className="px-4 sm:px-0">
          <CreatorsForIssue 
            comicissue={comicissue} 
            creators={comicseries?.creators?.map((creator) => creator as Creator) ?? []}/>
          {/* <GridOfComicIssues
            comicseries={comicseries}
            comicissue={comicissue}
            allIssues={allIssues?.issues?.map((issue) => issue as ComicIssue) ?? []}
          /> */}
          <ReadNextEpisode 
            comicissue={comicissue?.nextIssue} 
            comicseries={comicseries}
          />
        </div>
      </div>
    </div>
  );
}