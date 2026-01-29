import { ApolloClient } from '@apollo/client';
import type { Dispatch } from 'react';
import {
  GetComments,
  GetRepliesForComment,
  GetUserComments,
  AddComment,
  EditComment,
  DeleteComment,
  LikeComment,
  UnlikeComment,
  ReportComment,
  type GetCommentsQuery,
  type GetCommentsQueryVariables,
  type GetRepliesForCommentQuery,
  type GetRepliesForCommentQueryVariables,
  type GetUserCommentsQuery,
  type GetUserCommentsQueryVariables,
  type AddCommentMutation,
  type AddCommentMutationVariables,
  type EditCommentMutation,
  type EditCommentMutationVariables,
  type DeleteCommentMutation,
  type DeleteCommentMutationVariables,
  type LikeCommentMutation,
  type LikeCommentMutationVariables,
  type UnlikeCommentMutation,
  type UnlikeCommentMutationVariables,
  type ReportCommentMutation,
  type ReportCommentMutationVariables,
  type CommentDetailsFragment,
  type CommentSortType,
  type ReportType,
  type InkverseType,
} from '../graphql/operations.js';

// Re-export for consumers - using flattened Comment type
export type Comment = CommentDetailsFragment;

/* Action Type Enum */
export enum CommentsActionType {
  // Load comments
  LOAD_COMMENTS_START = 'LOAD_COMMENTS_START',
  LOAD_COMMENTS_SUCCESS = 'LOAD_COMMENTS_SUCCESS',
  LOAD_COMMENTS_ERROR = 'LOAD_COMMENTS_ERROR',

  // Load more comments (pagination)
  LOAD_MORE_COMMENTS_START = 'LOAD_MORE_COMMENTS_START',
  LOAD_MORE_COMMENTS_SUCCESS = 'LOAD_MORE_COMMENTS_SUCCESS',
  LOAD_MORE_COMMENTS_ERROR = 'LOAD_MORE_COMMENTS_ERROR',

  // Load replies
  LOAD_REPLIES_START = 'LOAD_REPLIES_START',
  LOAD_REPLIES_SUCCESS = 'LOAD_REPLIES_SUCCESS',
  LOAD_REPLIES_ERROR = 'LOAD_REPLIES_ERROR',

  // Add comment
  ADD_COMMENT_START = 'ADD_COMMENT_START',
  ADD_COMMENT_SUCCESS = 'ADD_COMMENT_SUCCESS',
  ADD_COMMENT_ERROR = 'ADD_COMMENT_ERROR',

  // Edit comment
  EDIT_COMMENT_START = 'EDIT_COMMENT_START',
  EDIT_COMMENT_SUCCESS = 'EDIT_COMMENT_SUCCESS',
  EDIT_COMMENT_ERROR = 'EDIT_COMMENT_ERROR',

  // Delete comment
  DELETE_COMMENT_START = 'DELETE_COMMENT_START',
  DELETE_COMMENT_SUCCESS = 'DELETE_COMMENT_SUCCESS',
  DELETE_COMMENT_ERROR = 'DELETE_COMMENT_ERROR',

  // Like/Unlike comment
  LIKE_COMMENT_START = 'LIKE_COMMENT_START',
  LIKE_COMMENT_SUCCESS = 'LIKE_COMMENT_SUCCESS',
  LIKE_COMMENT_ERROR = 'LIKE_COMMENT_ERROR',

  UNLIKE_COMMENT_START = 'UNLIKE_COMMENT_START',
  UNLIKE_COMMENT_SUCCESS = 'UNLIKE_COMMENT_SUCCESS',
  UNLIKE_COMMENT_ERROR = 'UNLIKE_COMMENT_ERROR',

  // Report comment
  REPORT_COMMENT_START = 'REPORT_COMMENT_START',
  REPORT_COMMENT_SUCCESS = 'REPORT_COMMENT_SUCCESS',
  REPORT_COMMENT_ERROR = 'REPORT_COMMENT_ERROR',

  // User comments data
  LOAD_USER_COMMENTS_SUCCESS = 'LOAD_USER_COMMENTS_SUCCESS',

  // Set sort type
  SET_SORT_TYPE = 'SET_SORT_TYPE',
}

