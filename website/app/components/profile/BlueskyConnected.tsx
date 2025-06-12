import React from 'react';
import { FaCheckCircle } from 'react-icons/fa';
import type { ComicSeries } from '@inkverse/shared-client/graphql/operations';
import { ComicSeriesDetails } from '../comics/ComicSeriesDetails';

interface BlueskyConnectedProps {
  handle: string;
  loading: boolean;
  error: string | null;
  comicSeries: ComicSeries[] | null;
  onContinue: () => void;
  onSkip: () => void;
}

interface ComicsFoundProps {
  comicSeries: ComicSeries[] | null;
  onContinue: () => void;
}

function ComicsFound({ comicSeries, onContinue }: ComicsFoundProps) {
  return (
    <>
      <p className="text-inkverse-black dark:text-white mb-8 text-center">
        We found {comicSeries?.length} comic{comicSeries?.length === 1 ? '' : 's'} you follow on Bluesky.
      </p>
      <div className="flex flex-col gap-4">
        {comicSeries?.map((series) => {
          return (
            <ComicSeriesDetails key={series.uuid} comicseries={series} pageType="list-item-no-link" />
          );
        })}
      </div>
      <button
        onClick={onContinue}
        className="bg-brand-pink dark:bg-taddy-blue text-white px-6 py-2 rounded-lg font-medium hover:bg-brand-pink-dark dark:hover:bg-taddy-blue-dark transition-colors"
      >
        Add these comics to your profile
      </button>
    </>
  );
}

function NoComicsFound() {
  return (
    <>
      <p className="text-inkverse-black dark:text-white mb-8 text-center">
        We didn't find any comics you follow on Bluesky.
      </p>
    </>
  );
}

export function BlueskyConnected({ handle, loading, error, comicSeries, onContinue, onSkip }: BlueskyConnectedProps) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-20 h-20 mb-6">
        <FaCheckCircle className="w-full h-full text-green-500" />
      </div>
      
      <h2 className="text-2xl font-bold mb-2 text-inkverse-black dark:text-white">Bluesky Connected!</h2>
      
      {loading ? (
        <p className="text-inkverse-black dark:text-white mb-8">Finding creators you follow...</p>
      ) : error ? (
        <div className="text-center mb-8">
          <p className="text-red-600 mb-2">{error}</p>
          <p className="text-inkverse-black dark:text-white">But your Bluesky account is connected.</p>
        </div>
      ) : comicSeries && comicSeries.length > 0 ? (
        <ComicsFound comicSeries={comicSeries} onContinue={onContinue} />
      ) : (
        <NoComicsFound />
      )}
      <button
        onClick={onSkip}
        className="mx-auto block text-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mt-4"
      >
        {comicSeries && comicSeries.length > 0 ? 'Skip' : 'Continue'}
      </button>
    </div>
  );
}