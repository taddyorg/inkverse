import React, { useCallback } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';

import { ThemedText, ThemedView, ThemedTextFontFamilyMap, useLayout } from '../ui/index';
import { LIST_SCREEN, RootStackParamList } from '@/constants/Navigation';
import { MAX_CONTENT_WIDTH } from '@/constants/Layout';
import type { List } from '@inkverse/shared-client/graphql/operations';
import { ComicSeriesDetails } from '../comics/ComicSeriesDetails';

type ListPageType = 
  | 'list-screen'
  | 'featured-list';

interface ListDetailsProps {
  list: List;
  pageType: ListPageType;
  imagePriority?: 'high' | 'normal' | 'low';
}

export function ListDetails({ list, pageType, imagePriority }: ListDetailsProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isSm } = useLayout();

  if (pageType === 'featured-list') {
    return (
      <TouchableOpacity style={styles.curatedListItem} onPress={() => {
        navigation.navigate(LIST_SCREEN, { id: list.id });
      }}>
        <Image
          source={{ uri: list.bannerImageUrl ?? '' }}
          style={styles.curatedListImage}
          contentFit="cover"
          recyclingKey={list.id}
          priority={imagePriority}
        />
      </TouchableOpacity>
    );
  }

  if (pageType === 'list-screen') {
    return (
      <ThemedView style={styles.listContainer}>
        <View style={styles.bannerContainer}>
          <Image
            source={{ uri: list.bannerImageUrl ?? '' }}
            style={[styles.bannerFullWidth, isSm && styles.bannerWide]}
            contentFit="cover"
            recyclingKey={list.id}
            priority="high"
          />
        </View>
        <View style={styles.detailsContainer}>
        {/* <ThemedText style={styles.title}>{list.name}</ThemedText> */}
        {list.description && 
          <ThemedText style={styles.description}>{list.description}</ThemedText>
        }
        {list.comicSeries && list.comicSeries.length > 0 && (
          <FlashList
            data={list.comicSeries.filter(series => series !== null)}
            renderItem={({ item: series, index }) => (
              <ComicSeriesDetails 
                key={series.uuid} 
                comicseries={series} 
                pageType='list-item'
              />
            )}
            keyExtractor={series => series.uuid}
          />
        )}
        </View>
      </ThemedView>
    );
  }
}

const styles = StyleSheet.create({
  listContainer: {
    flex: 1,
  },
  detailsContainer: {
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: ThemedTextFontFamilyMap['bold'],
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    marginBottom: 16,
  },
  bannerContainer: {
    alignItems: 'center',
  },
  bannerFullWidth: {
    width: '95%',
    aspectRatio: 16 / 9,
    borderRadius: 8,
    overflow: 'hidden',
  },
  // Smaller 16:9 banner on wider layouts (landscape, iPad)
  bannerWide: {
    width: MAX_CONTENT_WIDTH.banner,
    height: MAX_CONTENT_WIDTH.banner * 9 / 16,
  },
  curatedListItem: {
    width: 340,
    aspectRatio: 16 / 9,
    marginRight: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  curatedListImage: {
    width: '100%',
    height: '100%',
  },
}); 