export type CommentsAction =
  // Load comments
  | { type: CommentsActionType.LOAD_COMMENTS_START }
  | { type: CommentsActionType.LOAD_COMMENTS_SUCCESS; payload: { comments: Comment[]; hasMore: boolean } }
  | { type: CommentsActionType.LOAD_COMMENTS_ERROR; payload: string }

  // Load more comments
  | { type: CommentsActionType.LOAD_MORE_COMMENTS_START }
  | { type: CommentsActionType.LOAD_MORE_COMMENTS_SUCCESS; payload: { comments: Comment[]; hasMore: boolean } }
  | { type: CommentsActionType.LOAD_MORE_COMMENTS_ERROR; payload: string }

  // Load replies
  | { type: CommentsActionType.LOAD_REPLIES_START; payload: { commentUuid: string } }
  | { type: CommentsActionType.LOAD_REPLIES_SUCCESS; payload: { commentUuid: string; replies: Comment[] } }
  | { type: CommentsActionType.LOAD_REPLIES_ERROR; payload: { commentUuid: string; error: string } }

  // Add comment
  | { type: CommentsActionType.ADD_COMMENT_START }
  | { type: CommentsActionType.ADD_COMMENT_SUCCESS; payload: { comment: Comment; replyToUuid?: string | null } }
  | { type: CommentsActionType.ADD_COMMENT_ERROR; payload: string }

  // Edit comment
  | { type: CommentsActionType.EDIT_COMMENT_START }
  | { type: CommentsActionType.EDIT_COMMENT_SUCCESS; payload: { commentUuid: string; text: string } }
  | { type: CommentsActionType.EDIT_COMMENT_ERROR; payload: string }

  // Delete comment
  | { type: CommentsActionType.DELETE_COMMENT_START }
  | { type: CommentsActionType.DELETE_COMMENT_SUCCESS; payload: { commentUuid: string; replyToUuid?: string | null } }
  | { type: CommentsActionType.DELETE_COMMENT_ERROR; payload: string }

  // Like comment
  | { type: CommentsActionType.LIKE_COMMENT_START; payload: { commentUuid: string } }
  | { type: CommentsActionType.LIKE_COMMENT_SUCCESS; payload: { likedCommentUuids: string[] } }
  | { type: CommentsActionType.LIKE_COMMENT_ERROR; payload: string }

  // Unlike comment
  | { type: CommentsActionType.UNLIKE_COMMENT_START; payload: { commentUuid: string } }
  | { type: CommentsActionType.UNLIKE_COMMENT_SUCCESS; payload: { likedCommentUuids: string[] } }
  | { type: CommentsActionType.UNLIKE_COMMENT_ERROR; payload: string }

  // Report comment
  | { type: CommentsActionType.REPORT_COMMENT_START }
  | { type: CommentsActionType.REPORT_COMMENT_SUCCESS }
  | { type: CommentsActionType.REPORT_COMMENT_ERROR; payload: string }

  // User comments data
  | { type: CommentsActionType.LOAD_USER_COMMENTS_SUCCESS; payload: { likedCommentUuids: string[] } }

  // Set sort type
  | { type: CommentsActionType.SET_SORT_TYPE; payload: CommentSortType };

/* State Type */
export type CommentsState = {
  isLoading: boolean;
  isLoadingMore: boolean;
  comments: Comment[];
  repliesMap: Record<string, Comment[]>;
  loadingReplies: Record<string, boolean>;
  hasMore: boolean;
  currentPage: number;
  sortBy: CommentSortType;
  likedCommentUuids: string[];
  isSubmitting: boolean;
  error: string | null;
};

export const commentsInitialState: CommentsState = {
  isLoading: false,
  isLoadingMore: false,
  comments: [],
  repliesMap: {},
  loadingReplies: {},
  hasMore: true,
  currentPage: 1,
  sortBy: 'TOP' as CommentSortType,
  likedCommentUuids: [],
  isSubmitting: false,
  error: null,
};

/* Action Creators */

interface LoadCommentsProps {
  publicClient: ApolloClient;
  targetUuid: string;
  targetType: InkverseType;
  page?: number;
  limitPerPage?: number;
  sortBy?: CommentSortType;
}

