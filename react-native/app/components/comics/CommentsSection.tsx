import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { MaterialIcons, Ionicons, Feather } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';

import { ThemedText, ThemedTextFontFamilyMap, ThemedActivityIndicator, DropdownMenu, PressableOpacity } from '@/app/components/ui';
import { Colors, useThemeColor } from '@/constants/Colors';
import { COMMENTS_SCREEN } from '@/constants/Navigation';
import { getPublicApolloClient, getUserApolloClient } from '@/lib/apollo';
import { getUserDetails } from '@/lib/auth/user';
import {
  loadComments,
  loadUserComments,
  addComment,
  CommentsActionType,
} from '@inkverse/shared-client/dispatch/comments';
import type { Comment } from '@inkverse/shared-client/dispatch/comments';
import type { CommentSortType, Creator } from '@inkverse/shared-client/graphql/operations';
import { InkverseType } from '@inkverse/public/graphql/types';
import { formatCreatorNames } from '@inkverse/public/creator';
import { CommentItem } from './CommentItem';
import { CommentForm } from './CommentForm';
import { useComments } from '../providers/CommentsProvider';

interface CommentsSectionProps {
  issueUuid: string;
  seriesUuid: string;
  isAuthenticated: boolean;
  commentCount?: number;
  creators?: (Partial<Creator> | null)[];
  onCommentCountChange?: (count: number) => void;
  initialComments?: Comment[] | null;
}

