import React, { memo, useCallback, useEffect, useReducer, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useRoute } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';

import { RootStackParamList, LIST_SCREEN } from '@/constants/Navigation';
import { Screen, ThemedText, HeaderShareButton, HeaderBackButton, ScreenHeader, ThemedActivityIndicator, ThemedRefreshControl } from '@/app/components/ui';
import { ListDetails } from '@/app/components/list/ListDetails';

import { publicClient } from '@/lib/apollo';
import { loadList, listQueryReducer, listInitialState } from '@inkverse/shared-client/dispatch/list';
import { List } from '@inkverse/shared-client/graphql/operations';

type ListItem =
  | { type: 'screen-header'; key: string; data?: { name?: string } }
  | { type: 'list-details'; key: string; data: any };

export type ListScreenParams = {
  id: string;
};

export function ListScreen() {
  const route = useRoute<NativeStackScreenProps<RootStackParamList, typeof LIST_SCREEN>['route']>();
  const { id } = route.params;
  
  const [listQuery, listQueryDispatch] = useReducer(listQueryReducer, listInitialState);
  const { isListLoading, list } = listQuery;

  const loadListData = useCallback((forceRefresh = false) => {
    loadList({ publicClient, id, forceRefresh }, listQueryDispatch);
  }, [publicClient, id]);

  useEffect(() => {
    loadListData();
  }, [loadListData]);

  const handleRefresh = useCallback(() => {
    loadListData(true);
  }, [loadListData]);

  const listData = useMemo((): ListItem[] => {
    if (!list) return [];
    return [
      { type: 'screen-header', key: 'screen-header' },
      { type: 'list-details', key: 'list-details', data: list },
    ];
  }, [list]);

  const renderItem = useCallback(({ item }: { item: ListItem }) => {
    switch (item.type) {
      case 'screen-header':
        return <ScreenHeader />;
      case 'list-details':
        return (
          <ListDetails 
            list={item.data} 
            pageType='list-screen'
            imagePriority="high"
          />
        );
      default:
        return null;
    }
  }, []);

  if (isListLoading && !list) {
    return (
      <ListScreenWrapper list={list}>
        <View style={styles.loadingContainer}>
          <ThemedActivityIndicator />
        </View>
      </ListScreenWrapper>
    );
  }

  if (!list) {
    return (
      <ListScreenWrapper list={list}>
        <View style={styles.container}>
          <ThemedText style={styles.errorText}>List not found or an error occurred.</ThemedText>
        </View>
      </ListScreenWrapper>
    );
  }

  return (
    <ListScreenWrapper list={list}>
      <FlashList
        data={listData}
        renderItem={renderItem}
        estimatedItemSize={200}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <ThemedRefreshControl
            refreshing={isListLoading}
            onRefresh={handleRefresh}
          />
        }
      />
    </ListScreenWrapper>
  );
}

type ListScreenWrapperProps = {
  children: React.ReactNode;
  list: List | null;
}

const ListScreenWrapper = memo(({ children, list }: ListScreenWrapperProps) => {
  return (
    <Screen style={styles.container}>
        <View>
          <HeaderBackButton />
          <HeaderShareButton type="list" item={list} />
        </View>
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
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  contentContainer: {
    padding: 16,
  },
});