export async function loadComments(
  { publicClient, targetUuid, targetType, page = 1, limitPerPage = 5, sortBy = 'TOP' as CommentSortType }: LoadCommentsProps,
  dispatch?: Dispatch<CommentsAction>
): Promise<Comment[] | null> {
  if (dispatch) dispatch({ type: CommentsActionType.LOAD_COMMENTS_START });

  try {
    const result = await publicClient.query<GetCommentsQuery, GetCommentsQueryVariables>({
      query: GetComments,
      variables: { targetUuid, targetType, page, limitPerPage, sortBy },
    });

    const comments = (result.data?.getComments?.comments || []) as Comment[];
    const hasMore = comments.length >= limitPerPage;

    if (dispatch) {
      dispatch({
        type: CommentsActionType.LOAD_COMMENTS_SUCCESS,
        payload: { comments, hasMore },
      });
    }

    return comments;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load comments';
    if (dispatch) {
      dispatch({ type: CommentsActionType.LOAD_COMMENTS_ERROR, payload: errorMessage });
    }
    return null;
  }
}

interface LoadMoreCommentsProps {
  publicClient: ApolloClient;
  targetUuid: string;
  targetType: InkverseType;
  page: number;
  limitPerPage?: number;
  sortBy?: CommentSortType;
}

export async function loadMoreComments(
  { publicClient, targetUuid, targetType, page, limitPerPage = 25, sortBy = 'TOP' as CommentSortType }: LoadMoreCommentsProps,
  dispatch?: Dispatch<CommentsAction>
): Promise<Comment[] | null> {
  if (dispatch) dispatch({ type: CommentsActionType.LOAD_MORE_COMMENTS_START });

  try {
    const result = await publicClient.query<GetCommentsQuery, GetCommentsQueryVariables>({
      query: GetComments,
      variables: { targetUuid, targetType, page, limitPerPage, sortBy },
    });

    const comments = (result.data?.getComments?.comments || []) as Comment[];
    const hasMore = comments.length >= limitPerPage;

    if (dispatch) {
      dispatch({
        type: CommentsActionType.LOAD_MORE_COMMENTS_SUCCESS,
        payload: { comments, hasMore },
      });
    }

    return comments;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load more comments';
    if (dispatch) {
      dispatch({ type: CommentsActionType.LOAD_MORE_COMMENTS_ERROR, payload: errorMessage });
    }
    return null;
  }
}

interface LoadRepliesProps {
  publicClient: ApolloClient;
  targetUuid: string;
  targetType: InkverseType;
  commentUuid: string;
  page?: number;
  limitPerPage?: number;
}

export async function loadReplies(
  { publicClient, targetUuid, targetType, commentUuid, page = 1, limitPerPage = 25 }: LoadRepliesProps,
  dispatch?: Dispatch<CommentsAction>
): Promise<Comment[] | null> {
  if (dispatch) dispatch({ type: CommentsActionType.LOAD_REPLIES_START, payload: { commentUuid } });

  try {
    const result = await publicClient.query<GetRepliesForCommentQuery, GetRepliesForCommentQueryVariables>({
      query: GetRepliesForComment,
      variables: { targetUuid, targetType, commentUuid, page, limitPerPage },
    });

    const replies = (result.data?.getRepliesForComment?.comments || []) as Comment[];

    if (dispatch) {
      dispatch({
        type: CommentsActionType.LOAD_REPLIES_SUCCESS,
        payload: { commentUuid, replies },
      });
    }

    return replies;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load replies';
    if (dispatch) {
      dispatch({
        type: CommentsActionType.LOAD_REPLIES_ERROR,
        payload: { commentUuid, error: errorMessage },
      });
    }
    return null;
  }
}

interface LoadUserCommentsProps {
  userClient: ApolloClient;
  targetUuid: string;
  targetType: InkverseType;
}

