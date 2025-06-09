import { useReducer, useState, useCallback, useEffect, memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';

import { Screen, HeaderBackButton, HeaderShareButton, ThemedActivityIndicator, ThemedRefreshControl } from '@/app/components/ui';
import { ComicSeriesDetails } from '@/app/components/comics/ComicSeriesDetails';
import { ComicIssuesList, ComicIssuesListProps } from '@/app/components/comics/ComicIssuesList';
import { ComicSeriesInfo } from '@/app/components/comics/ComicSeriesInfo';

import { getPublicApolloClient } from '@/lib/apollo';
import { ComicIssue, ComicSeries } from '@inkverse/shared-client/graphql/operations';
import { loadComicSeries, comicSeriesQueryReducerDefault, comicSeriesInitialState } from '@inkverse/shared-client/dispatch/comicseries';
import { RootStackParamList, COMICSERIES_SCREEN, COMICISSUE_SCREEN } from '@/constants/Navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ReadNextEpisode } from '../components/comics/ReadNextEpisode';

export interface ComicSeriesScreenParams {
  uuid: string;
};

type ListItem = 
  | { type: 'header'; data: ComicSeries }
  | { type: 'info'; data: ComicSeries }
  | { type: 'issues'; data: ComicIssuesListProps }
  | { type: 'next-episode'; data: ComicIssue | null };

export function ComicSeriesScreen() {
  const route = useRoute<NativeStackScreenProps<RootStackParamList, typeof COMICSERIES_SCREEN>['route']>();
  const { uuid } = route.params;
  const navigation = useNavigation();
  const publicClient = getPublicApolloClient();
  
  const [comicSeriesState, dispatch] = useReducer(comicSeriesQueryReducerDefault, comicSeriesInitialState);
  const [refreshing, setRefreshing] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  const { isComicSeriesLoading, comicseries, issues } = comicSeriesState;

  useEffect(() => {
    loadComicSeries({ publicClient, uuid }, dispatch);
  }, [uuid]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadComicSeries({ publicClient, uuid, forceRefresh: true }, dispatch);
    setRefreshing(false);
  }, [uuid]);

  const handleNavigateToIssue = useCallback((issueUuid: string, seriesUuid: string) => {
    navigation.navigate(COMICISSUE_SCREEN, { issueUuid, seriesUuid });
  }, [navigation]);

  const renderItem = useCallback(({ item }: { item: ListItem }) => {
    switch (item.type) {
      case 'header':
        return (
          <ComicSeriesDetails
            comicseries={item.data}
            pageType='comicseries-screen'
            isHeaderVisible={isHeaderVisible}
            onHeaderVisibilityChange={setIsHeaderVisible}
          />
        );
      case 'info':
        return <ComicSeriesInfo comicseries={item.data} />;
      case 'issues':
        return (
          <ComicIssuesList 
            comicissues={item.data.comicissues} 
            comicseries={item.data.comicseries} 
            currentIssueUuid={item.data.comicissues?.[0]?.uuid}
          />
        );
      case 'next-episode':
        if (!item.data) { return null; }
        return (
          <ReadNextEpisode
            comicissue={item.data}
            showEmptyState={false}
            firstTextCTA='READ THE FIRST'
            secondTextCTA='EPISODE'
            handleNavigateToIssue={handleNavigateToIssue}
          />
        );
      default:
        return null;
    }
  }, [comicseries, issues, isHeaderVisible, setIsHeaderVisible]);

  const keyExtractor = useCallback((item: ListItem) => {
    switch (item.type) {
      case 'header':
      case 'info':
      case 'issues':
      case 'next-episode':
        return item.type;
    }
  }, [comicseries, issues]);

  const getListData = useCallback((): ListItem[] => {
    if (!comicseries) return [];
    return [
      { type: 'header', data: comicseries },
      { type: 'issues', data: { comicissues: issues, comicseries, currentIssueUuid: issues[0]?.uuid } },
      { type: 'info', data: comicseries },
      ...(issues.length > 3 ? [{ type: 'next-episode' as const, data: issues[0] }] : []),
    ];
  }, [comicseries, issues]);

  if (isComicSeriesLoading) {
    return (
      <ComicSeriesScreenWrapper isHeaderVisible={isHeaderVisible} comicseries={comicseries}>
        <View style={styles.loadingContainer}>
          <ThemedActivityIndicator />
        </View>
      </ComicSeriesScreenWrapper>
    );
  }

  return (
    <ComicSeriesScreenWrapper isHeaderVisible={isHeaderVisible} comicseries={comicseries}>
      <FlashList
        data={getListData()}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        estimatedItemSize={300}
        onScroll={(event) => {
          const yOffset = event.nativeEvent.contentOffset.y;
          if (yOffset <= 0) {
            setIsHeaderVisible(true);
          }
        }}
        refreshControl={
          <ThemedRefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
          />
        }
      />
    </ComicSeriesScreenWrapper>
  );
}

interface ComicSeriesScreenWrapperProps {
  children: React.ReactNode;
  isHeaderVisible: boolean;
  comicseries: ComicSeries | null;
}

const ComicSeriesScreenWrapper = memo(({ children, isHeaderVisible, comicseries }: ComicSeriesScreenWrapperProps) => {
  return (
    <Screen style={styles.container}>
      {isHeaderVisible && (
        <View>
          <HeaderBackButton />
          <HeaderShareButton type="comicseries" item={comicseries} />
        </View>
      )}
      {children}
    </Screen>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 