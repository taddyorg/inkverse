import { useReducer, useState, useCallback, useEffect, useRef } from 'react';
import { StyleSheet, TouchableOpacity, View, FlatList, ListRenderItem } from 'react-native';
import { useNavigation, useScrollToTop } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlashList, FlashListRef } from '@shopify/flash-list';

import { Screen, ThemedText, ThemedActivityIndicator, ThemedTextFontFamilyMap, PressableOpacity, ThemedRefreshControl, DropdownMenu } from '@/app/components/ui';
import { ComicSeriesDetails } from '@/app/components/comics/ComicSeriesDetails';
import { ListDetails } from '@/app/components/list/ListDetails';
import { Header } from '@/app/components/home/Header';
import { BLOG_SCREEN, TRENDING_SCREEN, RootStackParamList } from '@/constants/Navigation';

import { getPublicApolloClient } from '@/lib/apollo';
import { ComicSeries, List, TrendingMetric, TrendingPeriod } from '@inkverse/shared-client/graphql/operations';
import { loadHomeScreen, homefeedReducer, homeScreenInitialState, loadTrendingComicSeries, trendingMetricOptions, trendingPeriodOptions } from '@inkverse/shared-client/dispatch/homefeed';
import { NewsItem, inkverseNewsItems } from '@inkverse/public/news-items';

// Section types for FlashList
type SectionType =
  | { type: 'header' }
  | { type: 'featured'; data: ComicSeries[] | null | undefined }
  | { type: 'mostTrending' }
  | { type: 'curatedLists'; data: List[] | null | undefined }
  | { type: 'recentlyUpdated'; data: ComicSeries[] | null | undefined }
  | { type: 'recentlyAdded'; data: ComicSeries[] | null | undefined }
  | { type: 'inkverseNews'; data: NewsItem[] | null | undefined }

export function HomeScreen() {
  const [homeScreenState, dispatch] = useReducer(homefeedReducer, homeScreenInitialState);
  const [refreshing, setRefreshing] = useState(false);
  const flashListRef = useRef<FlashListRef<SectionType>>(null);
  const publicClient = getPublicApolloClient();
  
  useScrollToTop(flashListRef);

  const { isHomeScreenLoading, featuredComicSeries, curatedLists, recentlyAddedComicSeries, recentlyUpdatedComicSeries } = homeScreenState;

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
      { type: 'mostTrending' },
      { type: 'curatedLists', data: curatedLists },
      { type: 'inkverseNews', data: inkverseNewsItems },
      { type: 'recentlyUpdated', data: recentlyUpdatedComicSeries },
      { type: 'recentlyAdded', data: recentlyAddedComicSeries },
    ];
  }, [
    isHomeScreenLoading,
    featuredComicSeries,
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
      case 'mostTrending':
        return <MostTrendingComics />;
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
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <ThemedRefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </Screen>
  );
}

const FeaturedWebtoons = ({ comicSeries }: { comicSeries: ComicSeries[] | null | undefined }) => {
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
};

const MostTrendingComics = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [metric, setMetric] = useState<TrendingMetric>(TrendingMetric.LIKED);
  const [period, setPeriod] = useState<TrendingPeriod>(TrendingPeriod.WEEK);
  const [comicSeries, setComicSeries] = useState<ComicSeries[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const publicClient = getPublicApolloClient();

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    loadTrendingComicSeries({ publicClient, metric, period }).then((result) => {
      if (!cancelled) {
        setComicSeries(result);
        setIsLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [metric, period]);

  const renderItem: ListRenderItem<ComicSeries> = useCallback(({ item, index }) => (
    <ComicSeriesDetails
      comicseries={item}
      pageType='most-popular'
      imagePriority={index === 0 ? 'normal' : 'low'}
    />
  ), []);

  const keyExtractor = useCallback((item: ComicSeries) => item.uuid, []);

  return (
    <View style={styles.section}>
      <View style={styles.trendingTitleRow}>
        <ThemedText style={styles.sectionTitle}>Most </ThemedText>
        <DropdownMenu options={trendingMetricOptions} selected={metric} onSelect={setMetric} />
        <ThemedText style={styles.sectionTitle}> Comics </ThemedText>
        <DropdownMenu options={trendingPeriodOptions} selected={period} onSelect={setPeriod} />
      </View>
      {isLoading ? (
        <View style={styles.trendingLoadingContainer}>
          <ThemedActivityIndicator />
        </View>
      ) : (
        <>
          <FlatList
            data={(comicSeries ?? []).slice(0, 3)}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
          />
          <PressableOpacity
            style={styles.seeAllBottom}
            onPress={() => navigation.navigate(TRENDING_SCREEN, { metric })}
          >
            <ThemedText style={styles.seeAllBottomText}>See All</ThemedText>
          </PressableOpacity>
        </>
      )}
    </View>
  );
};

const CuratedLists = ({ lists }: { lists: List[] | null | undefined }) => {
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
};

const RecentlyUpdatedWebtoons = ({ comicSeries }: { comicSeries: ComicSeries[] | null | undefined }) => {
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
};

const RecentlyAddedWebtoons = ({ comicSeries }: { comicSeries: ComicSeries[] | null | undefined }) => {
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
};

const InkverseNews = ({ newsItems }: { newsItems: NewsItem[] | null | undefined }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

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
};

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
  trendingTitleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 14,
  },
  seeAllBottom: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  seeAllBottomText: {
    fontSize: 16,
    fontFamily: ThemedTextFontFamilyMap.semiBold,
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
  trendingLoadingContainer: {
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 