export function CommentsSection({
  issueUuid,
  seriesUuid,
  isAuthenticated,
  commentCount,
  creators,
  onCommentCountChange,
  initialComments,
}: CommentsSectionProps) {
  const { state, dispatch } = useComments();
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();

  const {
    isLoading,
    comments,
    repliesMap,
    loadingReplies,
    sortBy,
    likedCommentUuids,
    newCommentUuids,
    isSubmitting,
  } = state;

  const newCommentUuidsSet = new Set(newCommentUuids);
  const regularComments = comments.filter(c => !newCommentUuidsSet.has(c.uuid));
  const newComments = comments.filter(c => newCommentUuidsSet.has(c.uuid));

  const userDetails = getUserDetails();
  const textColor = useThemeColor({}, 'text');
  const secondaryTextColor = useThemeColor({ light: '#6a7282', dark: '#9ca3af' }, 'text');
  const backgroundColor = useThemeColor({ light: '#FFFFFF', dark: '#1F293740' }, 'background');

  // Reset provider on mount (clears stale sort/comments from previous issue)
  useEffect(() => {
    dispatch({ type: CommentsActionType.RESET });
  }, []);

  // Seed shared provider when parent passes initial comments
  useEffect(() => {
    if (initialComments) {
      dispatch({
        type: CommentsActionType.LOAD_COMMENTS_SUCCESS,
        payload: { comments: initialComments, hasMore: initialComments.length >= 25 },
      });
    }
  }, [initialComments]);

  // Skip initial mount (parent seeds comments via loadComicIssueDynamic).
  // Re-fetch only when sortBy changes after mount.
  // isFocused guard prevents fetch when CommentsScreen is on top.
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (!isFocused) return;

    const publicClient = getPublicApolloClient();
    if (publicClient) {
      loadComments({
        publicClient,
        targetUuid: issueUuid,
        targetType: InkverseType.COMICISSUE,
        page: 1,
        limitPerPage: 25,
        sortBy,
        forceRefresh: true,
      }, dispatch);
    }
  }, [issueUuid, sortBy]);

  // Load user's liked comments when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const userClient = getUserApolloClient();
      if (userClient) {
        loadUserComments({
          userClient,
          targetUuid: issueUuid,
          targetType: InkverseType.COMICISSUE,
        }, dispatch);
      }
    }
  }, [isAuthenticated, issueUuid]);

  const handleLoadMore = () => {
    navigation.navigate(COMMENTS_SCREEN, {
      issueUuid,
      seriesUuid,
      commentCount,
      creators,
    });
  };

  const handleSortChange = (newSortBy: CommentSortType) => {
    if (newSortBy !== sortBy) {
      dispatch({ type: CommentsActionType.SET_SORT_TYPE, payload: newSortBy });
    }
  };

  const handleAddComment = async (text: string) => {
    const userClient = getUserApolloClient();
    if (!userClient) return;

    const result = await addComment({
      userClient,
      issueUuid,
      seriesUuid,
      text,
    }, dispatch);

    if (result?.commentCount != null && onCommentCountChange) {
      onCommentCountChange(result.commentCount);
    }

  };

  const sortOptions: { value: CommentSortType; label: string }[] = [
    { value: 'TOP' as CommentSortType, label: 'Top' },
    { value: 'NEWEST' as CommentSortType, label: 'Newest' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>
          Comments
        </ThemedText>
        <DropdownMenu
          options={sortOptions}
          selected={sortBy}
          onSelect={handleSortChange}
          icon={<MaterialIcons name="sort" size={16} color={Colors.light.text} />}
          hideArrow={true}
        />
      </View>

      {/* Content container */}
      <View style={[styles.contentContainer, { backgroundColor }]}>
        {/* Loading state */}
        {isLoading && comments.length === 0 && (
          <View style={styles.loadingContainer}>
            <ThemedActivityIndicator />
          </View>
        )}

        {/* Comments list */}
        {(!isLoading || comments.length > 0) && (
          <>
            {comments.length === 0 ? (
              <EmptyCommentsState creators={creators} />
            ) : (
              <View>
                {regularComments.slice(0, 5).map((comment) => (
                  <CommentItem
                    key={comment.uuid}
                    comment={comment}
                    issueUuid={issueUuid}
                    seriesUuid={seriesUuid}
                    isAuthenticated={isAuthenticated}
                    isLiked={likedCommentUuids.includes(comment.uuid)}
                    currentUserId={userDetails?.id}
                    replies={repliesMap[comment.uuid] || []}
                    isLoadingReplies={loadingReplies[comment.uuid]}
                    likedCommentUuids={likedCommentUuids}
                    dispatch={dispatch}
                    sortBy={sortBy}
                    onCommentCountChange={onCommentCountChange}
                  />
                ))}
                {newComments.map((comment) => (
                  <CommentItem
                    key={comment.uuid}
                    comment={comment}
                    issueUuid={issueUuid}
                    seriesUuid={seriesUuid}
                    isAuthenticated={isAuthenticated}
                    isLiked={likedCommentUuids.includes(comment.uuid)}
                    currentUserId={userDetails?.id}
                    replies={repliesMap[comment.uuid] || []}
                    isLoadingReplies={loadingReplies[comment.uuid]}
                    likedCommentUuids={likedCommentUuids}
                    dispatch={dispatch}
                    sortBy={sortBy}
                    onCommentCountChange={onCommentCountChange}
                  />
                ))}
              </View>
            )}
          </>
        )}

        {/* Load more button */}
        {!isLoading && commentCount != null && commentCount > 5 && (
          <View style={styles.loadMoreContainer}>
            <PressableOpacity onPress={handleLoadMore} style={styles.loadMoreButton}>
              <View style={styles.loadMoreButtonInner}>
                <ThemedText style={styles.loadMoreText} passedInLightColor={secondaryTextColor} passedInDarkColor={secondaryTextColor}>Load more comments</ThemedText>
                {/* On react native, we push a new screen to the comments screen instead of loading more comments in the same screen. */}
                {/* <Ionicons name="chevron-down" size={16} color={secondaryTextColor} /> */ }
              </View>
            </PressableOpacity>
          </View>
        )}

        {/* Add comment form */}
        <View style={styles.addCommentSection}>
          <View style={styles.addCommentHeader}>
            <Feather name="edit" size={18} color={textColor} />
            <ThemedText style={styles.addCommentTitle}>Add a comment</ThemedText>
          </View>
          <CommentForm
            onSubmit={handleAddComment}
            isSubmitting={isSubmitting}
            isAuthenticated={isAuthenticated}
            placeholder="Share your thoughts..."
          />
        </View>
      </View>
    </View>
  );
}

function EmptyCommentsState({ creators }: { creators?: ({ name?: string | null } | null)[] }) {
  const textColor = useThemeColor({}, 'text');
  const creatorNames = formatCreatorNames(creators);

  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="chatbubbles-outline" size={32} color={textColor} style={{ opacity: 0.4 }} />
      </View>
      <ThemedText style={styles.emptyTitle}>Got any thoughts on this episode?</ThemedText>
      <ThemedText style={styles.emptySubtitle}>
        Add a comment, it could make {creatorNames}'s day!
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: ThemedTextFontFamilyMap.bold,
  },
  contentContainer: {
    borderRadius: 16,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: ThemedTextFontFamilyMap.semiBold,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
    marginTop: 4,
  },
  addCommentSection: {
    paddingTop: 16,
  },
  addCommentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginStart: 4,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  addCommentTitle: {
    fontSize: 16,
    fontFamily: ThemedTextFontFamilyMap.bold,
  },
  loadMoreContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  loadMoreButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  loadMoreButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  loadMoreText: {
    fontSize: 14,
    fontFamily: ThemedTextFontFamilyMap.semiBold,
  },
});
