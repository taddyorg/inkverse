import { useReducer, useState, useCallback, useEffect, memo, useRef } from 'react';
import { StyleSheet, TouchableOpacity, View, FlatList, ListRenderItem } from 'react-native';
import { useNavigation, useScrollToTop } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';

import { Screen, ThemedText, ThemedActivityIndicator, ThemedTextFontFamilyMap, PressableOpacity, ThemedRefreshControl } from '@/app/components/ui';
import { ComicSeriesDetails } from '@/app/components/comics/ComicSeriesDetails';
import { ListDetails } from '@/app/components/list/ListDetails';
import { Header } from '@/app/components/home/Header';
import { BLOG_SCREEN, LIST_SCREEN } from '@/constants/Navigation';

import { getPublicApolloClient } from '@/lib/apollo';
import { ComicSeries, List } from '@inkverse/shared-client/graphql/operations';
import { loadHomeScreen, homefeedQueryReducerDefault, homeScreenInitialState } from '@inkverse/shared-client/dispatch/homefeed';
import { NewsItem, inkverseNewsItems } from '@inkverse/public/news-items';

// Section types for FlashList
type SectionType = 
  | { type: 'header' }
  | { type: 'featured'; data: ComicSeries[] | null | undefined }
  | { type: 'mostRecommended'; data: ComicSeries[] | null | undefined }
  | { type: 'curatedLists'; data: List[] | null | undefined }
  | { type: 'recentlyUpdated'; data: ComicSeries[] | null | undefined }
  | { type: 'recentlyAdded'; data: ComicSeries[] | null | undefined }
  | { type: 'inkverseNews'; data: NewsItem[] | null | undefined }

export function HomeScreen() {
  const [homeScreenState, dispatch] = useReducer(homefeedQueryReducerDefault, homeScreenInitialState);
  const [refreshing, setRefreshing] = useState(false);
  const flashListRef = useRef<FlashList<SectionType>>(null);
  const publicClient = getPublicApolloClient();
  
  useScrollToTop(flashListRef);

  const { isHomeScreenLoading, featuredComicSeries, curatedLists, mostPopularComicSeries, recentlyAddedComicSeries, recentlyUpdatedComicSeries } = homeScreenState;

  useEffect(() => {
    loadHomeScreen({ publicClient }, dispatch);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHomeScreen({ publicClient }, dispatch);
    setRefreshing(false);
  }, []);

  // Create data for FlashList
  const sections = useCallback((): SectionType[] => {
    if (isHomeScreenLoading) {
      return [];
    }
    
    return [
      { type: 'header' },
      { type: 'featured', data: featuredComicSeries },
      { type: 'mostRecommended', data: mostPopularComicSeries },
      { type: 'curatedLists', data: curatedLists },
      { type: 'inkverseNews', data: inkverseNewsItems },
      { type: 'recentlyUpdated', data: recentlyUpdatedComicSeries },
      { type: 'recentlyAdded', data: recentlyAddedComicSeries },
    ];
  }, [
    isHomeScreenLoading, 
    featuredComicSeries, 
    mostPopularComicSeries, 
    curatedLists, 
    recentlyUpdatedComicSeries, 
    recentlyAddedComicSeries,
    inkverseNewsItems
  ]);

  // Render each section type
  const renderItem = useCallback(({ item }: { item: SectionType }) => {
    switch (item.type) {
      case 'header':
        return <Header />;
      case 'featured':
        return <FeaturedWebtoons comicSeries={item.data} />;
      case 'mostRecommended':
        return <MostRecommendedWebtoons comicSeries={item.data} />;
      case 'curatedLists':
        return <CuratedLists lists={item.data} />;
      case 'recentlyUpdated':
        return <RecentlyUpdatedWebtoons comicSeries={item.data} />;
      case 'recentlyAdded':
        return <RecentlyAddedWebtoons comicSeries={item.data} />;
      case 'inkverseNews':
        return <InkverseNews newsItems={item.data} />;
      default:
        return null;
    }
  }, []);

  const keyExtractor = useCallback((item: SectionType, index: number) => `${item.type}-${index}`, []);

  if (isHomeScreenLoading) {
    return (
      <Screen style={styles.container}>
        <View style={styles.loadingContainer}>
          <ThemedActivityIndicator />
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={styles.container}>
      <FlashList
        ref={flashListRef}
        data={sections()}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        estimatedItemSize={300}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <ThemedRefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </Screen>
  );
}

const FeaturedWebtoons = memo(({ comicSeries }: { comicSeries: ComicSeries[] | null | undefined }) => {
  const firstComicSeries = comicSeries?.[0];
  return (
    <View style={styles.section}>
      {firstComicSeries && (
        <ComicSeriesDetails
          comicseries={firstComicSeries}
          pageType='featured-banner'
          imagePriority="high"
        />
      )}
    </View>
  );
});

const MostRecommendedWebtoons = memo(({ comicSeries }: { comicSeries: ComicSeries[] | null | undefined }) => {
  const slicedComicSeries = comicSeries?.slice(0, 3);
  const navigation = useNavigation();
  
  const renderItem: ListRenderItem<ComicSeries> = useCallback(({ item, index }) => (
    <ComicSeriesDetails
      comicseries={item}
      pageType='most-popular'
      imagePriority={index === 0 ? 'normal' : 'low'}
    />
  ), []);

  const keyExtractor = useCallback((item: ComicSeries) => item.uuid, []);

  const handleSeeAllPress = useCallback(() => {
    navigation.navigate(LIST_SCREEN, { id: '1' });
  }, [navigation]);

  return (
    <View style={styles.section}>
      <ThemedText style={styles.sectionTitle}>Most Recommended Comics</ThemedText>
      <FlatList
        data={slicedComicSeries ?? []}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
      />
      <PressableOpacity 
        style={styles.seeAllButton} 
        onPress={handleSeeAllPress}>
        <ThemedText style={styles.seeAllText}>See All</ThemedText>
      </PressableOpacity>
    </View>
  );
});

const CuratedLists = memo(({ lists }: { lists: List[] | null | undefined }) => {
  const renderItem: ListRenderItem<List> = useCallback(({ item, index }) => (
    <ListDetails 
      list={item} 
      pageType='featured-list'
      imagePriority={index === 0 ? 'normal' : 'low'}
    />
  ), []);

  const keyExtractor = (item: List) => item.id;

  return (
    <View style={styles.section}>
      <ThemedText style={styles.sectionTitle}>Picks by Inkverse</ThemedText>
      <FlatList
        data={lists ?? []}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.horizontalScroll}
      />
    </View>
  );
});

