import { useLoaderData } from "react-router";
import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { Link } from 'react-router-dom';
import { MdChevronLeft } from 'react-icons/md';
import { useEffect, useReducer } from 'react';
import { jwtDecode } from "jwt-decode";

import { ImageWithLoader } from "../components/ui";
import { ReadNextEpisode } from "../components/comics/ReadNextEpisode";

import { getMetaTags } from "@/lib/seo";
import { loadComicIssue } from "@/lib/loader/comicissue.server";
import { inkverseWebsiteUrl, getInkverseUrl } from "@inkverse/public/utils";
import type { Creator, CreatorLinkDetails } from '@inkverse/shared-client/graphql/operations';
import { getBannerImageUrl } from "@inkverse/public/comicissue";
import { getStoryImageUrl } from "@inkverse/public/comicstory";
import { CreatorsForIssue } from "../components/creator/CreatorsForIssue";
import { getUserDetails } from "@/lib/auth/user";
import { getConnectedHostingProviderUuids, getContentTokenForProviderAndSeries } from "@/lib/auth/hosting-provider";
import { 
  comicIssueReducer, 
  checkPatreonAccess,
  type ComicIssueLoaderData,
} from "@inkverse/shared-client/dispatch/comicissue";
import { LinkType } from "@inkverse/public/graphql/types";
import { getAvatarImageUrl } from "@inkverse/public/creator";

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) { return []; }
  else if (!data.comicissue) { return []; }
  return getMetaTags({
    title: data.comicissue.name, 
    description: data.comicissue.creatorNote,
    url: `${inkverseWebsiteUrl}${getInkverseUrl({ type: "comicissue", shortUrl: data.comicseries?.shortUrl, name: data.comicissue.name, uuid: data.comicissue.uuid })}`,
    imageURL: getBannerImageUrl({ bannerImageAsString: data.comicissue.bannerImageAsString }),
  });
};

export const loader = async ({ params, request, context }: LoaderFunctionArgs) => {
  return await loadComicIssue({ params, request, context });
};

export default function ComicIssue() {
  const comicIssueData = useLoaderData<typeof loader>();
  const issueKey = comicIssueData.comicissue?.uuid || 'no-issue';
  return <ComicIssueContent key={issueKey} initialData={comicIssueData} />;
}

