import React from 'react';
import { MdBookmark, MdBookmarkBorder, MdNotificationsActive, MdNotificationsNone } from 'react-icons/md';

interface AddToProfileButtonProps {
  isSubscribed: boolean;
  isLoading: boolean;
  onPress: () => void;
  selectedText: string;
  unselectedText: string;
}

interface NotificationButtonProps {
  isReceivingNotifications: boolean;
  isLoading: boolean;
  onPress: () => void;
}

export const AddToProfileButton = ({ 
  isSubscribed, 
  isLoading, 
  onPress,
  selectedText,
  unselectedText
}: AddToProfileButtonProps) => {
  return (
    <button
      onClick={onPress}
      disabled={isLoading}
      className="flex items-center justify-center bg-white/80 hover:bg-white rounded-full h-10 px-4 mr-2 transition-colors duration-200 disabled:opacity-50"
    >
      <div className="flex items-center justify-center">
        {isLoading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black" />
        ) : (
          <>
            {isSubscribed ? (
              <MdBookmark className="text-black" size={22} />
            ) : (
              <MdBookmarkBorder className="text-black" size={22} />
            )}
          </>
        )}
        <span className="ml-1.5 text-black font-semibold">
          {isSubscribed ? selectedText : unselectedText}
        </span>
      </div>
    </button>
  );
};

export const NotificationButton = ({
  isReceivingNotifications,
  isLoading,
  onPress,
}: NotificationButtonProps) => {
  return (
    <button
      onClick={onPress}
      disabled={isLoading}
      className="flex items-center justify-center bg-white/80 hover:bg-white rounded-full h-10 w-10 transition-colors duration-200 disabled:opacity-50"
    >
      <div className="flex items-center justify-center">
        {isLoading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black" />
        ) : (
          <>
            {isReceivingNotifications ? (
              <MdNotificationsActive   className="text-black" size={24} />
            ) : (
              <MdNotificationsNone className="text-black" size={24} />
            )}
          </>
        )}
      </div>
    </button> 
  );
};