import { View, StyleSheet } from 'react-native'
import React, { useReducer, useMemo, useState } from 'react'
import { FlashList } from '@shopify/flash-list';
import { Octicons } from '@expo/vector-icons';

import { Colors } from '@/constants/Colors';
import { ThemedText, ThemedIcon } from '../ui';
import { ComicIssue, ComicSeries } from '@inkverse/shared-client/graphql/operations';
import { ComicIssueDetails } from './ComicIssueDetails';
import { PressableOpacity } from '../ui/PressableOpacity';

export interface ComicIssuesListProps {
  comicissues: ComicIssue[];
  comicseries: ComicSeries;
  currentIssueUuid: string | undefined;
}

export const ComicIssuesList = (props: ComicIssuesListProps) => {
  const { comicissues, comicseries, currentIssueUuid } = props;
  const [isNewestFirst, setIsNewestFirst] = useState(false);

  const [tokenQuery, tokenDispatch] = useReducer((state: any, action: any) => state, {});
  const { isSavingTokens } = tokenQuery;
  const anyIssueHasScope = comicissues.some((comicissue) => comicissue.scopesForExclusiveContent ? comicissue.scopesForExclusiveContent.length > 0 : false);
  const items = new Set<string>(); // TODO: Replace with actual implementation
  const userHasUnlockedEpisodes = items && items.size > 0;

  const listData = useMemo(() => {
    // Use immutable sort rather than mutable reverse
    const sortedData = [...comicissues]
      .sort((a, b) => {
        // Get position values with defaults if null/undefined
        const posA = a.position ?? 0;
        const posB = b.position ?? 0;
        
        // For newest first (default): descending order
        // For oldest first: ascending order
        return isNewestFirst 
          ? posB - posA // Newest first
          : posA - posB; // Oldest first
      });
      
    return sortedData.map((comicissue, index) => ({
      key: comicissue.uuid,
      type: "issue",
      comicissue,
      comicseries,
      position: isNewestFirst 
        ? sortedData.length - 1 - index // Count down for newest first
        : index, // Count up for oldest first
    }));
  }, [comicissues, comicseries, isNewestFirst]);

  const toggleSortOrder = () => {
    setIsNewestFirst(!isNewestFirst);
  };

  const renderItem = ({ item, index }: { item: any, index: number }) => (
    <ComicIssueDetails
      comicissue={item.comicissue}
      comicseries={item.comicseries}
      position={item.position}
      isCurrentIssue={item.comicissue.uuid === currentIssueUuid}
      imagePriority={index <= 4 ? 'normal' : 'low'}
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <ThemedText size="subtitle">{'Episodes'}</ThemedText>
        <PressableOpacity onPress={toggleSortOrder} style={styles.sortButton}>
          <ThemedIcon size='medium'>
            <Octicons 
              name={isNewestFirst ? "sort-asc" : "sort-desc"} 
              size={20}
            />
          </ThemedIcon>
        </PressableOpacity>
      </View>
      <View style={styles.flashListContainer}>
        <FlashList
          data={listData}
          renderItem={renderItem}
          keyExtractor={(item) => item.key}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionHeader: {
    paddingHorizontal: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  sortText: {
    marginLeft: 4,
  },
  flashListContainer: {
    flex: 1,
    width: "100%",
  },
  patreonCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 16,
    marginHorizontal: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: Colors.light.icon,
    borderRadius: 16,
  },
  patreonCardTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  patreonCardTextWrapper: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  textStyle: {
    textAlign: "center",
  },
  textStyleMargin: {
    marginBottom: 8
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 100,
  },
}); 