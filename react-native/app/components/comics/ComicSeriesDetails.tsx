import * as React from 'react';
import { StyleSheet, TouchableOpacity, View, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/constants/Navigation';

import { ThemedText, ThemedTextFontFamilyMap, ThemedView, PressableOpacity, ExpandableText, useLayout } from '../ui';

import { COMICS_LIST_SCREEN, COMICSERIES_SCREEN } from '@/constants/Navigation';
import { ComicSeries, Genre } from '@inkverse/shared-client/graphql/operations';
import { getBannerImageUrl, getCoverImageUrl, getThumbnailImageUrl } from '@inkverse/public/comicseries';
import { getPrettyGenre } from '@inkverse/public/genres';
import { getGenreAndTagPills } from '@inkverse/shared-client/utils/genre-tag-pills';
import { formatCompactNumber } from '@inkverse/public/utils';
import { useThemeColor } from '@/constants/Colors';
import { SPACING } from '@/constants/Spacing';
import { Ionicons } from '@expo/vector-icons';
import { ComicSeriesTagline } from './ComicSeriesTagline';

type ComicSeriesPageType = 
  | 'comicseries-screen'
  | 'featured-banner'
  | 'most-popular'
  | 'cover'
  | 'cover-with-tagline'
  | 'search'
  | 'list-item'
  | 'list-item-no-link'
  | 'grid-item'
  | 'grid-item-with-tagline';

interface ComicSeriesDetailsProps {
  comicseries: ComicSeries | null | undefined;
  pageType: ComicSeriesPageType;
  isHeaderVisible?: boolean;
  onHeaderVisibilityChange?: (isVisible: boolean) => void;
  imagePriority?: 'high' | 'normal' | 'low';
  likeCount?: number;
  commentCount?: number;
  // Rendered between the stats and the description on the comicseries screen
  actions?: React.ReactNode;
}

type Pill = {
  label: string;
  onPress: () => void;
};

export function ComicSeriesDetails({ comicseries, pageType, isHeaderVisible, onHeaderVisibilityChange, imagePriority, likeCount, commentCount, actions }: ComicSeriesDetailsProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const tagColor = useThemeColor({}, 'tag');
  const textColor = useThemeColor({}, 'text');
  const { contentWidth, isSm } = useLayout();

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

  const getPills = (comicseries: ComicSeries): Pill[] =>
    getGenreAndTagPills(comicseries).map(pill => ({
      label: pill.label,
      onPress: () => navigation.navigate(COMICS_LIST_SCREEN, { pageType: pill.kind, value: pill.value }),
    }));

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
            {!!comicseries.tagline && (
              <ThemedText style={styles.genreTextAlt}>{comicseries.tagline}</ThemedText>
            )}
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

    case 'cover-with-tagline':
      return (
        <TouchableOpacity onPress={handlePressForNavigation}>
          <Image
            source={getCoverImageUrl({ coverImageAsString: comicseries.coverImageAsString })}
            style={styles.coverImage}
            contentFit="contain"
            recyclingKey={comicseries.uuid}
          />
          {!!comicseries.tagline && (
            <ThemedText style={styles.coverTagline} numberOfLines={2}>
              {comicseries.tagline}
            </ThemedText>
          )}
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
                <ThemedText size="subtitle" style={styles.comicSeriesTitle}>{comicseries.name}</ThemedText>
                {!!comicseries.tagline && (
                  <ThemedText style={styles.genreTextAlt2}>
                    {comicseries.tagline}
                  </ThemedText>
                )}
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

    case 'grid-item-with-tagline':
      return (
        <PressableOpacity style={styles.gridItemContainer} onPress={handlePressForNavigation}>
          <Image
            source={getCoverImageUrl({ coverImageAsString: comicseries.coverImageAsString })}
            style={styles.gridItemImage}
            contentFit="cover"
            recyclingKey={comicseries.uuid}
            priority={imagePriority || 'normal'}
          />
          {!!comicseries.tagline && (
            <ThemedText size="subtitle" style={styles.gridItemTaglineText} numberOfLines={2}>
              {comicseries.tagline}
            </ThemedText>
          )}
        </PressableOpacity>
      );

    case 'comicseries-screen':
      // No visible title: the cover art always includes it, so screen readers get it from the cover.
      // Wider layouts keep the same single column, with a fixed-size cover centered on top.
      const description = comicseries.description?.trim();
      return (
        <ThemedView style={styles.container}>
          <Pressable
            onPress={handlePressForShowAndHideHeader}
            disabled={isSm}
            style={isSm && styles.coverCentered}
            accessible
            accessibilityRole="header"
            accessibilityLabel={comicseries.name ?? undefined}
          >
            <Image
              source={getCoverImageUrl({ coverImageAsString: comicseries.coverImageAsString })}
              style={isSm ? styles.coverImageCentered : [styles.coverImageFullWidth, { height: contentWidth * 6 / 4 }]}
              contentFit="cover"
              recyclingKey={comicseries.uuid}
              priority="high"
            />
          </Pressable>
          {(!!comicseries.tagline || (likeCount ?? 0) > 0 || (commentCount ?? 0) > 0) && (
            <View style={styles.taglineRow}>
              <ComicSeriesTagline comicseries={comicseries} />
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
          )}
          {actions}
          <View style={styles.infoContainer}>
            {!!description && (
              <ExpandableText text={description} numberOfLines={3} style={styles.description} />
            )}
            <View style={styles.tagsContainer}>
              {getPills(comicseries).map(pill => (
                <PressableOpacity key={pill.label} fadeLevel={0.3} style={[styles.tag, { backgroundColor: tagColor + '20', borderColor: tagColor + '40' }]} onPress={pill.onPress}>
                  <ThemedText style={styles.tagText}>
                    {pill.label}
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
  // Same width as coverImage, so a long tagline wraps instead of widening the card
  coverTagline: {
    width: 220 * 4 / 6,
    marginTop: 6,
    fontSize: 14,
    fontFamily: ThemedTextFontFamilyMap.semiBold,
    textAlign: 'center',
  },
  coverImageFullWidth: {
    width: '100%',
    borderRadius: 1,
  },
  coverCentered: {
    alignSelf: 'center',
  },
  coverImageCentered: {
    height: 360,
    aspectRatio: 4 / 6,
    borderRadius: 8,
  },
  infoContainer: {
    marginHorizontal: 16,
  },
  taglineRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
    marginHorizontal: 16,
    marginTop: SPACING.md,
  },
  genreInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genreTextAlt: {
    fontSize: 16,
    marginBottom: 8,
  },
  genreTextAlt2: {
    fontSize: 16,
    marginBottom: 4,
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
    marginBottom: SPACING.md,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  tag: {
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 8,
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
    marginBottom: 20,
  },
  gridItemImage: {
    width: '100%',
    aspectRatio: 2/3,
    borderRadius: 12,
  },
  gridItemTaglineText: {
    fontSize: 15,
    marginTop: 8,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: SPACING.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
  },
}); 