export async function loadUserComments(
  { userClient, targetUuid, targetType }: LoadUserCommentsProps,
  dispatch?: Dispatch<CommentsAction>
): Promise<string[] | null> {
  try {
    const result = await userClient.query<GetUserCommentsQuery, GetUserCommentsQueryVariables>({
      query: GetUserComments,
      variables: { targetUuid, targetType },
    });

    const likedCommentUuids = (result.data?.getUserComments?.likedCommentUuids || []).filter(
      (uuid: string | null): uuid is string => uuid !== null
    );

    if (dispatch) {
      dispatch({
        type: CommentsActionType.LOAD_USER_COMMENTS_SUCCESS,
        payload: { likedCommentUuids },
      });
    }

    return likedCommentUuids;
  } catch (error) {
    // Silent fail for user comments - not critical
    return null;
  }
}

interface AddCommentProps {
  userClient: ApolloClient;
  issueUuid: string;
  seriesUuid: string;
  text: string;
  replyToCommentUuid?: string | null;
}

export async function addComment(
  { userClient, issueUuid, seriesUuid, text, replyToCommentUuid }: AddCommentProps,
  dispatch?: Dispatch<CommentsAction>
): Promise<Comment | null> {
  if (dispatch) dispatch({ type: CommentsActionType.ADD_COMMENT_START });

  try {
    const result = await userClient.mutate<AddCommentMutation, AddCommentMutationVariables>({
      mutation: AddComment,
      variables: { issueUuid, seriesUuid, text, replyToCommentUuid },
    });

    if (!result.data?.addComment) {
      throw new Error('Failed to add comment');
    }

    // Use server response directly - it contains all fields from the commentDetails fragment
    const newComment = result.data.addComment as Comment;

    if (dispatch) {
      dispatch({
        type: CommentsActionType.ADD_COMMENT_SUCCESS,
        payload: { comment: newComment, replyToUuid: replyToCommentUuid },
      });
    }

    return newComment;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to add comment';
    if (dispatch) {
      dispatch({ type: CommentsActionType.ADD_COMMENT_ERROR, payload: errorMessage });
    }
    return null;
  }
}

interface EditCommentProps {
  userClient: ApolloClient;
  commentUuid: string;
  text: string;
  targetUuid: string;
  targetType: InkverseType;
}

export async function editComment(
  { userClient, commentUuid, text, targetUuid, targetType }: EditCommentProps,
  dispatch?: Dispatch<CommentsAction>
): Promise<boolean> {
  if (dispatch) dispatch({ type: CommentsActionType.EDIT_COMMENT_START });

  try {
    const result = await userClient.mutate<EditCommentMutation, EditCommentMutationVariables>({
      mutation: EditComment,
      variables: { commentUuid, text, targetUuid, targetType },
    });

    if (!result.data?.editComment) {
      throw new Error('Failed to edit comment');
    }

    if (dispatch) {
      dispatch({
        type: CommentsActionType.EDIT_COMMENT_SUCCESS,
        payload: { commentUuid, text: result.data.editComment.text },
      });
    }

    return true;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to edit comment';
    if (dispatch) {
      dispatch({ type: CommentsActionType.EDIT_COMMENT_ERROR, payload: errorMessage });
    }
    return false;
  }
}

interface DeleteCommentProps {
  userClient: ApolloClient;
  commentUuid: string;
  replyToUuid?: string | null;
  targetUuid: string;
  targetType: InkverseType;
}

export async function deleteComment(
  { userClient, commentUuid, replyToUuid, targetUuid, targetType }: DeleteCommentProps,
  dispatch?: Dispatch<CommentsAction>
): Promise<boolean> {
  if (dispatch) dispatch({ type: CommentsActionType.DELETE_COMMENT_START });

  try {
    const result = await userClient.mutate<DeleteCommentMutation, DeleteCommentMutationVariables>({
      mutation: DeleteComment,
      variables: { commentUuid, targetUuid, targetType },
    });

    if (!result.data?.deleteComment) {
      throw new Error('Failed to delete comment');
    }

    if (dispatch) {
      dispatch({
        type: CommentsActionType.DELETE_COMMENT_SUCCESS,
        payload: { commentUuid, replyToUuid },
      });
    }

    return true;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete comment';
    if (dispatch) {
      dispatch({ type: CommentsActionType.DELETE_COMMENT_ERROR, payload: errorMessage });
    }
    return false;
  }
}

interface LikeCommentProps {
  userClient: ApolloClient;
  commentUuid: string;
  issueUuid: string;
}

