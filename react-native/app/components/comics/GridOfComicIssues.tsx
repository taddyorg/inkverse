import React, { useRef, useEffect, useLayoutEffect, memo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';

import { ThemedText, PressableOpacity, ThemedTextFontFamilyMap } from '../ui';
import { ComicIssue, ComicSeries } from '@inkverse/shared-client/graphql/operations';
import { getThumbnailImageUrl } from '@inkverse/public/comicissue';
import { COMICISSUE_SCREEN } from '@/constants/Navigation';

interface GridOfComicIssuesProps {
  comicseries?: ComicSeries | null;
  comicissue?: ComicIssue | null;
  allIssues: ComicIssue[];
}

interface PreviewComicIssueProps {
  comicissue: ComicIssue;
  isCurrentIssue: boolean;
  onPress: () => void;
}

const PatreonLockBadge = () => (
  <View style={styles.lockIconContainer}>
    <MaterialIcons name="lock" size={40} color="white" />
  </View>
);

const PreviewComicIssue = memo(({ 
  comicissue, 
  isCurrentIssue, 
  onPress 
}: PreviewComicIssueProps) => {
  const isPatreonExclusive = comicissue.scopesForExclusiveContent?.includes('patreon');
  const thumbnailImageUrl = getThumbnailImageUrl({ thumbnailImageAsString: comicissue.thumbnailImageAsString });
  
  if (!thumbnailImageUrl) return null;

  // Create the content that will be used in both cases
  const content = (
    <>
      <View style={styles.imageContainer}>
        <Image
          style={[
            styles.thumbnailImage,
            isPatreonExclusive && styles.patreonExclusiveImage
          ]}
          source={{ uri: thumbnailImageUrl }}
          recyclingKey={comicissue.uuid}
          contentFit="cover"
          priority="low"
        />
        {isPatreonExclusive && <PatreonLockBadge />}
      </View>
      <ThemedText 
        style={[
          styles.episodeTitle,
          isCurrentIssue && styles.currentEpisodeTitle,
          isPatreonExclusive && styles.patreonExclusiveTitle
        ]}
      >
        {comicissue.name}
        {isPatreonExclusive && <ThemedText style={styles.patreonLabel}> (PATREON EXCLUSIVE)</ThemedText>}
      </ThemedText>
    </>
  );

  // Use Pressable for both cases, but disable onPress for current issue
  // This allows touch events to propagate for scrolling
  return (
    <PressableOpacity 
      style={[
        styles.gridItem, 
        isCurrentIssue && styles.currentIssue
      ]}
      fadeLevel={isCurrentIssue ? 1 : 0.5}
      onPress={isCurrentIssue ? undefined : onPress}
      // Allow touch events to propagate for scrolling
      android_disableSound={isCurrentIssue}
      android_ripple={isCurrentIssue ? null : { color: 'rgba(0, 0, 0, 0.1)' }}
    >
      {content}
    </PressableOpacity>
  );
});

// const PreviewComicIssueWrapper = memo(({ 
//   children, 
//   isCurrentIssue, 
//   onPress 
// }: { 
//   children: React.ReactNode, 
//   isCurrentIssue: boolean, 
//   onPress: () => void 
// }) => {
//   if (isCurrentIssue) {
//     return (
//       <View style={[styles.gridItem, styles.currentIssue]}>
//         {children}
//       </View>
//     );
//   }
  
//   return (
//       {children}
//     </PressableOpacity>
//   );
// });

export const GridOfComicIssues = ({ comicseries, comicissue, allIssues }: GridOfComicIssuesProps) => {
  const navigation = useNavigation();
  const flashListRef = useRef<FlashList<ComicIssue>>(null);
  const currentIndex = comicissue ? allIssues.findIndex(issue => issue.uuid === comicissue.uuid) : -1;

  const handleIssuePress = (issue: ComicIssue) => {
    if (!comicseries?.uuid) return;
    
    navigation.navigate(COMICISSUE_SCREEN, {
      issueUuid: issue.uuid,
      seriesUuid: comicseries.uuid,
    });
  };

  // Function to handle scrolling to the current issue
  const scrollToCurrentIssue = () => {
    if (!flashListRef.current || !comicissue?.uuid || allIssues.length === 0 || currentIndex === -1) return;
    
    // Delay to ensure the FlashList has rendered properly
    setTimeout(() => {
      if (!flashListRef.current) return;
      
      try {
        flashListRef.current.scrollToIndex({
          index: currentIndex,
          animated: true,
          viewPosition: 0.5 // Center the item
        });
      } catch (error) {
        console.log('Failed to scroll to index, retrying...', error);
        
        // Retry with a longer delay if first attempt fails
        setTimeout(() => {
          if (!flashListRef.current) return;
          flashListRef.current.scrollToIndex({
            index: currentIndex,
            animated: false, // Try without animation as fallback
            viewPosition: 0.5
          });
        }, 500);
      }
    }, 300);
  };

  // Use useLayoutEffect to ensure this runs after layout but before paint
  useLayoutEffect(() => {
    if (currentIndex !== -1) {
      scrollToCurrentIssue();
    }
  }, [comicissue?.uuid, allIssues]);

  const renderItem = ({ item }: { item: ComicIssue }) => (
    <PreviewComicIssue
      comicissue={item}
      isCurrentIssue={item.uuid === comicissue?.uuid}
      onPress={() => handleIssuePress(item)}
    />
  );

  if (!comicseries || !comicissue || allIssues.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>More Episodes</ThemedText>
      <View style={styles.flashListContainer}>
        <FlashList
          ref={flashListRef}
          data={allIssues}
          renderItem={renderItem}
          keyExtractor={(item) => item.uuid}
          horizontal
          showsHorizontalScrollIndicator={false}
          estimatedItemSize={styles.gridItem.width as number}
          initialScrollIndex={currentIndex > -1 ? currentIndex : undefined}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: ThemedTextFontFamilyMap['bold'],
    marginBottom: 16,
  },
  flashListContainer: {
    height: 220, // Height for thumbnail + title text + padding
    width: '100%',
  },
  gridItem: {
    width: 140,
    marginRight: 8,
    paddingHorizontal: 4,
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  currentIssue: {
    opacity: 0.7,
  },
  thumbnailImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
  },
  patreonExclusiveImage: {
    opacity: 0.5,
  },
  lockIconContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  episodeTitle: {
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '600',
  },
  currentEpisodeTitle: {
    color: '#FF69B4',
  },
  patreonExclusiveTitle: {
    opacity: 0.6,
  },
  patreonLabel: {
    fontSize: 11,
    fontFamily: ThemedTextFontFamilyMap.semiBold,
  },
}); 