import React from 'react';
import { MdFavorite } from 'react-icons/md';
import type { Creator } from '@inkverse/shared-client/graphql/operations';

interface SuperLikeButtonProps {
  isLoading: boolean;
  onPress: () => void;
  hasLikedAll: boolean;
  creators?: (Creator | null)[];
}

// Format creator names: "Alice", "Alice and Bob", "Alice, Bob, and Charlie"
function formatCreatorNames(creators?: (Creator | null)[]): string {
  const names = creators?.map(c => c?.name).filter((name): name is string => !!name) ?? [];
  if (names.length === 0) return 'the creators';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}

export const SuperLikeButton = ({
  isLoading,
  onPress,
  hasLikedAll,
  creators,
}: SuperLikeButtonProps) => {
  if (hasLikedAll) {
    const creatorNames = formatCreatorNames(creators);
    return (
      <div className="flex justify-center py-3">
        <div className="flex flex-col items-center gap-2 px-6 py-3 text-rose-400 dark:text-rose-300">
          <div className="flex items-center gap-2">
            <MdFavorite size={20} className="text-red-500 dark:text-red-400" />
            <span className="font-medium">You liked all episodes!</span>
          </div>
          <span className="font-medium">We'll let {creatorNames} know they're doing a great job!</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center py-3">
      <button
        onClick={onPress}
        disabled={isLoading}
        className="flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-rose-500 to-red-500 dark:from-rose-600 dark:to-red-600 hover:from-rose-600 hover:to-red-600 dark:hover:from-rose-500 dark:hover:to-red-500 text-white font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50"
      >
        {isLoading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
        ) : (
          <MdFavorite size={20} />
        )}
        <span className="text-sm">Like All Episodes</span>
      </button>
    </div>
  );
};
