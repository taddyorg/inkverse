import React, { useEffect, useRef, useState, useCallback } from 'react';
import { StyleSheet, View, TextInput, KeyboardAvoidingView, Platform, ScrollView, useColorScheme } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

import { Screen, ScreenHeader, HeaderBackButton, ThemedText, ThemedTextFontFamilyMap, ThemedActivityIndicator, PressableOpacity, DropdownMenu } from '@/app/components/ui';
import { Colors, useThemeColor } from '@/constants/Colors';
import { RootStackParamList, SIGNUP_SCREEN, MAIN_SCREEN, HOME_TAB, PROFILE_SCREEN } from '@/constants/Navigation';
import { getPublicApolloClient, getUserApolloClient } from '@/lib/apollo';
import { getUserDetails } from '@/lib/auth/user';
import {
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
import { CommentItem } from '@/app/components/comics/CommentItem';
import { useComments } from '@/app/components/providers/CommentsProvider';
import { on, off, EventNames } from '@inkverse/shared-client/pubsub';

export type CommentsScreenParams = {
  issueUuid: string;
  seriesUuid: string;
  commentCount?: number;
  creators?: (Partial<Creator> | null)[];
};

export function CommentsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'CommentsScreen'>>();
  const { issueUuid, seriesUuid, commentCount: initialCommentCount, creators } = route.params;

  const { state, dispatch, commentCountCallbackRef } = useComments();
  const colorScheme = useColorScheme() ?? 'light';
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  const [inputText, setInputText] = useState('');
  const [replyTo, setReplyTo] = useState<{ uuid: string; username: string } | null>(null);

  const [userDetails, setUserDetails] = useState(getUserDetails());
  const isAuthenticated = !!userDetails;

  useEffect(() => {
    const handleUserAuthenticated = () => {
      setUserDetails(getUserDetails());
    };
    const handleUserLoggedOut = () => {
      setUserDetails(null);
    };

    on(EventNames.USER_AUTHENTICATED, handleUserAuthenticated);
    on(EventNames.USER_LOGGED_OUT, handleUserLoggedOut);

    return () => {
      off(EventNames.USER_AUTHENTICATED, handleUserAuthenticated);
      off(EventNames.USER_LOGGED_OUT, handleUserLoggedOut);
    };
  }, []);

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
    newCommentUuids,
    isSubmitting,
  } = state;

  const newCommentUuidsSet = new Set(newCommentUuids);
  const regularComments = comments.filter(c => !newCommentUuidsSet.has(c.uuid));
  const newComments = comments.filter(c => newCommentUuidsSet.has(c.uuid));

  const actionColor = colorScheme === 'light' ? Colors.light.action : Colors.dark.icon;
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  const secondaryTextColor = useThemeColor({ light: '#6a7282', dark: '#9ca3af' }, 'text');
  const inputBorderColor = useThemeColor({ light: 'rgba(64, 59, 81, 0.3)', dark: 'rgba(247, 247, 247, 0.2)' }, 'icon');
  const commentsBgColor = useThemeColor({ light: '#FFFFFF', dark: '#1F293740' }, 'background');
  const inputBgColor = useThemeColor({ light: '#F9FAFB', dark: '#1F2937' }, 'background');
  const placeholderColor = useThemeColor({ light: '#9CA3AF', dark: '#6B7280' }, 'text');

  useEffect(() => {
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

  const handleSortChange = (newSortBy: CommentSortType) => {
    if (newSortBy !== sortBy) {
      dispatch({ type: CommentsActionType.SET_SORT_TYPE, payload: newSortBy });
    }
  };

  const handleLoadMore = () => {
    const publicClient = getPublicApolloClient();
    if (publicClient) {
      loadMoreComments({
        publicClient,
        targetUuid: issueUuid,
        targetType: InkverseType.COMICISSUE,
        page: currentPage + 1,
        limitPerPage: 25,
        sortBy,
      }, dispatch);
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!inputText.trim() || isSubmitting) return;

    if (!isAuthenticated) {
      navigation.navigate(SIGNUP_SCREEN);
      return;
    }

    const userClient = getUserApolloClient();
    if (!userClient) return;

    const result = await addComment({
      userClient,
      issueUuid,
      seriesUuid,
      text: inputText.trim(),
      ...(replyTo ? { replyToCommentUuid: replyTo.uuid } : {}),
    }, dispatch);

    if (result?.commentCount != null) {
      commentCountCallbackRef.current?.(result.commentCount);
    }

    setInputText('');
    setReplyTo(null);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [inputText, isSubmitting, isAuthenticated, issueUuid, seriesUuid, replyTo, navigation]);

  const handleReplyPress = useCallback((comment: Comment) => {
    setReplyTo({ uuid: comment.uuid, username: comment.user?.username || 'Anonymous' });
    inputRef.current?.focus();
  }, []);

  const handleCancelReply = useCallback(() => {
    setReplyTo(null);
  }, []);

  const handleUsernamePress = useCallback((userId: string) => {
    navigation.navigate(MAIN_SCREEN, {
      screen: HOME_TAB,
      params: { screen: PROFILE_SCREEN, params: { userId } },
    } as any);
  }, [navigation]);

  const handleInputPress = () => {
    if (!isAuthenticated) {
      navigation.navigate(SIGNUP_SCREEN);
    }
  };

  const sortOptions: { value: CommentSortType; label: string }[] = [
    { value: 'TOP' as CommentSortType, label: 'Top' },
    { value: 'NEWEST' as CommentSortType, label: 'Newest' },
  ];

  const creatorNames = formatCreatorNames(creators);

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View>
          <HeaderBackButton onPress={() => navigation.goBack()} />
          <View style={{ position: 'absolute', top: 40, right: 16, zIndex: 1 }}>
            <DropdownMenu
              options={sortOptions}
              selected={sortBy}
              onSelect={handleSortChange}
              icon={<MaterialIcons name="sort" size={16} color={Colors.light.text} />}
              hideArrow={true}
            />
          </View>
        </View>
        <ScreenHeader />

        {/* Comments list */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.commentsContainer, { backgroundColor: commentsBgColor }]}>
          {isLoading && comments.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ThemedActivityIndicator />
            </View>
          ) : comments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="chatbubbles-outline" size={32} color={textColor} style={{ opacity: 0.4 }} />
              </View>
              <ThemedText style={styles.emptyTitle}>Got any thoughts on this episode?</ThemedText>
              <ThemedText style={styles.emptySubtitle}>
                Add a comment, it could make {creatorNames}'s day!
              </ThemedText>
            </View>
          ) : (
            <>
              {regularComments.map((comment) => (
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
                  onReplyPress={handleReplyPress}
                  onUsernamePress={handleUsernamePress}
                  onCommentCountChange={commentCountCallbackRef.current}
                />
              ))}

              {/* Load more */}
              {hasMore && (
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

              {/* New comments always at bottom */}
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
                  onReplyPress={handleReplyPress}
                  onUsernamePress={handleUsernamePress}
                  onCommentCountChange={commentCountCallbackRef.current}
                />
              ))}
            </>
          )}
          </View>
        </ScrollView>

        {/* Bottom input bar */}
        <View style={[styles.inputBarContainer]}>
          {/* Reply indicator */}
          {replyTo && (
            <View style={styles.replyIndicator}>
              <ThemedText style={styles.replyIndicatorText}>
                Replying to <ThemedText style={styles.replyUsername}>@{replyTo.username}</ThemedText>
              </ThemedText>
              <PressableOpacity onPress={handleCancelReply} style={styles.cancelReplyButton}>
                <Ionicons name="close" size={18} color={secondaryTextColor} />
              </PressableOpacity>
            </View>
          )}

          <View style={styles.inputRow}>
            {isAuthenticated ? (
              <TextInput
                ref={inputRef}
                value={inputText}
                onChangeText={setInputText}
                placeholder={replyTo ? `Reply to ${replyTo.username}...` : 'Add a comment...'}
                placeholderTextColor={placeholderColor}
                multiline
                maxLength={2000}
                editable={!isSubmitting}
                style={[
                  styles.textInput,
                  {
                    backgroundColor: inputBgColor,
                    borderColor: inputBorderColor,
                    color: textColor,
                  },
                ]}
              />
            ) : (
              <PressableOpacity
                onPress={handleInputPress}
                style={[
                  styles.textInput,
                  styles.signInInput,
                  {
                    backgroundColor: inputBgColor,
                    borderColor: inputBorderColor,
                  },
                ]}
              >
                <ThemedText style={styles.signInText}>Sign in to comment...</ThemedText>
              </PressableOpacity>
            )}

            <PressableOpacity
              onPress={handleSubmit}
              disabled={!inputText.trim() || isSubmitting}
              style={[
                styles.sendButton,
                { backgroundColor: actionColor },
                (!inputText.trim() || isSubmitting) && styles.disabledButton,
              ]}
            >
              <Ionicons name="send" size={18} color="white" />
            </PressableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontFamily: ThemedTextFontFamilyMap.bold,
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  commentsContainer: {
    marginTop: 16,
    borderRadius: 16,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
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
  inputBarContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
  },
  replyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingBottom: 6,
  },
  replyIndicatorText: {
    fontSize: 13,
    opacity: 0.7,
  },
  replyUsername: {
    fontFamily: ThemedTextFontFamilyMap.semiBold,
    fontSize: 13,
  },
  cancelReplyButton: {
    padding: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    maxHeight: 100,
  },
  signInInput: {
    justifyContent: 'center',
    paddingVertical: 12,
  },
  signInText: {
    fontSize: 15,
    opacity: 0.5,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.4,
  },
});
