import { useState, useCallback, useEffect, useReducer } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';

import { Screen, ThemedText, ThemedTextFontFamilyMap, PressableOpacity, ScreenHeader, HeaderBackButton, ThemedActivityIndicator, DropdownMenu, ThemedRefreshControl, useLayout, useGridColumns } from '@/app/components/ui';
import { ComicSeriesDetails } from '@/app/components/comics/ComicSeriesDetails';
import { getPublicApolloClient } from '@/lib/apollo';
import { Colors } from '@/constants/Colors';
import { MAX_CONTENT_WIDTH } from '@/constants/Layout';
import { SPACING } from '@/constants/Spacing';
import { ComicSeries, TrendingPeriod } from '@inkverse/shared-client/graphql/operations';
import { loadTrendingComicSeries, trendingReducer, loadMoreTrending, trendingPeriodOptions, TrendingActionType, TRENDING_LIMIT_PER_PAGE, trendingMetricTitles, makeTrendingInitialState } from '@inkverse/shared-client/dispatch/homefeed';

// Floating back button (24 icon + 2 * 8 padding)
const HEADER_BUTTON_SIZE = 40;
const TITLE_MARGIN_TOP = 16;
// On wider layouts (landscape, iPad), the back button hugs the screen edge beside the title,
// like the comic screen, instead of sitting above it
const getBackButtonSideOffset = (isWide: boolean, contentInsetX: number) =>
  isWide ? SPACING.xl : contentInsetX + 16;

export interface TrendingScreenParams {
  metric: 'LIKED' | 'DISCUSSED';
}

function TrendingScreenContent({ metric, period, title, setPeriod }: { metric: string; period: TrendingPeriod; title: string; setPeriod: (period: TrendingPeriod) => void }) {
  const publicClient = getPublicApolloClient();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [state, dispatch] = useReducer(trendingReducer, makeTrendingInitialState({ metric, period }));
  // Centered grid on wider layouts: 2 columns on phone portrait, 4 on phone landscape and
  // iPad portrait, 5 on iPad landscape
  const { contentWidth, contentInsetX, isSm } = useLayout(MAX_CONTENT_WIDTH.grid);
  const numColumns = useGridColumns();
  // On wider layouts the back button hugs the screen edge, so pull the grid and title in past it
  const listPaddingX = isSm
    ? Math.max(16 + contentInsetX, getBackButtonSideOffset(true, contentInsetX) + HEADER_BUTTON_SIZE + SPACING.md)
    : 16 + contentInsetX;
  const itemWidth = (contentWidth - 2 * (listPaddingX - contentInsetX)) / numColumns;

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

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    const result = await loadTrendingComicSeries({
      publicClient,
      metric,
      period,
      page: 1,
      limitPerPage: TRENDING_LIMIT_PER_PAGE,
      forceRefresh: true,
    });
    if (result) {
      dispatch({
        type: TrendingActionType.REFRESH_SUCCESS,
        payload: { comicSeries: result, limitPerPage: TRENDING_LIMIT_PER_PAGE },
      });
    }
    setIsRefreshing(false);
  }, [publicClient, metric, period]);

  const handleLoadMore = useCallback(() => {
    if (isLoading || state.isLoadingMore || !state.hasMore) return;

    loadMoreTrending({
      publicClient,
      state,
    }, dispatch);
  }, [isLoading, state]);

  const renderGridItem = useCallback(({ item }: { item: ComicSeries }) => {
    return (
      <View style={{ width: itemWidth }}>
        <ComicSeriesDetails
          comicseries={item}
          pageType='grid-item-with-tagline'
        />
      </View>
    );
  }, [itemWidth]);

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
      <FlashList
        data={state.comicSeries}
        renderItem={renderGridItem}
        numColumns={numColumns}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, { paddingHorizontal: listPaddingX }]}
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
        refreshControl={
          <ThemedRefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
          />
        }
      />
    </View>
  );
}

export function TrendingScreen() {
  const route = useRoute();
  const { metric } = route.params as TrendingScreenParams;
  const [period, setPeriod] = useState<TrendingPeriod>(TrendingPeriod.WEEK);
  // Phone portrait: the button lines up with the grid, above the title
  const { contentInsetX, isSm } = useLayout(MAX_CONTENT_WIDTH.grid);
  const insets = useSafeAreaInsets();
  // On wider layouts the button sits level with the title (no extra header padding), so nothing moves down
  const backButtonStyle = isSm
    ? { top: insets.top + TITLE_MARGIN_TOP, left: getBackButtonSideOffset(true, contentInsetX) }
    : { left: getBackButtonSideOffset(false, contentInsetX) };

  const title = trendingMetricTitles[metric] || 'Trending Comics';

  return (
    <Screen>
      <View style={styles.headerContainer}>
        <ScreenHeader additionalTopPadding={isSm ? 0 : undefined} />
        <HeaderBackButton style={backButtonStyle} />
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
    marginTop: TITLE_MARGIN_TOP,
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
  },
  dropdownRow: {
    justifyContent: 'flex-start',
    flexDirection: 'row',
    marginBottom: 8,
  },
});
