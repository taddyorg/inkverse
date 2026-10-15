import { View, StyleSheet } from 'react-native'
import React, { useReducer, useMemo, useState } from 'react'
import { FlashList } from '@shopify/flash-list';
import { Octicons } from '@expo/vector-icons';

import { Colors, useThemeColor } from '@/constants/Colors';
import { SPACING } from '@/constants/Spacing';
import { ThemedText, ThemedIcon, ThemedButton } from '../ui';
import { ComicIssue, ComicSeries } from '@inkverse/shared-client/graphql/operations';
import { ComicIssueDetails } from './ComicIssueDetails';
import { PressableOpacity } from '../ui/PressableOpacity';

export interface ComicIssuesListProps {
  comicissues: ComicIssue[];
  comicseries: ComicSeries;
  currentIssueUuid: string | undefined;
  likedIssueUuids?: string[];
  issueLikeLoadingMap?: Record<string, boolean>;
  onLikeIssue?: (issueUuid: string) => void;
  initialVisibleCount?: number;
}

export const ComicIssuesList = (props: ComicIssuesListProps) => {
  const { comicissues, comicseries, currentIssueUuid, likedIssueUuids, issueLikeLoadingMap, onLikeIssue, initialVisibleCount } = props;
  const [isNewestFirst, setIsNewestFirst] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const textColor = useThemeColor({}, 'text');

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

    return sortedData.map((comicissue, index) => {
      return {
        key: comicissue.uuid,
        type: "issue",
        comicissue,
        comicseries,
        position: isNewestFirst
          ? sortedData.length - 1 - index // Count down for newest first
          : index, // Count up for oldest first
        isLiked: likedIssueUuids?.includes(comicissue.uuid) || false,
        isLikeLoading: issueLikeLoadingMap?.[comicissue.uuid] || false,
      };
    });
  }, [comicissues, comicseries, isNewestFirst, likedIssueUuids, issueLikeLoadingMap]);

  // Collapse to the first few episodes (in the current sort order) until expanded
  const isCollapsible = !!initialVisibleCount && listData.length > initialVisibleCount;
  const visibleData = isCollapsible && !isExpanded ? listData.slice(0, initialVisibleCount) : listData;

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
      isLiked={item.isLiked}
      isLikeLoading={item.isLikeLoading}
      onLikePress={onLikeIssue ? () => onLikeIssue(item.comicissue.uuid) : undefined}
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
          data={visibleData}
          renderItem={renderItem}
          keyExtractor={(item) => item.key}
          maintainVisibleContentPosition={{
            autoscrollToTopThreshold: 100,
            autoscrollToBottomThreshold: 100,
            animateAutoScrollToBottom: false,
            startRenderingFromBottom: false,
          }}
        />
      </View>
      {isCollapsible && (
        <ThemedButton
          buttonText={isExpanded ? 'Show less episodes' : 'See all episodes'}
          style={[styles.seeAllButton, { borderColor: textColor }]}
          buttonTextProps={[styles.seeAllText, { color: textColor }]}
          onPress={() => setIsExpanded(!isExpanded)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionHeader: {
    paddingHorizontal: SPACING.md,
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
  seeAllButton: {
    alignSelf: 'center',
    height: 40,
    paddingVertical: 0,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  seeAllText: {
    fontSize: 16,
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