export async function likeComment(
  { userClient, commentUuid, issueUuid }: LikeCommentProps,
  dispatch?: Dispatch<CommentsAction>
): Promise<string[] | null> {
  if (dispatch) dispatch({ type: CommentsActionType.LIKE_COMMENT_START, payload: { commentUuid } });

  try {
    const result = await userClient.mutate<LikeCommentMutation, LikeCommentMutationVariables>({
      mutation: LikeComment,
      variables: { commentUuid, issueUuid },
    });

    if (!result.data?.likeComment) {
      throw new Error('Failed to like comment');
    }

    const likedCommentUuids = (result.data.likeComment.likedCommentUuids || []).filter(
      (uuid: string | null): uuid is string => uuid !== null
    );

    if (dispatch) {
      dispatch({
        type: CommentsActionType.LIKE_COMMENT_SUCCESS,
        payload: { likedCommentUuids },
      });
    }

    return likedCommentUuids;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to like comment';
    if (dispatch) {
      dispatch({ type: CommentsActionType.LIKE_COMMENT_ERROR, payload: errorMessage });
    }
    return null;
  }
}

interface UnlikeCommentProps {
  userClient: ApolloClient;
  commentUuid: string;
  issueUuid: string;
}

export async function unlikeComment(
  { userClient, commentUuid, issueUuid }: UnlikeCommentProps,
  dispatch?: Dispatch<CommentsAction>
): Promise<string[] | null> {
  if (dispatch) dispatch({ type: CommentsActionType.UNLIKE_COMMENT_START, payload: { commentUuid } });

  try {
    const result = await userClient.mutate<UnlikeCommentMutation, UnlikeCommentMutationVariables>({
      mutation: UnlikeComment,
      variables: { commentUuid, issueUuid },
    });

    if (!result.data?.unlikeComment) {
      throw new Error('Failed to unlike comment');
    }

    const likedCommentUuids = (result.data.unlikeComment.likedCommentUuids || []).filter(
      (uuid: string | null): uuid is string => uuid !== null
    );

    if (dispatch) {
      dispatch({
        type: CommentsActionType.UNLIKE_COMMENT_SUCCESS,
        payload: { likedCommentUuids },
      });
    }

    return likedCommentUuids;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to unlike comment';
    if (dispatch) {
      dispatch({ type: CommentsActionType.UNLIKE_COMMENT_ERROR, payload: errorMessage });
    }
    return null;
  }
}

interface ReportCommentProps {
  userClient: ApolloClient;
  commentUuid: string;
  reportType: ReportType;
  additionalInfo?: string | null;
}

export async function reportComment(
  { userClient, commentUuid, reportType, additionalInfo }: ReportCommentProps,
  dispatch?: Dispatch<CommentsAction>
): Promise<boolean> {
  if (dispatch) dispatch({ type: CommentsActionType.REPORT_COMMENT_START });

  try {
    const result = await userClient.mutate<ReportCommentMutation, ReportCommentMutationVariables>({
      mutation: ReportComment,
      variables: { commentUuid, reportType, additionalInfo },
    });

    if (!result.data?.reportComment) {
      throw new Error('Failed to report comment');
    }

    if (dispatch) {
      dispatch({ type: CommentsActionType.REPORT_COMMENT_SUCCESS });
    }

    return true;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to report comment';
    if (dispatch) {
      dispatch({ type: CommentsActionType.REPORT_COMMENT_ERROR, payload: errorMessage });
    }
    return false;
  }
}

