import { useState, useCallback, useEffect, useReducer } from 'react';
import { View, StyleSheet, Dimensions, FlatList } from 'react-native';
import { useRoute } from '@react-navigation/native';

import { Screen, ThemedText, ThemedTextFontFamilyMap, PressableOpacity, ScreenHeader, HeaderBackButton, ThemedActivityIndicator, DropdownMenu } from '@/app/components/ui';
import { ComicSeriesDetails } from '@/app/components/comics/ComicSeriesDetails';
import { getPublicApolloClient } from '@/lib/apollo';
import { Colors } from '@/constants/Colors';
import { ComicSeries, TrendingPeriod } from '@inkverse/shared-client/graphql/operations';
import { loadTrendingComicSeries, trendingReducer, loadMoreTrending, trendingPeriodOptions, TrendingActionType, TRENDING_LIMIT_PER_PAGE, trendingMetricTitles, makeTrendingInitialState } from '@inkverse/shared-client/dispatch/homefeed';

export interface TrendingScreenParams {
  metric: 'LIKED' | 'DISCUSSED';
}

function TrendingScreenContent({ metric, period, title, setPeriod }: { metric: string; period: TrendingPeriod; title: string; setPeriod: (period: TrendingPeriod) => void }) {
  const publicClient = getPublicApolloClient();
  const [isLoading, setIsLoading] = useState(true);
  const [state, dispatch] = useReducer(trendingReducer, makeTrendingInitialState({ metric, period }));

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    loadTrendingComicSeries({ publicClient, metric, period, page: 1, limitPerPage: TRENDING_LIMIT_PER_PAGE }).then((result) => {
      if (!cancelled) {
        if (result && result.length > 0) {
          dispatch({
            type: TrendingActionType.LOAD_MORE_SUCCESS,
            payload: { comicSeries: result, limitPerPage: TRENDING_LIMIT_PER_PAGE },
          });
        }
        setIsLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, []);

  const handleLoadMore = useCallback(() => {
    if (isLoading || state.isLoadingMore || !state.hasMore) return;

    loadMoreTrending({
      publicClient,
      state,
    }, dispatch);
  }, [isLoading, state]);

  const renderGridItem = useCallback(({ item }: { item: ComicSeries }) => {
    const numColumns = 3;
    const screenWidth = Dimensions.get('window').width;
    const availableWidth = screenWidth - 32;
    const itemWidth = (availableWidth - (numColumns - 1)) / numColumns;

    return (
      <View style={{ width: itemWidth }}>
        <ComicSeriesDetails
          comicseries={item}
          pageType='grid-item'
        />
      </View>
    );
  }, []);

  const renderHeader = useCallback(() => {
    return (
      <View style={styles.listHeader}>
        <ThemedText size='title' style={styles.title}>
          {title}
        </ThemedText>
        <View style={styles.dropdownRow}>
          <DropdownMenu options={trendingPeriodOptions} selected={period} onSelect={setPeriod} />
        </View>
      </View>
    );
  }, [title, period, setPeriod]);

  const renderFooter = useCallback(() => {
    if (state.isLoadingMore) {
      return (
        <View style={styles.footerContainer}>
          <ThemedActivityIndicator />
        </View>
      );
    }

    if (!isLoading && state.comicSeries.length > 0 && state.hasMore) {
      return (
        <View style={styles.footerContainer}>
          <PressableOpacity
            onPress={handleLoadMore}
            style={styles.loadMoreButton}
          >
            <ThemedText style={styles.loadMoreText}>
              Load More
            </ThemedText>
          </PressableOpacity>
        </View>
      );
    }

    return null;
  }, [state.isLoadingMore, isLoading, state.comicSeries.length, state.hasMore, handleLoadMore]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ThemedActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={state.comicSeries}
        renderItem={renderGridItem}
        numColumns={3}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ThemedText style={styles.emptyText}>
              No comics found for this period.
            </ThemedText>
          </View>
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        keyExtractor={(item) => item.uuid}
      />
    </View>
  );
}

export function TrendingScreen() {
  const route = useRoute();
  const { metric } = route.params as TrendingScreenParams;
  const [period, setPeriod] = useState<TrendingPeriod>(TrendingPeriod.WEEK);

  const title = trendingMetricTitles[metric] || 'Trending Comics';

  return (
    <Screen>
      <View style={styles.headerContainer}>
        <ScreenHeader />
        <HeaderBackButton />
      </View>
      <TrendingScreenContent key={`${metric}-${period}`} metric={metric} period={period} title={title} setPeriod={setPeriod} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 16,
  },
  listHeader: {
    marginBottom: 8,
  },
  title: {
    marginTop: 16,
    marginBottom: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    textAlign: 'center',
  },
  footerContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadMoreButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: Colors.light.tint + '20',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.tint + '40',
  },
  loadMoreText: {
    fontSize: 16,
    fontWeight: '600',
  },
  dropdownRow: {
    justifyContent: 'flex-start',
    flexDirection: 'row',
    marginBottom: 8,
  },
});