const RecentlyUpdatedWebtoons = memo(({ comicSeries }: { comicSeries: ComicSeries[] | null | undefined }) => {
  const renderItem: ListRenderItem<ComicSeries> = useCallback(({ item, index }) => (
    <View style={styles.horizontalComicItem}>
      <ComicSeriesDetails
        comicseries={item}
        pageType='cover'
        imagePriority={index === 0 ? 'normal' : 'low'}
      />
    </View>
  ), []);

  const keyExtractor = useCallback((item: ComicSeries) => item.uuid, []);

  return (
    <View style={styles.section}>
      <ThemedText style={styles.sectionTitle}>Recently Updated</ThemedText>
      <FlatList
        data={comicSeries ?? []}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.horizontalScroll}
      />
    </View>
  );
});

const RecentlyAddedWebtoons = memo(({ comicSeries }: { comicSeries: ComicSeries[] | null | undefined }) => {
  const renderItem: ListRenderItem<ComicSeries> = useCallback(({ item, index }) => (
    <View style={styles.horizontalComicItem}>
      <ComicSeriesDetails
        comicseries={item}
        pageType='cover'
        imagePriority={index === 0 ? 'normal' : 'low'}
      />
    </View>
  ), []);

  const keyExtractor = useCallback((item: ComicSeries) => item.uuid, []);

  return (
    <View style={[styles.section, { marginBottom: 6 }]}>
      <ThemedText style={styles.sectionTitle}>Recently Added</ThemedText>
      <FlatList
        data={comicSeries ?? []}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.horizontalScroll}
      />
    </View>
  );
});

const InkverseNews = memo(({ newsItems }: { newsItems: NewsItem[] | null | undefined }) => {
  const navigation = useNavigation();

  const renderItem: ListRenderItem<NewsItem> = useCallback(({ item }) => (
    <TouchableOpacity 
      style={styles.newsItemContainer}
      onPress={() => navigation.navigate(BLOG_SCREEN, { url: item.url })}
    >
      <ThemedText style={styles.newsTitle}>{item.title}</ThemedText>
    </TouchableOpacity>
  ), [navigation]);

  const keyExtractor = useCallback((item: NewsItem) => item.url, []);

  return (
    <View style={styles.section}>
      <ThemedText style={styles.sectionTitle}>Inkverse News</ThemedText>
      <FlatList
        data={newsItems}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.horizontalScroll}
        contentContainerStyle={styles.newsListContent}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: ThemedTextFontFamilyMap.bold,
    marginBottom: 8,
  },
  horizontalScroll: {
    flexGrow: 0,
  },
  horizontalComicItem: {
    marginRight: 12,
  },
  footer: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  footerLinks: {
    marginBottom: 24,
  },
  footerLink: {
    fontSize: 16,
    marginBottom: 12,
  },
  socialLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  socialButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialIcon: {
    width: 24,
    height: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newsTitle: {
    fontSize: 16,
    fontFamily: ThemedTextFontFamilyMap.bold,
    color: '#403B51',
    lineHeight: 22,
  },
  newsItemContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  newsListContent: {
    paddingRight: 16,
  },
  seeAllButton: {
    alignSelf: 'center',
    marginTop: 4,
  },
  seeAllText: {
    fontSize: 16,
    fontFamily: ThemedTextFontFamilyMap.semiBold,
  },
}); 