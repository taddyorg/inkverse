import React, { useEffect, useReducer, useMemo, useCallback, memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import { useRoute } from '@react-navigation/native';
import { RootStackParamList, CREATOR_SCREEN } from '@/constants/Navigation';
import { getPublicApolloClient } from '@/lib/apollo';

import { CreatorDetails } from '@/app/components/creator/CreatorDetails';
import { CreatorComics } from '@/app/components/creator/CreatorComics';
import { Screen, HeaderBackButton, HeaderShareButton, ThemedActivityIndicator, ThemedRefreshControl, FadeInView, useLayout, useGridPagePaddingX } from '@/app/components/ui';
import { MAX_CONTENT_WIDTH } from '@/constants/Layout';
import { SPACING } from '@/constants/Spacing';

import { creatorReducer, getCreatorScreen, creatorInitialState } from '@inkverse/shared-client/dispatch/creator';
import { ComicSeries, Creator } from '@inkverse/shared-client/graphql/operations';

type CreatorListItem =
  | { type: 'screen-header'; key: string; data: { name: string } }
  | { type: 'details'; key: string; data: Creator }
  | { type: 'comics'; key: string; data: { comicseries: ComicSeries[] | null | undefined } };

// Floating back / share buttons (24 icon + 2 * 8 padding)
const HEADER_BUTTON_SIZE = 40;
const getHeaderButtonsTop = (isWide: boolean) => isWide ? 16 : 40;
// On wider layouts (landscape, iPad), hug the screen edges rather than the content column,
// like the comic screen
const getHeaderButtonsSideOffset = (isWide: boolean, contentInsetX: number) =>
  isWide ? SPACING.xl : contentInsetX + 16;
// Phone portrait: the avatar starts 16pt below the buttons (with the list's 16pt top padding).
// On wider layouts the centered avatar sits between the buttons, so it starts just below their top edge
const getHeaderSpacerHeight = (isWide: boolean) => isWide
  ? getHeaderButtonsTop(isWide) + SPACING.md - 16
  : getHeaderButtonsTop(isWide) + HEADER_BUTTON_SIZE;

export type CreatorScreenParams = {
  uuid: string;
};

export function CreatorScreen() {
  const route = useRoute<NativeStackScreenProps<RootStackParamList, typeof CREATOR_SCREEN>['route']>();
  const { uuid } = route.params;
  const [creatorQuery, creatorDispatch] = useReducer(creatorReducer, creatorInitialState);
  const publicClient = getPublicApolloClient();
  
  const { isLoading, creator, comicseries } = creatorQuery;
  const { isSm } = useLayout(MAX_CONTENT_WIDTH.grid);
  // On wider layouts the buttons hug the screen edges, so pull the content in past them
  const listPaddingX = useGridPagePaddingX();

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
        // Leave room above the avatar for the floating back / share buttons
        return (
          <View style={{ height: getHeaderSpacerHeight(isSm) }} />
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
  }, [isSm]);

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
      <FadeInView>
        <FlashList
          data={listData}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.contentContainer, { paddingHorizontal: listPaddingX }]}
          refreshControl={
            <ThemedRefreshControl
              refreshing={isLoading}
              onRefresh={handleRefresh}
            />
          }
        />
      </FadeInView>
    </CreatorScreenWrapper>
  );
}

type CreatorScreenWrapperProps = {
  children: React.ReactNode;
  creator: Creator | null;
}

const CreatorScreenWrapper = ({ children, creator }: CreatorScreenWrapperProps) => {
  const { contentInsetX, isSm } = useLayout(MAX_CONTENT_WIDTH.grid);
  const top = getHeaderButtonsTop(isSm);
  const sideOffset = getHeaderButtonsSideOffset(isSm, contentInsetX);

  return (
    <Screen>
      <>
        <View>
          <HeaderBackButton style={{ top, left: sideOffset }} />
          <HeaderShareButton type="creator" item={creator} style={{ top, right: sideOffset }} />
        </View>
        {children}
      </>
    </Screen>
  );
};

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