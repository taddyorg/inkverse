import React, { useState, useMemo, useCallback, type Dispatch } from 'react';
import { StyleSheet, View, Modal, Pressable, Alert, useColorScheme, useWindowDimensions, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import sanitizeHtml from 'sanitize-html';
import RenderHtml, { type CustomTextualRenderer, type MixedStyleDeclaration } from 'react-native-render-html';

import { ThemedText, PressableOpacity, ThemedActivityIndicator } from '@/app/components/ui';
import { Colors, useThemeColor } from '@/constants/Colors';
import { RootStackParamList, PROFILE_SCREEN, REPORTS_SCREEN, SIGNUP_SCREEN } from '@/constants/Navigation';
import { getPublicApolloClient, getUserApolloClient } from '@/lib/apollo';
import {
  loadReplies,
  addComment,
  editComment,
  deleteComment,
  likeComment,
  unlikeComment,
  type CommentsAction,
  type Comment,
} from '@inkverse/shared-client/dispatch/comments';
import { InkverseType } from '@inkverse/public/graphql/types';
import { CommentForm } from './CommentForm';

function SpoilerText({ data }: { data: string }) {
  const [revealed, setRevealed] = useState(false);
  const colorScheme = useColorScheme() ?? 'light';

  const hiddenBg = colorScheme === 'light' ? 'rgba(0,0,0,0.2)' : 'rgba(156,163,175,0.4)';
  const revealedBg = colorScheme === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(156,163,175,0.2)';

  return (
    <Text
      onPress={() => setRevealed((v) => !v)}
      style={{
        backgroundColor: revealed ? revealedBg : hiddenBg,
        color: revealed ? undefined : 'transparent',
        borderRadius: 4,
        paddingHorizontal: 2,
      }}
    >
      {data}
    </Text>
  );
}

function processCommentHtml(text: string | undefined | null): { html: string; isHtml: boolean } {
  if (!text) return { html: '', isHtml: false };

  // Process spoiler tags: ||text|| → <span class="spoiler">text</span>
  const processed = text.replace(/\|\|(.+?)\|\|/g, '<span class="spoiler">$1</span>');
  const hasSpoilers = processed !== text;

  // Check if the original text contains HTML tags
  const hasHtmlTags = /<[a-z][\s\S]*>/i.test(text);

  if (!hasHtmlTags && !hasSpoilers) {
    return { html: text, isHtml: false };
  }

  const sanitized = sanitizeHtml(processed, {
    allowedTags: ['b', 'i', 'strong', 'em', 'br', 'span', 'img'],
    allowedAttributes: { span: ['class'], img: ['src', 'alt', 'width', 'height'] },
    allowedSchemesByTag: { img: ['https'] },
  });

  return { html: sanitized, isHtml: true };
}

interface CommentItemProps {
  comment: Comment;
  issueUuid: string;
  seriesUuid: string;
  isAuthenticated: boolean;
  isLiked: boolean;
  currentUserId?: string;
  replies?: Comment[];
  isLoadingReplies?: boolean;
  likedCommentUuids?: string[];
  dispatch: Dispatch<CommentsAction>;
  isReply?: boolean;
  sortBy?: string;
  onReplyPress?: (comment: Comment) => void;
  onUsernamePress?: (userId: string) => void;
  onCommentCountChange?: (count: number) => void;
}

export function CommentItem({
  comment,
  issueUuid,
  seriesUuid,
  isAuthenticated,
  isLiked,
  currentUserId,
  replies = [],
  isLoadingReplies = false,
  likedCommentUuids = [],
  dispatch,
  isReply = false,
  sortBy,
  onReplyPress,
  onUsernamePress,
  onCommentCountChange,
}: CommentItemProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const colorScheme = useColorScheme() ?? 'light';
  const { width } = useWindowDimensions();

  const [showEditForm, setShowEditForm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showRepliesSection, setShowRepliesSection] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const actionColor = colorScheme === 'light' ? Colors.light.action : 'white'
  const textColor = useThemeColor({}, 'text');
  const secondaryTextColor = useThemeColor({ light: '#6a7282', dark: '#9ca3af' }, 'text');
  const highlightedTextColor = useThemeColor({}, 'tint');
  const backgroundColor = useThemeColor({ light: '#FFFFFF', dark: '#1F293740' }, 'background');
  const menuBackdropColor = 'rgba(0, 0, 0, 0.3)';
  const menuBackgroundColor = useThemeColor({ light: '#FFFFFF', dark: '#403B51' }, 'background');

  const isOwner = currentUserId && comment.user?.id === currentUserId;
  const replyCount = comment.stats?.replyCount || 0;
  const likeCount = comment.stats?.likeCount || 0;

  // Format relative time
  const timeAgo = comment.createdAt
    ? formatDistanceToNow(new Date(comment.createdAt * 1000), { addSuffix: true })
    : '';

  // Process comment HTML and spoiler tags
  const { html: processedHtml, isHtml } = useMemo(
    () => processCommentHtml(comment.text),
    [comment.text]
  );

  const handleUsernamePress = useCallback(() => {
    if (comment.user?.id) {
      if (onUsernamePress) {
        onUsernamePress(comment.user.id);
      } else {
        navigation.navigate(PROFILE_SCREEN, { userId: comment.user.id });
      }
    }
  }, [comment.user?.id, onUsernamePress, navigation]);

  const renderers = useMemo(
    () => ({
      span: (({ tnode, style, TDefaultRenderer, ...rest }) => {
        const classes = tnode.attributes?.class ?? '';
        if (classes.includes('spoiler') && 'data' in tnode) {
          return <SpoilerText data={tnode.data} />;
        }
        if (classes.includes('username') && 'data' in tnode) {
          return (
            <Text style={style} onPress={handleUsernamePress}>
              {tnode.data}
            </Text>
          );
        }
        return <TDefaultRenderer tnode={tnode} style={style} {...rest} />;
      }) as CustomTextualRenderer,
    }),
    [handleUsernamePress]
  );

  const handleLike = async () => {
    if (!isAuthenticated) {
      navigation.navigate(SIGNUP_SCREEN);
      return;
    }

    const userClient = getUserApolloClient();
    if (!userClient) return;

    if (isLiked) {
      await unlikeComment({
        userClient,
        commentUuid: comment.uuid,
        issueUuid,
      }, dispatch);
    } else {
      await likeComment({
        userClient,
        commentUuid: comment.uuid,
        issueUuid,
      }, dispatch);
    }
  };

  const handleReply = async (text: string) => {
    if (!isAuthenticated) {
      navigation.navigate(SIGNUP_SCREEN);
      return;
    }

    const userClient = getUserApolloClient();
    if (!userClient) return;

    setIsSubmitting(true);
    const result = await addComment({
      userClient,
      issueUuid,
      seriesUuid,
      text,
      replyToCommentUuid: comment.uuid,
    }, dispatch);
    setIsSubmitting(false);

    if (result?.commentCount != null && onCommentCountChange) {
      onCommentCountChange(result.commentCount);
    }
  };

  const handleEdit = async (text: string) => {
    const userClient = getUserApolloClient();
    if (!userClient) return;

    setIsSubmitting(true);
    await editComment({
      userClient,
      commentUuid: comment.uuid,
      text,
      targetUuid: issueUuid,
      targetType: InkverseType.COMICISSUE,
    }, dispatch);
    setIsSubmitting(false);
    setShowEditForm(false);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const userClient = getUserApolloClient();
            if (!userClient) return;

            const result = await deleteComment({
              userClient,
              commentUuid: comment.uuid,
              replyToUuid: comment.replyToUuid,
              targetUuid: issueUuid,
              targetType: InkverseType.COMICISSUE,
              seriesUuid,
            }, dispatch);

            if (result.commentCount != null && onCommentCountChange) {
              onCommentCountChange(result.commentCount);
            }
          },
        },
      ]
    );
  };

  const handleReport = () => {
    setShowMenu(false);
    if (!isAuthenticated) {
      navigation.navigate(SIGNUP_SCREEN);
      return;
    }
    navigation.navigate(REPORTS_SCREEN, { type: 'comment', commentUuid: comment.uuid });
  };

  const handleToggleRepliesSection = () => {
    const shouldLoadReplies = !showRepliesSection && replyCount > 0 && replies.length === 0;

    if (shouldLoadReplies) {
      const publicClient = getPublicApolloClient();
      if (publicClient) {
        loadReplies({
          publicClient,
          targetUuid: issueUuid,
          targetType: InkverseType.COMICISSUE,
          commentUuid: comment.uuid,
        }, dispatch);
      }
    }

    if (onReplyPress) {
      if (replyCount > 0) setShowRepliesSection(!showRepliesSection);
      onReplyPress(comment);
      return;
    }

    setShowRepliesSection(!showRepliesSection);
  };

  return (
    <View style={[styles.container, isReply && styles.replyContainer]}>
      {showEditForm ? (
        <CommentForm
          isEdit
          onSubmit={handleEdit}
          isSubmitting={isSubmitting}
          isAuthenticated={isAuthenticated}
          placeholder="Edit your comment..."
          initialText={comment.text}
          onCancel={() => setShowEditForm(false)}
        />
      ) : (
        <>
          {/* Comment text */}
          <View style={styles.commentContent}>
            {isHtml ? (
              <RenderHtml
                contentWidth={width - 32}
                source={{ html:
                  processedHtml +
                  '<span class="separator"> — </span>' +
                  (comment.user?.username
                    ? `<span class="username">${comment.user.username}</span>`
                    : '') +
                  (sortBy === 'NEWEST' && timeAgo
                    ? `<span class="separator"> · </span><span class="timeago">${timeAgo}</span>`
                    : '')
                }}
                baseStyle={{ color: textColor, fontSize: 15, lineHeight: 22, fontFamily: 'SourceSans3-Regular' } as MixedStyleDeclaration}
                classesStyles={{
                  separator: { opacity: 0.4 },
                  username: { opacity: 0.5, fontSize: 14 },
                  timeago: { fontSize: 12, opacity: 0.4 },
                }}
                renderers={renderers}
                enableCSSInlineProcessing={false}
              />
            ) : (
              <ThemedText style={styles.commentText}>
                {comment.text}
                <ThemedText style={styles.separator}> — </ThemedText>
                {comment.user?.username && (
                  <ThemedText style={styles.username} onPress={handleUsernamePress}>
                    {comment.user.username}
                  </ThemedText>
                )}
                {sortBy === 'NEWEST' && timeAgo && (
                  <>
                    <ThemedText style={styles.separator}> · </ThemedText>
                    <ThemedText style={styles.timeAgo}>{timeAgo}</ThemedText>
                  </>
                )}
              </ThemedText>
            )}
          </View>

          {/* Actions row */}
          <View style={styles.actionsRow}>
            {/* Like button */}
            <PressableOpacity onPress={handleLike} style={styles.actionButton} innerStyle={styles.actionButtonInner}>
              <Ionicons
                style={!isReply ? { marginLeft: -3 } : undefined}
                name={isLiked ? 'heart' : 'heart-outline'}
                size={18}
                color={isLiked ? actionColor : textColor}
              />
              {likeCount > 0 && (
                <ThemedText style={[styles.actionText, isLiked && { color: actionColor }]}>
                  {likeCount}
                </ThemedText>
              )}
            </PressableOpacity>

            {/* Reply button (only for top-level comments) */}
            {!isReply && (
              <PressableOpacity
                onPress={handleToggleRepliesSection}
                style={[
                  styles.actionButton,
                  showRepliesSection && { backgroundColor: highlightedTextColor + '15' },
                ]}
                innerStyle={styles.actionButtonInner}
              >
                <MaterialIcons
                  name="reply"
                  size={16}
                  color={showRepliesSection ? actionColor : secondaryTextColor}
                />
                <ThemedText
                  style={[
                    styles.actionText,
                    showRepliesSection && { color: actionColor },
                  ]}
                  passedInLightColor={showRepliesSection ? actionColor : secondaryTextColor}
                  passedInDarkColor={showRepliesSection ? actionColor : secondaryTextColor}
                >
                  {replyCount > 0 ? `Replies (${replyCount})` : 'Reply'}
                </ThemedText>
              </PressableOpacity>
            )}

            {/* More menu */}
            <PressableOpacity onPress={() => setShowMenu(true)} style={styles.moreButton}>
              <Ionicons name="ellipsis-vertical" size={14} color={secondaryTextColor} />
            </PressableOpacity>
          </View>

          {/* Replies section */}
          {showRepliesSection && !isReply && (
            <View style={styles.repliesSection}>
              {isLoadingReplies ? (
                <View style={styles.loadingReplies}>
                  <ThemedActivityIndicator />
                </View>
              ) : (
                <>
                  {replies.map((reply) => (
                    <CommentItem
                      key={reply.uuid}
                      comment={reply}
                      issueUuid={issueUuid}
                      seriesUuid={seriesUuid}
                      isAuthenticated={isAuthenticated}
                      isLiked={likedCommentUuids.includes(reply.uuid)}
                      currentUserId={currentUserId}
                      likedCommentUuids={likedCommentUuids}
                      dispatch={dispatch}
                      isReply
                      sortBy={sortBy}
                      onUsernamePress={onUsernamePress}
                      onCommentCountChange={onCommentCountChange}
                    />
                  ))}

                  {/* Reply form (only when not using bottom input bar) */}
                  {!onReplyPress && (
                    <CommentForm
                      isReply
                      onSubmit={handleReply}
                      isSubmitting={isSubmitting}
                      isAuthenticated={isAuthenticated}
                      placeholder={`Reply to ${comment.user?.username || 'Anonymous'}...`}
                      onCancel={() => setShowRepliesSection(false)}
                    />
                  )}
                </>
              )}
            </View>
          )}
        </>
      )}

      {/* More menu modal */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <Pressable style={[styles.menuBackdrop, { backgroundColor: menuBackdropColor }]} onPress={() => setShowMenu(false)}>
          <View style={[styles.menuContainer, { backgroundColor: menuBackgroundColor }]}>
            {isOwner ? (
              <>
                <PressableOpacity
                  style={styles.menuItem}
                  innerStyle={styles.menuItemInner}
                  onPress={() => {
                    setShowMenu(false);
                    setShowEditForm(true);
                  }}
                >
                  <Ionicons name="pencil" size={20} color={textColor} />
                  <ThemedText style={styles.menuItemText}>Edit</ThemedText>
                </PressableOpacity>
                <PressableOpacity
                  style={styles.menuItem}
                  innerStyle={styles.menuItemInner}
                  onPress={() => {
                    setShowMenu(false);
                    handleDelete();
                  }}
                >
                  <Ionicons name="trash" size={20} color={Colors.light.error} />
                  <ThemedText style={[styles.menuItemText, { color: Colors.light.error }]}>
                    Delete
                  </ThemedText>
                </PressableOpacity>
              </>
            ) : (
              <PressableOpacity style={styles.menuItem} innerStyle={styles.menuItemInner} onPress={handleReport}>
                <Ionicons name="flag" size={20} color={textColor} />
                <ThemedText style={styles.menuItemText}>Report</ThemedText>
              </PressableOpacity>
            )}
            <PressableOpacity
              style={[styles.menuItem, styles.cancelMenuItem]}
              onPress={() => setShowMenu(false)}
            >
              <ThemedText style={styles.menuItemText}>Cancel</ThemedText>
            </PressableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  replyContainer: {
    marginLeft: 24,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(128, 128, 128, 0.2)',
  },
  commentContent: {
    marginBottom: 8,
  },
  commentText: {
    fontSize: 15,
    lineHeight: 22,
  },
  metaLine: {
    fontSize: 14,
    marginTop: 2,
  },
  separator: {
    opacity: 0.4,
  },
  username: {
    opacity: 0.5,
    fontSize: 14,
  },
  timeAgo: {
    fontSize: 12,
    opacity: 0.4,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: -8,
  },
  actionButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 14,
  },
  moreButton: {
    padding: 6,
  },
  repliesSection: {
    marginTop: 12,
  },
  loadingReplies: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  menuBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  menuContainer: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 8,
    paddingBottom: 34,
  },
  menuItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  menuItemInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemText: {
    fontSize: 17,
  },
  cancelMenuItem: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
    marginTop: 8,
    alignItems: 'center',
  }
});