function ComicIssueContent({ initialData }: { initialData: Partial<ComicIssueLoaderData> }) {
  const [state, dispatch] = useReducer(comicIssueReducer, initialData);

  const { 
    comicissue, 
    comicseries, 
    creatorLinks,
    contentToken,
    isCheckingAccess,
  } = state;

  const comicSeriesLink = getInkverseUrl({ type: "comicseries", shortUrl: comicseries?.shortUrl });
  const isPatreonExclusive = comicissue?.scopesForExclusiveContent?.includes('patreon');
  const decodedToken = contentToken && jwtDecode(contentToken) as any;
  const hasAccessToIssue = decodedToken?.items && Array.isArray(decodedToken.items) && comicissue?.uuid && decodedToken.items.includes(comicissue.uuid);
  const connectedProviders = getConnectedHostingProviderUuids();
  const isConnectedToHostingProvider = comicseries?.hostingProviderUuid && connectedProviders.includes(comicseries.hostingProviderUuid);
  const isAuthenticated = !!getUserDetails();

  useEffect(() => {
    if (isPatreonExclusive && comicseries?.hostingProviderUuid && comicseries?.uuid && isConnectedToHostingProvider) {
      checkPatreonAccess({
        isPatreonExclusive,
        hostingProviderUuid: comicseries?.hostingProviderUuid,
        seriesUuid: comicseries?.uuid,
        getContentTokenForProviderAndSeries
      }, dispatch);
    }
  }, [isPatreonExclusive, comicseries?.hostingProviderUuid, comicseries?.uuid, comicissue?.uuid]);

  if (isPatreonExclusive && (!isAuthenticated || !isConnectedToHostingProvider)) {
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
          <div className="flex items-center justify-center h-96">
            {!isAuthenticated
              ? <SignupButton />
              : !isConnectedToHostingProvider
                ? <PatreonConnectButton />
                : <></>
            }
          </div>
        </div>
      </div>
    );
  }


  if (isPatreonExclusive && isCheckingAccess) {
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
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <svg className="animate-spin h-5 w-5 ml-2 mr-1" viewBox="0 0 24 24">
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
            </svg>
            </div>
          </div>
        </div>
      </div>
    );
  }


  if (isPatreonExclusive && !isCheckingAccess && contentToken && !hasAccessToIssue) {
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
          <YouNeedToBeAPatreonBacker creators={comicseries?.creators?.filter(Boolean) as Creator[] | undefined} creatorLinks={creatorLinks} />
        </div>
      </div>  
    );
  }

  return (
    <div className={`mx-auto sm:p-6 lg:p-8 zoomed-in:max-w-3xl max-w-xl`}>      
      <div className='flex flex-col p y-4 sm:py-0'>
        <div className="flex items-center mb-2">
          {comicSeriesLink && (
            <Link to={comicSeriesLink} className="flex flex-row mr-2">
              <MdChevronLeft size={24} />
              <p className="font-semibold">All Episodes</p>
            </Link>
          )}
        </div>
        {comicissue?.stories && comicissue.stories.map((story, index) => {
          const storyImageUrl = getStoryImageUrl({ storyImageAsString: story?.storyImageAsString, token: contentToken || undefined });
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

const SignupButton = () => {
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <p className="text-lg text-center mb-6">Please sign up to continue</p>
      <div className="flex flex-row">
      <button
        onClick={() => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('openSignupModal'));
          }
        }}
        className="bg-red-500 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-800 text-white font-semibold px-6 py-2 rounded-full flex items-center justify-center"
      >
        Sign Up
      </button>
      </div>
    </div>
  )
}

const PatreonConnectButton = () => {
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <p className="text-lg text-center mb-6">Please connect your Patreon account to access this comic issue.</p>
      <div className="flex flex-row">
        <Link to="/profile/edit/patreon"
          className="bg-red-500 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-800 text-white font-semibold px-6 py-2 rounded-full flex items-center justify-center">
          Connect Patreon
        </Link>
      </div>
    </div>
  )
}

const YouNeedToBeAPatreonBacker = ({ creators, creatorLinks }: { creators?: Creator[] | undefined, creatorLinks?: CreatorLinkDetails[] } ) => {
  const creatorName = creators?.[0]?.name || 'this creator';
  const patreonUrl = creatorLinks?.find(link => link.type === LinkType.PATREON)?.url || undefined;
  const creatorAvatar = getAvatarImageUrl({ avatarImageAsString: creators?.[0]?.avatarImageAsString });

  return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center max-w-sm mx-auto px-4">
        {patreonUrl 
          ? (
            <Link to={patreonUrl} target="_blank" rel="noopener noreferrer" className="flex flex-row items-center justify-center">
              <img src={creatorAvatar} alt="Creator Avatar" className="w-16 h-16 rounded-full mb-4" />
            </Link>
          )
          : (
            <div className="flex flex-row items-center justify-center">
              <img src={creatorAvatar} alt="Creator Avatar" className="w-16 h-16 rounded-full mb-4" />
            </div>
          )
        }

        <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">
          You need to be a <span className="text-brand-pink dark:text-brand-purple">Patreon</span> backer of {creatorName} to get access to this episode.
        </h2>
        {patreonUrl && (
          <a 
            href={patreonUrl}
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block bg-brand-pink dark:bg-brand-purple hover:bg-brand-pink-dark dark:hover:bg-brand-purple-dark text-white font-bold py-2 px-8 rounded-full text-lg transition-colors duration-200 mt-6"
          >
            BECOME A PATREON BACKER
          </a>
        )}
      </div>
    </div>
  )
}