/* Reducer */
export function commentsReducer(
  state: CommentsState,
  action: CommentsAction
): CommentsState {
  switch (action.type) {
    // Load comments
    case CommentsActionType.LOAD_COMMENTS_START:
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case CommentsActionType.LOAD_COMMENTS_SUCCESS:
      return {
        ...state,
        isLoading: false,
        comments: action.payload.comments,
        hasMore: action.payload.hasMore,
        currentPage: 1,
        repliesMap: {},
        error: null,
      };
    case CommentsActionType.LOAD_COMMENTS_ERROR:
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };

    // Load more comments
    case CommentsActionType.LOAD_MORE_COMMENTS_START:
      return {
        ...state,
        isLoadingMore: true,
        error: null,
      };
    case CommentsActionType.LOAD_MORE_COMMENTS_SUCCESS: {
      // Filter out duplicates (handles first expansion where page 1 includes original 5)
      const existingUuids = new Set(state.comments.map(c => c.uuid));
      const newUniqueComments = action.payload.comments.filter(c => !existingUuids.has(c.uuid));

      return {
        ...state,
        isLoadingMore: false,
        comments: [...state.comments, ...newUniqueComments],
        hasMore: action.payload.hasMore,
        currentPage: state.currentPage + 1,
        error: null,
      };
    }
    case CommentsActionType.LOAD_MORE_COMMENTS_ERROR:
      return {
        ...state,
        isLoadingMore: false,
        error: action.payload,
      };

    // Load replies
    case CommentsActionType.LOAD_REPLIES_START:
      return {
        ...state,
        loadingReplies: {
          ...state.loadingReplies,
          [action.payload.commentUuid]: true,
        },
      };
    case CommentsActionType.LOAD_REPLIES_SUCCESS:
      return {
        ...state,
        repliesMap: {
          ...state.repliesMap,
          [action.payload.commentUuid]: action.payload.replies,
        },
        loadingReplies: {
          ...state.loadingReplies,
          [action.payload.commentUuid]: false,
        },
      };
    case CommentsActionType.LOAD_REPLIES_ERROR:
      return {
        ...state,
        loadingReplies: {
          ...state.loadingReplies,
          [action.payload.commentUuid]: false,
        },
      };

    // Add comment
    case CommentsActionType.ADD_COMMENT_START:
      return {
        ...state,
        isSubmitting: true,
        error: null,
      };
    case CommentsActionType.ADD_COMMENT_SUCCESS: {
      const { comment, replyToUuid } = action.payload;

      if (replyToUuid) {
        // Add reply to repliesMap
        const existingReplies = state.repliesMap[replyToUuid] || [];
        return {
          ...state,
          isSubmitting: false,
          repliesMap: {
            ...state.repliesMap,
            [replyToUuid]: [...existingReplies, comment],
          },
          // Update reply count for parent comment
          comments: state.comments.map(c =>
            c.uuid === replyToUuid
              ? {
                  ...c,
                  stats: {
                    ...c.stats,
                    uuid: c.stats?.uuid || '',
                    replyCount: (c.stats?.replyCount || 0) + 1,
                  },
                }
              : c
          ),
        };
      } else {
        // Add top-level comment
        return {
          ...state,
          isSubmitting: false,
          comments: [...state.comments, comment],
        };
      }
    }
    case CommentsActionType.ADD_COMMENT_ERROR:
      return {
        ...state,
        isSubmitting: false,
        error: action.payload,
      };

    // Edit comment
    case CommentsActionType.EDIT_COMMENT_START:
      return {
        ...state,
        isSubmitting: true,
        error: null,
      };
    case CommentsActionType.EDIT_COMMENT_SUCCESS: {
      const { commentUuid, text } = action.payload;
      return {
        ...state,
        isSubmitting: false,
        comments: state.comments.map(c =>
          c.uuid === commentUuid
            ? { ...c, text }
            : c
        ),
        // Also update in repliesMap
        repliesMap: Object.fromEntries(
          Object.entries(state.repliesMap).map(([key, replies]) => [
            key,
            replies.map(r =>
              r.uuid === commentUuid
                ? { ...r, text }
                : r
            ),
          ])
        ),
      };
    }
    case CommentsActionType.EDIT_COMMENT_ERROR:
      return {
        ...state,
        isSubmitting: false,
        error: action.payload,
      };

    // Delete comment
    case CommentsActionType.DELETE_COMMENT_START:
      return {
        ...state,
        isSubmitting: true,
        error: null,
      };
    case CommentsActionType.DELETE_COMMENT_SUCCESS: {
      const { commentUuid, replyToUuid } = action.payload;

      if (replyToUuid) {
        // Remove reply from repliesMap
        const existingReplies = state.repliesMap[replyToUuid] || [];
        return {
          ...state,
          isSubmitting: false,
          repliesMap: {
            ...state.repliesMap,
            [replyToUuid]: existingReplies.filter(r => r.uuid !== commentUuid),
          },
          // Update reply count for parent comment
          comments: state.comments.map(c =>
            c.uuid === replyToUuid
              ? {
                  ...c,
                  stats: {
                    ...c.stats,
                    uuid: c.stats?.uuid || '',
                    replyCount: Math.max(0, (c.stats?.replyCount || 0) - 1),
                  },
                }
              : c
          ),
        };
      } else {
        // Remove top-level comment
        return {
          ...state,
          isSubmitting: false,
          comments: state.comments.filter(c => c.uuid !== commentUuid),
          // Also clean up any replies for this comment
          repliesMap: Object.fromEntries(
            Object.entries(state.repliesMap).filter(([key]) => key !== commentUuid)
          ),
        };
      }
    }
    case CommentsActionType.DELETE_COMMENT_ERROR:
      return {
        ...state,
        isSubmitting: false,
        error: action.payload,
      };

    // Like comment
    case CommentsActionType.LIKE_COMMENT_START: {
      // Optimistically add the like
      const { commentUuid } = action.payload;
      return {
        ...state,
        likedCommentUuids: [...state.likedCommentUuids, commentUuid],
        comments: state.comments.map(c =>
          c.uuid === commentUuid
            ? { ...c, stats: { ...c.stats, uuid: c.stats?.uuid || '', likeCount: (c.stats?.likeCount || 0) + 1 } }
            : c
        ),
        repliesMap: Object.fromEntries(
          Object.entries(state.repliesMap).map(([key, replies]) => [
            key,
            replies.map(r =>
              r.uuid === commentUuid
                ? { ...r, stats: { ...r.stats, uuid: r.stats?.uuid || '', likeCount: (r.stats?.likeCount || 0) + 1 } }
                : r
            ),
          ])
        ),
      };
    }
    case CommentsActionType.LIKE_COMMENT_SUCCESS:
      return {
        ...state,
        likedCommentUuids: action.payload.likedCommentUuids,
      };
    case CommentsActionType.LIKE_COMMENT_ERROR:
      return {
        ...state,
        error: action.payload,
      };

    // Unlike comment
    case CommentsActionType.UNLIKE_COMMENT_START: {
      // Optimistically remove the like
      const { commentUuid } = action.payload;
      return {
        ...state,
        likedCommentUuids: state.likedCommentUuids.filter(uuid => uuid !== commentUuid),
        comments: state.comments.map(c =>
          c.uuid === commentUuid
            ? { ...c, stats: { ...c.stats, uuid: c.stats?.uuid || '', likeCount: Math.max(0, (c.stats?.likeCount || 0) - 1) } }
            : c
        ),
        repliesMap: Object.fromEntries(
          Object.entries(state.repliesMap).map(([key, replies]) => [
            key,
            replies.map(r =>
              r.uuid === commentUuid
                ? { ...r, stats: { ...r.stats, uuid: r.stats?.uuid || '', likeCount: Math.max(0, (r.stats?.likeCount || 0) - 1) } }
                : r
            ),
          ])
        ),
      };
    }
    case CommentsActionType.UNLIKE_COMMENT_SUCCESS:
      return {
        ...state,
        likedCommentUuids: action.payload.likedCommentUuids,
      };
    case CommentsActionType.UNLIKE_COMMENT_ERROR:
      return {
        ...state,
        error: action.payload,
      };

    // Report comment
    case CommentsActionType.REPORT_COMMENT_START:
      return {
        ...state,
        isSubmitting: true,
        error: null,
      };
    case CommentsActionType.REPORT_COMMENT_SUCCESS:
      return {
        ...state,
        isSubmitting: false,
      };
    case CommentsActionType.REPORT_COMMENT_ERROR:
      return {
        ...state,
        isSubmitting: false,
        error: action.payload,
      };

    // User comments data
    case CommentsActionType.LOAD_USER_COMMENTS_SUCCESS:
      return {
        ...state,
        likedCommentUuids: action.payload.likedCommentUuids,
      };

    // Set sort type
    case CommentsActionType.SET_SORT_TYPE:
      return {
        ...state,
        sortBy: action.payload,
      };

    default:
      return state;
  }
}
