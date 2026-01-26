import React from 'react';
import { MdFavorite, MdFavoriteBorder } from 'react-icons/md';

interface LikeButtonProps {
  isLiked: boolean;
  likeCount: number;
  isLoading: boolean;
  onPress: () => void;
}

export const LikeButton = ({
  isLiked,
  likeCount,
  isLoading,
  onPress,
}: LikeButtonProps) => {
  const formattedCount = likeCount.toLocaleString();

  return (
    <div className="flex justify-center py-5">
      <button
        onClick={onPress}
        disabled={isLoading}
        className="flex items-center justify-center bg-white/80 hover:bg-white rounded-full h-10 px-4 transition-colors duration-200 disabled:opacity-50"
      >
        <div className="flex items-center justify-center">
          {isLoading 
            ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black" />
            : isLiked 
              ? <MdFavorite className="text-rose-500" size={22} />
              : <MdFavoriteBorder className="text-black" size={22} />
          }
          <span className="ml-1.5 text-black font-semibold">
            {formattedCount}
          </span>
        </div>
      </button>
    </div>
  );
};
