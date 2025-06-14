import React, { memo, useCallback, useState } from 'react';
import { Image, ImageLoadEventData } from 'expo-image';

import { ComicStory } from '@inkverse/shared-client/graphql/operations';
import { getStoryImageUrl } from '@inkverse/public/comicstory';

interface StoryImageProps {
  story: ComicStory | null | undefined;
  screenDetails: { width: number, height: number };
}

export const StoryImage = ({ story, screenDetails }: StoryImageProps) => {
  const storyImageUrl = getStoryImageUrl({ storyImageAsString: story?.storyImageAsString });
  if (!storyImageUrl) return null;
  const [aspectRatio, setAspectRatio] = useState(getInitialAspectRatio(story?.width, story?.height, screenDetails));

  const handleImageLoad = useCallback((event: ImageLoadEventData) => {
    const { width, height } = event.source;
    setAspectRatio(width / height);
  }, [story?.uuid]);

  return (
    <Image
      style={{ width: screenDetails.width, height: Math.floor(screenDetails.width / aspectRatio) }}
      source={{ uri: storyImageUrl }}
      onLoad={handleImageLoad}
      recyclingKey={story?.uuid}
      contentFit="cover"
    />
  );
};

function getInitialAspectRatio(width: number | null | undefined, height: number | null | undefined, screenDetails: { width: number, height: number }) {
  if (width && height) {
    return width / height;
  }

  return screenDetails.width / screenDetails.height;
}

function arePropsEqual(prevProps: StoryImageProps, nextProps: StoryImageProps) {
  return prevProps.story?.uuid === nextProps.story?.uuid;
}

export default memo(StoryImage, arePropsEqual);