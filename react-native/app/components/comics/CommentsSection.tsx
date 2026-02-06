import React, { useReducer, useEffect, useRef } from 'react';
import { StyleSheet, View, useColorScheme } from 'react-native';
import { MaterialIcons, Ionicons, Feather } from '@expo/vector-icons';

import { ThemedText, ThemedTextFontFamilyMap, ThemedActivityIndicator, PressableOpacity, DropdownMenu } from '@/app/components/ui';
import { Colors, useThemeColor } from '@/constants/Colors';
import { getPublicApolloClient, getUserApolloClient } from '@/lib/apollo';
import { getUserDetails } from '@/lib/auth/user';
import {
  commentsReducer,
  commentsInitialState,
  loadComments,
  loadMoreComments,
  loadUserComments,
  addComment,
  CommentsActionType,
  type Comment,
} from '@inkverse/shared-client/dispatch/comments';
import type { CommentSortType, Creator } from '@inkverse/shared-client/graphql/operations';
import { InkverseType } from '@inkverse/public/graphql/types';
import { formatCreatorNames } from '@inkverse/public/creator';
import { CommentItem } from './CommentItem';
import { CommentForm } from './CommentForm';

interface CommentsSectionProps {
  issueUuid: string;
  seriesUuid: string;
  isAuthenticated: boolean;
  commentCount?: number;
  initialComments?: Comment[];
  creators?: (Partial<Creator> | null)[];
}

export function CommentsSection({
  issueUuid,
  seriesUuid,
  isAuthenticated,
  commentCount,
  initialComments,
  creators,
}: CommentsSectionProps) {
  const [state, dispatch] = useReducer(commentsReducer, commentsInitialState);
  const colorScheme = useColorScheme() ?? 'light';

  const {
    isLoading,
    isLoadingMore,
    comments,
    repliesMap,
    loadingReplies,
    hasMore,
    currentPage,
    sortBy,
    likedCommentUuids,
    isSubmitting,
  } = state;

  const userDetails = getUserDetails();
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({ light: '#FFFFFF', dark: '#1F293740' }, 'background');
  const secondaryTextColor = useThemeColor({ light: '#6a7282', dark: '#9ca3af' }, 'text');
  // Track whether we've used initialComments to skip the first load
  const usedInitialComments = useRef(false);

  // Load comments on mount
  useEffect(() => {
    // If initialComments are provided and this is the initial load, use them
    if (initialComments && initialComments.length > 0 && !usedInitialComments.current) {
      usedInitialComments.current = true;
      dispatch({
        type: CommentsActionType.LOAD_COMMENTS_SUCCESS,
        payload: {
          comments: initialComments,
          hasMore: initialComments.length >= 5,
        },
      });
      return;
    }

    const publicClient = getPublicApolloClient();
    if (publicClient) {
      loadComments({
        publicClient,
        targetUuid: issueUuid,
        targetType: InkverseType.COMICISSUE,
        page: 1,
        limitPerPage: 5,
        sortBy,
      }, dispatch);
    }
  }, [issueUuid, sortBy, initialComments]);

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

  const handleSortChange = (newSortBy: CommentSortType) => {
    if (newSortBy !== sortBy) {
      dispatch({ type: CommentsActionType.SET_SORT_TYPE, payload: newSortBy });
      const publicClient = getPublicApolloClient();
      if (publicClient) {
        loadComments({
          publicClient,
          targetUuid: issueUuid,
          targetType: InkverseType.COMICISSUE,
          page: 1,
          limitPerPage: 5,
          sortBy: newSortBy,
        }, dispatch);
      }
    }
  };

  const handleLoadMore = () => {
    const publicClient = getPublicApolloClient();
    if (publicClient) {
      const isFirstExpansion = currentPage === 1;

      loadMoreComments({
        publicClient,
        targetUuid: issueUuid,
        targetType: InkverseType.COMICISSUE,
        page: isFirstExpansion ? 1 : currentPage + 1,
        limitPerPage: 25,
        sortBy,
      }, dispatch);
    }
  };

  const handleAddComment = async (text: string) => {
    const userClient = getUserApolloClient();
    if (!userClient) return;

    await addComment({
      userClient,
      issueUuid,
      seriesUuid,
      text,
    }, dispatch);
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
          Comments{commentCount ? ` (${commentCount.toLocaleString()})` : ''}
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
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ThemedActivityIndicator />
          </View>
        )}

        {/* Comments list */}
        {!isLoading && (
          <>
            {comments.length === 0 ? (
              <EmptyCommentsState creators={creators} />
            ) : (
              <View>
                {comments.map((comment) => (
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
                  />
                ))}
              </View>
            )}
          </>
        )}

        {/* Load more button */}
        {!isLoading && hasMore && (
          <View style={styles.loadMoreContainer}>
            <PressableOpacity
              onPress={handleLoadMore}
              disabled={isLoadingMore}
              style={styles.loadMoreButton}
            >
              {isLoadingMore ? (
                <ThemedText style={styles.loadMoreText}>Loading...</ThemedText>
              ) : (
                <View style={styles.loadMoreButtonInner}>
                  <ThemedText style={styles.loadMoreText} passedInLightColor={secondaryTextColor} passedInDarkColor={secondaryTextColor}>Load more comments</ThemedText>
                  <Ionicons name="chevron-down" size={16} color={secondaryTextColor} />
                </View>
              )}
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
  loadMoreContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  loadMoreButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  loadMoreText: {
    fontSize: 14,
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

});
