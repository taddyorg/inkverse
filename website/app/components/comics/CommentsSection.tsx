import React, { useReducer, useEffect, useState, useRef } from 'react';
import { MdSort } from 'react-icons/md';
import { HiOutlineChatBubbleLeftRight, HiOutlinePencilSquare } from 'react-icons/hi2';
import { IoChevronDown, IoChevronUp } from 'react-icons/io5';
import { getPublicApolloClient, getUserApolloClient } from '@/lib/apollo/client.client';
import {
  commentsReducer,
  commentsInitialState,
  loadComments,
  loadMoreComments,
  loadUserComments,
  addComment,
  CommentsActionType,
} from '@inkverse/shared-client/dispatch/comments';
import type { CommentSortType } from '@inkverse/shared-client/graphql/operations';
import { CommentItem } from './CommentItem';
import { CommentForm } from './CommentForm';
import { getUserDetails } from '@/lib/auth/user';
import { InkverseType } from '@inkverse/public/graphql/types';

interface CommentsSectionProps {
  issueUuid: string;
  seriesUuid: string;
  isAuthenticated: boolean;
}

export function CommentsSection({ issueUuid, seriesUuid, isAuthenticated }: CommentsSectionProps) {
  const [state, dispatch] = useReducer(commentsReducer, commentsInitialState);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [isAddCommentExpanded, setIsAddCommentExpanded] = useState(true);
  const sortMenuRef = useRef<HTMLDivElement>(null);

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

  // Load comments on mount
  useEffect(() => {
    if (comments.length === 0) {
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

  // Handle click outside to close sort menu
  useEffect(() => {
    if (!showSortMenu) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setShowSortMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSortMenu]);

  const handleSortChange = (newSortBy: CommentSortType) => {
    setShowSortMenu(false);
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
      // First load more: keep page 1, expand limit to 25
      // Subsequent: increment page
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
    if (!isAuthenticated) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('openSignupModal'));
      }
      return;
    }

    const userClient = getUserApolloClient();
    if (!userClient) return;

    await addComment({
      userClient,
      issueUuid,
      seriesUuid,
      text,
    }, dispatch);
  };

  const hasMoreComments = hasMore;

  return (
    <div className="my-6">
      {/* Header with sort */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
          Comments
        </span>

        {/* Sort dropdown */}
        <div className="relative" ref={sortMenuRef}>
          <button
            onClick={() => setShowSortMenu(!showSortMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-black bg-white/80 hover:bg-white rounded-full transition-colors"
          >
            <MdSort size={18} />
            <span>{sortBy === 'NEWEST' ? 'Newest' : 'Top'}</span>
          </button>
          {showSortMenu && (
            <div className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-10 overflow-hidden">
              <button
                onClick={() => handleSortChange('NEWEST' as CommentSortType)}
                className={`block w-full text-left px-4 py-2.5 text-sm hover:bg-gray-100 transition-colors ${
                  sortBy === 'NEWEST' ? 'text-brand-pink dark:text-taddy-blue font-semibold bg-gray-50' : 'text-gray-700'
                }`}
              >
                Newest
              </button>
              <button
                onClick={() => handleSortChange('TOP' as CommentSortType)}
                className={`block w-full text-left px-4 py-2.5 text-sm hover:bg-gray-100 transition-colors ${
                  sortBy === 'TOP' ? 'text-brand-pink dark:text-taddy-blue font-semibold bg-gray-50' : 'text-gray-700'
                }`}
              >
                Top
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-pink dark:border-taddy-blue" />
        </div>
      )}

      {/* Comments container with unified rounding */}
      <div className="bg-white dark:bg-gray-800/40 rounded-xl overflow-hidden">
        {/* Comments list */}
        {!isLoading && (
          <div>
            {comments.length === 0
            ? (
              <EmptyCommentsState />
            ) : (
              <div>
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
              </div>
            )}
          </div>
        )}

        {/* Load more link */}
        {!isLoading && hasMoreComments && (
          <div className="px-4 py-3 flex justify-center">
            <button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="flex items-center gap-1 text-sm font-medium text-inkverse-black dark:text-gray-400 hover:underline disabled:opacity-50 transition-colors"
            >
              {isLoadingMore ? 'Loading...' : 'Load more comments'}
              {!isLoadingMore && <IoChevronDown size={16} />}
            </button>
          </div>
        )}

        {/* Add comment form */}
        <AddCommentSection
          onSubmit={handleAddComment}
          isSubmitting={isSubmitting}
          isAuthenticated={isAuthenticated}
          isExpanded={isAddCommentExpanded}
          setIsExpanded={setIsAddCommentExpanded}
        />
      </div>
    </div>
  );
}

function EmptyCommentsState() {
  return (
    <div className="text-center px-4 py-4">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white dark:bg-transparent flex items-center justify-center">
        <HiOutlineChatBubbleLeftRight size={32} className="text-gray-400 dark:text-gray-500" />
      </div>
      <p className="text-gray-600 dark:text-gray-300 font-medium">Got any thoughts on this episode?</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Add a comment, it could make this creator's day!</p>
    </div>
  );
}

interface AddCommentSectionProps {
  onSubmit: (text: string) => Promise<void>;
  isSubmitting: boolean;
  isAuthenticated: boolean;
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
}

function AddCommentSection({ onSubmit, isSubmitting, isAuthenticated, isExpanded, setIsExpanded }: AddCommentSectionProps) {
  const headerContent = (
    <div className="flex items-center gap-2">
      <HiOutlinePencilSquare size={20} className="text-gray-500 dark:text-gray-400" />
      <span className="text-base font-bold text-gray-900 dark:text-gray-100">
        Add a comment
      </span>
    </div>
  );

  const Wrapper = isExpanded ? 'div' : 'button';

  return (
    <div className="pt-4">
      <Wrapper
        {...(!isExpanded && { onClick: () => setIsExpanded(true) })}
        className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors rounded-lg ${!isExpanded ? 'hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer' : ''}`}
      >
        {headerContent}
        {!isExpanded && (
          <IoChevronUp size={20} className="text-gray-500 dark:text-gray-400" />
        )}
      </Wrapper>
      
      {isExpanded && (
        <div className="mt-2">
          <CommentForm
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
            isAuthenticated={isAuthenticated}
            placeholder="Share your thoughts..."
            className="pb-4"
          />
        </div>
      )}
    </div>
  );
}