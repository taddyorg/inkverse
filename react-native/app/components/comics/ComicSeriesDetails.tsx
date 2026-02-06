import * as React from 'react';
import { StyleSheet, TouchableOpacity, View, Dimensions, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/constants/Navigation';

import { ThemedText, ThemedTextFontFamilyMap, ThemedView, PressableOpacity } from '../ui';
import { CreatorDetails } from '../creator/CreatorDetails';

import { COMICS_LIST_SCREEN, COMICSERIES_SCREEN } from '@/constants/Navigation';
import { ComicSeries, Genre } from '@inkverse/shared-client/graphql/operations';
import { getBannerImageUrl, getCoverImageUrl, getThumbnailImageUrl } from '@inkverse/public/comicseries';
import { getPrettyGenre } from '@inkverse/public/genres';
import { formatCompactNumber } from '@inkverse/public/utils';
import { useThemeColor } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';

type ComicSeriesPageType = 
  | 'comicseries-screen'
  | 'featured-banner'
  | 'most-popular'
  | 'cover'
  | 'search'
  | 'list-item'
  | 'list-item-no-link'
  | 'grid-item';

interface ComicSeriesDetailsProps {
  comicseries: ComicSeries | null | undefined;
  pageType: ComicSeriesPageType;
  isHeaderVisible?: boolean;
  onHeaderVisibilityChange?: (isVisible: boolean) => void;
  imagePriority?: 'high' | 'normal' | 'low';
  likeCount?: number;
  commentCount?: number;
}

export function ComicSeriesDetails({ comicseries, pageType, isHeaderVisible, onHeaderVisibilityChange, imagePriority, likeCount, commentCount }: ComicSeriesDetailsProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  if (!comicseries) return null;

  const handlePressForNavigation = () => {
    navigation.navigate(COMICSERIES_SCREEN, { 
      uuid: comicseries.uuid
    });
  };

  const handlePressForShowAndHideHeader = () => {
    const newVisibility = !isHeaderVisible;
    onHeaderVisibilityChange?.(newVisibility);
  };

  const formatGenres = (comicseries: ComicSeries) => {
    const genres = [comicseries.genre0, comicseries.genre1, comicseries.genre2];
    return genres.filter(Boolean).map(genre => getPrettyGenre(genre as Genre)).join('  •  ');
  };

  switch (pageType) {
    case 'most-popular':
      return (
        <TouchableOpacity onPress={handlePressForNavigation} style={styles.popularContainer}>
          <Image
            source={getThumbnailImageUrl({ thumbnailImageAsString: comicseries.thumbnailImageAsString })}
            style={styles.popularImage}
            contentFit="contain"
            recyclingKey={comicseries.uuid}
            priority={imagePriority}
          />
          <View style={styles.popularContent}>
            <ThemedText style={styles.popularTitle}>{comicseries.name}</ThemedText>
            <ThemedText style={styles.genreTextAlt}>{formatGenres(comicseries)}</ThemedText>
          </View>
        </TouchableOpacity>
      );

    case 'featured-banner':
      return (
        <TouchableOpacity onPress={handlePressForNavigation} style={styles.featuredContainer}>
          <Image
            source={getBannerImageUrl({ bannerImageAsString: comicseries.bannerImageAsString, variant: "large" })}
            style={styles.featuredImage}
            contentFit="cover"
            recyclingKey={comicseries.uuid}
            priority={imagePriority}
          />
        </TouchableOpacity>
      );

    case 'cover':
      return (
        <TouchableOpacity onPress={handlePressForNavigation}>
          <Image
            source={getCoverImageUrl({ coverImageAsString: comicseries.coverImageAsString })}
            style={styles.coverImage}
            contentFit="contain"
            recyclingKey={comicseries.uuid}
          />
        </TouchableOpacity>
      );

    case 'list-item':
      return (
        <PressableOpacity style={styles.comicSeriesItem} onPress={handlePressForNavigation}>
            <View style={{ flexDirection: 'row' }}>
              <Image
                source={getCoverImageUrl({ coverImageAsString: comicseries.coverImageAsString })}
                style={styles.listItemImage}
                contentFit="contain"
                recyclingKey={comicseries.uuid}
                priority={imagePriority}
              />
              <View style={styles.comicSeriesContent}>
                <ThemedText size="subtitle" font="bold" style={styles.comicSeriesTitle}>{comicseries.name}</ThemedText>
                <ThemedText style={styles.genreTextAlt2}>
                  {formatGenres(comicseries)}
                </ThemedText>
                {comicseries.description && (
                  <ThemedText style={styles.comicSeriesDescription} numberOfLines={4}>
                    {comicseries.description}
                  </ThemedText>
                )}
              </View>
            </View>
        </PressableOpacity>
      );

    case 'list-item-no-link':
        return (
          <View style={styles.popularContainer}>
            <Image
              source={getThumbnailImageUrl({ thumbnailImageAsString: comicseries.thumbnailImageAsString })}
              style={styles.popularImage}
              contentFit="contain"
              recyclingKey={comicseries.uuid}
              priority={imagePriority}
            />
            <View style={styles.popularContent}>
              <ThemedText style={styles.popularTitle}>{comicseries.name}</ThemedText>
              <ThemedText style={styles.genreTextAlt}>{formatGenres(comicseries)}</ThemedText>
            </View>
          </View>
        );

    case 'grid-item':
      return (
        <PressableOpacity style={styles.gridItemContainer} onPress={handlePressForNavigation}>
          <Image
            source={getCoverImageUrl({ coverImageAsString: comicseries.coverImageAsString })}
            style={styles.gridItemImage}
            contentFit="cover"
            recyclingKey={comicseries.uuid}
            priority={imagePriority || 'normal'}
          />
        </PressableOpacity>
      );

    case 'comicseries-screen':
      const tagColor = useThemeColor({}, 'tag');
      const textColor = useThemeColor({}, 'text');
      
      return (
        <ThemedView style={styles.container}>
          <Pressable onPress={handlePressForShowAndHideHeader}>
            <Image
              source={getCoverImageUrl({ coverImageAsString: comicseries.coverImageAsString })}
              style={styles.coverImageFullWidth}
              contentFit="cover"
              recyclingKey={comicseries.uuid}
              priority="high"
            />
          </Pressable>
          <View style={styles.infoContainer}>
            <ThemedText size="title" style={styles.title}>{comicseries.name} </ThemedText>
            <View style={styles.genreAndStatsContainer}>
              <ThemedText style={styles.genreText}>
                {formatGenres(comicseries)}
              </ThemedText>
              {((likeCount ?? 0) > 0 || (commentCount ?? 0) > 0) && (
                <View style={styles.statsRow}>
                  {(likeCount ?? 0) > 0 && (
                    <View style={styles.statItem}>
                      <Ionicons name="heart" size={18} color="#f43f5e" />
                      <ThemedText style={styles.statText}>{formatCompactNumber(likeCount ?? 0)}</ThemedText>
                    </View>
                  )}
                  {(commentCount ?? 0) > 0 && (
                    <View style={styles.statItem}>
                      <Ionicons name="chatbubble" size={16} color={textColor} />
                      <ThemedText style={styles.statText}>{formatCompactNumber(commentCount ?? 0)}</ThemedText>
                    </View>
                  )}
                </View>
              )}
            </View>
            <View style={styles.creatorContainer}>
              <View style={styles.creatorGrid}>
                {comicseries.creators?.map((creator, index) => (
                  <CreatorDetails 
                    key={creator?.uuid} 
                    creator={creator} 
                    pageType='mini-creator' 
                  />
                ))}
              </View>
            </View>
            <ThemedText style={styles.description}>
              {comicseries.description?.trim()}
            </ThemedText>
            <View style={styles.tagsContainer}>
              {comicseries.tags?.map((tag, index) => (
                <PressableOpacity key={tag?.toLowerCase()} fadeLevel={0.3} style={[styles.tag, { backgroundColor: tagColor + '20', borderColor: tagColor + '40' }]} onPress={() => tag && navigation.navigate(COMICS_LIST_SCREEN, {
                  pageType: 'tag',
                  value: tag,
                })}>
                  <ThemedText style={styles.tagText}>
                    {tag?.toLowerCase()}
                  </ThemedText>
                </PressableOpacity>
              ))}
            </View>
          </View>
        </ThemedView>
      );

    default:
      return null;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  coverImage: {
    height: 220,
    aspectRatio: 4 / 6,
    borderRadius: 6,
  },
  coverImageFullWidth: {
    height: Dimensions.get('window').width * 6 / 4,
    width: '100%',
    borderRadius: 1,
  },
  infoContainer: {
    marginHorizontal: 16,
  },
  genreAndStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  genreInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genreText: {
    fontSize: 16,
    fontFamily: ThemedTextFontFamilyMap.bold,
    marginBottom: 8,
  },
  genreTextAlt: {
    fontSize: 16,
    marginBottom: 8,
  },
  genreTextAlt2: {
    fontSize: 16,
    marginBottom: 4,
  },
  title: {
    marginTop: 12,
    marginBottom: 2,
  },
  creatorContainer: {
    marginBottom: 2,
  },
  creatorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  creatorWrapper: {
    width: '50%',
    paddingHorizontal: 8,
  },
  creator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  creatorAvatar: {
    height: 32,
    width: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  creatorText: {
    fontSize: 18,
  },
  description: {
    fontSize: 16,
    marginBottom: 10,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  tag: {
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 15,
    // color: Colors.dark.background,
    // backgroundColor: Colors.light.tint + '20', // Using light tint with opacity
    // borderColor: Colors.light.tint + '40',
  },
  featuredContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    maxHeight: 470,
    borderRadius: 12,
    overflow: 'hidden',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  popularContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  popularImage: {
    height: 128,
    aspectRatio: 1,
    borderRadius: 8,
  },
  popularContent: {
    flex: 1,
    padding: 12,
  },
  popularTitle: {
    fontSize: 18,
    fontFamily: ThemedTextFontFamilyMap.bold,
    marginBottom: 8,
  },
  // Styles for LIST_ITEM page type
  listItemContainer: {
    flexDirection: 'row',
  },
  listItemImage: {
    height: 200,
    aspectRatio: 4/6,
    borderRadius: 8,
  },
  comicSeriesItem: {
    marginBottom: 20,
  },
  comicSeriesIndex: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  comicSeriesContent: {
    flex: 1,
    paddingHorizontal: 12,
  },
  comicSeriesTitle: {
    marginBottom: 2,
  },
  comicSeriesDescription: {
    fontSize: 14,
  },
  gridItemContainer: {
    marginHorizontal: 8,
    marginBottom: 16,
  },
  gridItemImage: {
    width: '100%',
    aspectRatio: 2/3,
    borderRadius: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    fontWeight: '500',
  },
}); 