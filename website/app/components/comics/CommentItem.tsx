import React, { useState, useEffect, useRef, type Dispatch } from 'react';
import { MdFavorite, MdFavoriteBorder, MdReply, MdMoreVert, MdEdit, MdDelete, MdFlag, MdKeyboardArrowDown, MdKeyboardArrowUp } from 'react-icons/md';
import { formatDistanceToNow } from 'date-fns';
import { getPublicApolloClient, getUserApolloClient } from '@/lib/apollo/client.client';
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
import { CommentForm } from './CommentForm';
import { ReportModal } from '../ui/ReportModal';
import { InkverseType } from '@inkverse/shared-client/graphql/operations';
import { getInkverseUrl } from '@inkverse/public/utils';
import { Link } from 'react-router-dom';

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
}: CommentItemProps) {
  const [showEditForm, setShowEditForm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showRepliesSection, setShowRepliesSection] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isOwner = currentUserId && comment.user?.id === currentUserId;
  const replyCount = comment.stats?.replyCount || 0;
  const likeCount = comment.stats?.likeCount || 0;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showMenu && menuRef.current && !menuRef.current.contains(target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  // Format relative time
  const timeAgo = comment.createdAt
    ? formatDistanceToNow(new Date(comment.createdAt * 1000), { addSuffix: true })
    : '';

  const handleLike = async () => {
    if (!isAuthenticated) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('openSignupModal'));
      }
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
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('openSignupModal'));
      }
      return;
    }

    const userClient = getUserApolloClient();
    if (!userClient) return;

    setIsSubmitting(true);
    await addComment({
      userClient,
      issueUuid,
      seriesUuid,
      text,
      replyToCommentUuid: comment.uuid,
    }, dispatch);
    setIsSubmitting(false);
    // Keep the replies section open after submitting
  };

  const handleEdit = async (text: string) => {
    const userClient = getUserApolloClient();
    if (!userClient) return;

    setIsSubmitting(true);
    await editComment({
      userClient,
      commentUuid: comment.uuid,
      text,
    }, dispatch);
    setIsSubmitting(false);
    setShowEditForm(false);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    const userClient = getUserApolloClient();
    if (!userClient) return;

    await deleteComment({
      userClient,
      commentUuid: comment.uuid,
      replyToUuid: comment.replyToUuid,
    }, dispatch);
    setShowMenu(false);
  };

  const handleToggleRepliesSection = () => {
    if (!showRepliesSection) {
      if (replyCount > 0 && replies.length === 0) {
        // Load replies when expanding the section
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
    }
    setShowRepliesSection(!showRepliesSection);
  };

  return (
    <div className={`${isReply ? 'ml-6' : ''}`}>
      {/* Card container for comments */}
      <div className={`bg-white dark:bg-transparent ${isReply ? 'pl-4' : 'py-4'}`}>
        {/* Main comment */}
        <div className="flex gap-3 px-4">
          {/* Content */}
          <div className="flex-1 min-w-0">
            {showEditForm ? (
              <CommentForm
                isEdit={true}
                onSubmit={handleEdit}
                isSubmitting={isSubmitting}
                isAuthenticated={isAuthenticated}
                placeholder="Edit your comment..."
                initialText={comment.text}
                autoFocus
                onCancel={() => setShowEditForm(false)}
              />
            ) : (
              <>
                {/* Text with username inline */}
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words leading-relaxed">
                  {comment.text}
                  <span className="text-gray-400 dark:text-gray-400"> — </span>
                  {comment.user?.username && (
                    <Link 
                      to={getInkverseUrl({ type: 'profile', username: comment.user.username }) || '/'} 
                      className="text-gray-400 dark:text-gray-400"
                    >
                      {comment.user.username}
                    </Link>
                  )}
                  {sortBy === 'NEWEST' && timeAgo && (
                    <>
                      <span className="text-gray-300 dark:text-gray-600"> · </span>
                      <span className="text-xs text-gray-400 dark:text-gray-400">
                        {timeAgo}
                      </span>
                    </>
                  )}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-1 mt-3 -ml-2">
                  {/* Like button */}
                  <button
                    onClick={handleLike}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm transition-colors ${
                      isLiked
                        ? 'text-brand-pink'
                        : 'text-gray-500 dark:text-gray-400 hover:text-brand-pink hover:bg-gray-100 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    {isLiked ? (
                      <MdFavorite size={18} />
                    ) : (
                      <MdFavoriteBorder size={18} />
                    )}
                    {likeCount > 0 && <span className="font-medium">{likeCount}</span>}
                  </button>

                  {/* Reply/Replies button (only for top-level comments) */}
                  {!isReply && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleRepliesSection();
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm transition-colors ${
                        showRepliesSection
                          ? 'text-brand-pink dark:text-taddy-blue bg-brand-pink/10 dark:bg-taddy-blue/10'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      {replyCount > 0 ? (
                        <>
                          <MdReply size={18} />
                          <span>Replies ({replyCount})</span>
                        </>
                      ) : (
                        <>
                          <MdReply size={18} />
                          <span>Reply</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* More menu */}
                  <div ref={menuRef} className="relative">
                    <button
                      onClick={() => setShowMenu(!showMenu)}
                      className="p-1.5 rounded-lg text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <MdMoreVert size={18} />
                    </button>
                    {showMenu && (
                      <div className="absolute left-0 top-full mt-1 bg-white dark:bg-transparent rounded-lg shadow-lg z-10 py-1 min-w-[140px] overflow-hidden">
                        {isOwner && (
                          <>
                            <button
                              onClick={() => {
                                setShowMenu(false);
                                setShowEditForm(true);
                              }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                              <MdEdit size={16} />
                              Edit
                            </button>
                            <button
                              onClick={handleDelete}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                              <MdDelete size={16} />
                              Delete
                            </button>
                          </>
                        )}
                        {!isOwner && (
                          <button
                            onClick={() => {
                              setShowMenu(false);
                              if (!isAuthenticated) {
                                window.dispatchEvent(new Event('openSignupModal'));
                              } else {
                                setShowReportModal(true);
                              }
                            }}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <MdFlag size={16} />
                            Report
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Replies section with reply form at bottom */}
            {showRepliesSection && !isReply && (
              <div className="mt-4 space-y-3">
                {isLoadingReplies ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand-pink dark:border-taddy-blue" />
                  </div>
                ) : (
                  <>
                    {/* Replies list */}
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
                      />
                    ))}

                    {/* Reply form at the bottom */}
                    <div className="ml-6 pl-4">
                      <CommentForm
                        isReply={true}
                        onSubmit={handleReply}
                        isSubmitting={isSubmitting}
                        isAuthenticated={isAuthenticated}
                        placeholder={`Reply to ${comment.user?.username || 'Anonymous'}...`}
                        onCancel={() => setShowRepliesSection(false)}
                      />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Report modal */}
      {showReportModal && (
        <ReportModal
          variant="comment"
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          commentUuid={comment.uuid}
        />
      )}
    </div>
  );
}
