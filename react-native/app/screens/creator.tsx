import React, { useEffect, useReducer, useMemo, useCallback, memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import { useRoute } from '@react-navigation/native';
import { RootStackParamList, CREATOR_SCREEN } from '@/constants/Navigation';
import { getPublicApolloClient } from '@/lib/apollo';

import { CreatorDetails } from '@/app/components/creator/CreatorDetails';
import { CreatorComics } from '@/app/components/creator/CreatorComics';
import { Screen, HeaderBackButton, HeaderShareButton, ThemedActivityIndicator, ThemedRefreshControl, ScreenHeader } from '@/app/components/ui';

import { creatorReducer, getCreatorScreen, creatorInitialState } from '@inkverse/shared-client/dispatch/creator';
import { ComicSeries, Creator } from '@inkverse/shared-client/graphql/operations';

type CreatorListItem =
  | { type: 'screen-header'; key: string; data: { name: string } }
  | { type: 'details'; key: string; data: Creator }
  | { type: 'comics'; key: string; data: { comicseries: ComicSeries[] | null | undefined } };

export type CreatorScreenParams = {
  uuid: string;
};

export function CreatorScreen() {
  const route = useRoute<NativeStackScreenProps<RootStackParamList, typeof CREATOR_SCREEN>['route']>();
  const { uuid } = route.params;
  const [creatorQuery, creatorDispatch] = useReducer(creatorReducer, creatorInitialState);
  const publicClient = getPublicApolloClient();
  
  const { isLoading, creator, comicseries } = creatorQuery;

  useEffect(() => {
    getCreatorScreen({ publicClient, uuid }, creatorDispatch);
  }, [uuid]);

  const handleRefresh = () => {
    getCreatorScreen({ publicClient, uuid }, creatorDispatch);
  };

  const listData = useMemo((): CreatorListItem[] => {
    if (!creator) return [];
    return [
      { type: 'screen-header', key: 'screen-header', data: { name: creator.name || '' } },
      { type: 'details', key: 'creator-details', data: creator },
      { type: 'comics', key: 'creator-comics', data: { comicseries: comicseries?.filter((series) => series !== null) || [] } },
    ];
  }, [creator, comicseries]);

  const renderItem = useCallback(({ item }: { item: CreatorListItem }) => {
    switch (item.type) {
      case 'screen-header':
        return (
            <ScreenHeader />
        );
      case 'details':
        return (
          <CreatorDetails 
            creator={item.data}
            pageType='creator-screen'
          />
        );
      case 'comics':
        return (
          <CreatorComics 
            comicseries={item.data.comicseries}
          />
        );
      default:
        return null;
    }
  }, []);

  if (isLoading || !creator) {
    return (
      <CreatorScreenWrapper creator={creator}>
        <View style={styles.loadingContainer}>
          <ThemedActivityIndicator />
        </View>
      </CreatorScreenWrapper>
    );
  }

  return (
    <CreatorScreenWrapper creator={creator}>
      <FlashList
        data={listData}
        renderItem={renderItem}
        estimatedItemSize={300}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <ThemedRefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
          />
        }
      />
    </CreatorScreenWrapper>
  );
}

type CreatorScreenWrapperProps = {
  children: React.ReactNode;
  creator: Creator | null;
}

const CreatorScreenWrapper = memo(({ children, creator }: CreatorScreenWrapperProps) => {
  return (
    <Screen>
      <View>
        <HeaderBackButton />
        <HeaderShareButton type="creator" item={creator} />
      </View>
      {children}
    </Screen>
  );
});

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    padding: 16,
  },
});