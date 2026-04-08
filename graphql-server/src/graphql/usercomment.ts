import { AuthenticationError, UserInputError } from './error.js';
import { UserComment, UserReport, UserLike, ComicIssue, ComicSeries, CreatorContent } from '@inkverse/shared-server/models/index';
import { InkverseType, ReportType } from '@inkverse/shared-server/graphql/types';
import type { MutationResolvers } from '@inkverse/shared-server/graphql/types';
import { sendSlackNotification } from '@inkverse/shared-server/messaging/slack';
import { purgeCacheOnCdn } from '@inkverse/shared-server/cache/index';
import { createNotification, notifySeriesCreator } from '@inkverse/shared-server/messaging/notifications/index';
import { NotificationEventType } from '@inkverse/shared-server/graphql/types';
import { inkverseWebsiteUrl } from '@inkverse/public/utils';

// Sanitize comment text by stripping <script> and <iframe> tags and their contents
function sanitizeCommentText(text: string): string {
  return text
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, '')
    .trim();
}

// GraphQL Type Definitions
export const UserCommentDefinitions = `
  """
  User-specific comment data (auth required)
  """
  type UserComment {
    targetUuid: ID!
    targetType: InkverseType!
    likedCommentUuids: [String]!
  }

  """
  Report type for reporting content
  """
  enum ReportType {
    COMMENT_SPAM
    COMMENT_HARASSMENT
    COMMENT_SPOILER
    COMMENT_MEAN_OR_RUDE
    COMICSERIES_INTELLECTUAL_PROPERTY_VIOLATION
    COMICSERIES_GENERATIVE_AI_CONTENT
    COMICSERIES_CONTAINS_SEXUALLY_EXPLICIT_CONTENT
    COMICSERIES_DECEPTIVE_OR_FRAUDULENT_CONTENT
    COMICSERIES_CONTAINS_HATE_SPEECH
    COMICSERIES_IS_SPAM
    COMICSERIES_CONTAINS_UNLAWFUL_CONTENT
  }
`;

// Query Definitions
export const UserCommentQueriesDefinitions = `
  """
  Get user's comment data for a target (liked comments, etc.)
  """
  getUserComments(targetUuid: ID!, targetType: InkverseType!): UserComment
`;

// Mutation Definitions
export const UserCommentMutationsDefinitions = `
  """
  Add a new comment or reply to a comic issue
  """
  addComment(
    issueUuid: ID!
    seriesUuid: ID!
    text: String!
    replyToCommentUuid: ID
  ): Comment

  """
  Edit an existing comment
  """
  editComment(commentUuid: ID!, text: String!, targetUuid: ID!, targetType: InkverseType!): Comment

  """
  Set comment visibility (soft delete/restore)
  """
  setCommentVisibility(commentUuid: ID!, isVisible: Boolean!): Comment

  """
  Delete a comment permanently
  """
  deleteComment(commentUuid: ID!, targetUuid: ID!, targetType: InkverseType!): Boolean!

  """
  Like a comment
  """
  likeComment(commentUuid: ID!, issueUuid: ID!): UserComment

  """
  Unlike a comment
  """
  unlikeComment(commentUuid: ID!, issueUuid: ID!): UserComment

  """
  Report a comment
  """
  reportComment(
    commentUuid: ID!
    reportType: ReportType!
    additionalInfo: String
  ): Boolean!
`;

// Helper to build UserComment response
async function buildUserCommentResponse(
  userId: number,
  targetUuid: string,
  targetType: InkverseType
) {
  // Get user's liked comments for this target
  const userLikes = await UserLike.getUserLikesForParentForLikeableType(
    userId,
    targetUuid,
    InkverseType.COMICISSUE,
    InkverseType.COMMENT
  );

  return {
    targetUuid,
    targetType,
    likedCommentUuids: userLikes.map(like => like.likeableUuid),
  };
}

// Send Slack notification for new comment
async function sendNewCommentSlackNotification(
  username: string | null,
  episodeName: string | null,
  seriesName: string | null,
  commentText: string,
  seriesShortUrl: string,
  issuePosition: number | null
) {
  const truncatedText = commentText.length > 200
    ? commentText.substring(0, 200) + '...'
    : commentText;

  const episodeUrl = `${inkverseWebsiteUrl}/series/${seriesShortUrl}/episode/${issuePosition || 1}`;

  const payload = {
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*NEW COMMENT*\n*User:* ${username || 'Anonymous'}\n*Episode:* ${episodeName || 'Unknown'}\n*Series:* ${seriesName || 'Unknown'}\n*Content:* ${truncatedText}\n*Link:* <${episodeUrl}|View Episode>`,
        },
      },
    ],
  };

  try {
    await sendSlackNotification('general', payload);
  } catch (error) {
    console.error('Error sending Slack notification for new comment:', error);
    // Don't throw - Slack notification failure shouldn't fail the mutation
  }
}

// Resolvers
export const UserCommentQueries = {
  getUserComments: async (
    _parent: any,
    { targetUuid, targetType }: { targetUuid: string; targetType: InkverseType },
    context: any
  ) => {
    if (!context.user) {
      throw new AuthenticationError('You must be logged in to get user comment data');
    }

    return await buildUserCommentResponse(context.user.id, targetUuid, targetType);
  },
};

export const UserCommentMutations: MutationResolvers = {
  addComment: async (
    _parent: any,
    { issueUuid, seriesUuid, text, replyToCommentUuid }: {
      issueUuid: string;
      seriesUuid: string;
      text: string;
      replyToCommentUuid?: string | null;
    },
    context: any
  ) => {
    if (!context.user) {
      throw new AuthenticationError('You must be logged in to add a comment');
    }

    // Validate text
    if (!text || text.trim().length === 0) {
      throw new UserInputError('Comment text cannot be empty');
    }

    if (text.length > 2000) {
      throw new UserInputError('Comment text cannot exceed 2000 characters');
    }

    const replyToComment = replyToCommentUuid
      ? await UserComment.getCommentByUuid(replyToCommentUuid)
      : null;

    if (replyToCommentUuid && !replyToComment) {
      throw new UserInputError('Parent comment not found');
    }

    if (replyToComment?.replyToCommentUuid) {
      throw new UserInputError('Cannot reply to a reply');
    }
    
    // Get episode and series info for Slack notification
    const [comicIssue, comicSeries, creatorContent] = await Promise.all([
      ComicIssue.getComicIssueByUuid(issueUuid),
      ComicSeries.getComicSeriesByUuid(seriesUuid),
      context.user.creatorUuid ? CreatorContent.getCreatorContent(context.user.creatorUuid, seriesUuid) : Promise.resolve(null),
    ]);

    // Sanitize and create the comment
    const sanitizedText = sanitizeCommentText(text);
    const comment = await UserComment.addComment(
      context.user.id,
      sanitizedText,
      issueUuid,
      InkverseType.COMICISSUE,
      seriesUuid,
      InkverseType.COMICSERIES,
      replyToCommentUuid,
      !!creatorContent || false
    );

    if (!comment) {
      throw new Error('Failed to create comment');
    }

    // Send Slack notification (async, don't await)
    sendNewCommentSlackNotification(
      context.user.username,
      comicIssue?.name || null,
      comicSeries?.name || null,
      text,
      comicSeries?.shortUrl || seriesUuid,
      comicIssue?.position || null
    );

    let commentReplyRecipientId: number | null = null;
    if (replyToComment && replyToComment.userId !== context.user.id) {
      commentReplyRecipientId = replyToComment.userId;
      await createNotification({
        recipientId: replyToComment.userId,
        senderId: context.user.id,
        eventType: NotificationEventType.COMMENT_REPLY,
        targetUuid: comment.uuid,
        targetType: 'COMMENT',
        parentUuid: issueUuid,
        parentType: 'COMICISSUE',
      })
    }

    await notifySeriesCreator({
      seriesUuid,
      issueUuid,
      senderId: context.user.id,
      eventType: NotificationEventType.CREATOR_EPISODE_COMMENTED,
      skipForUserId: commentReplyRecipientId,
    });

    // Purge comments cache on CDN (fire-and-forget)
    purgeCacheOnCdn({ type: 'comments', id: issueUuid });
    // Purge comicissuestats cache so total counts refresh
    purgeCacheOnCdn({ type: 'comicissuestats', id: issueUuid });
    purgeCacheOnCdn({ type: 'comicseriesstats', id: seriesUuid });

    // Return complete comment with all fields expected by commentDetails fragment
    return {
      ...comment,
      stats: {
        uuid: comment.uuid,
        likeCount: 0,
        replyCount: 0,
      },
    };
  },

  editComment: async (
    _parent: any,
    { commentUuid, text, targetUuid }: { commentUuid: string; text: string; targetUuid: string; targetType: InkverseType },
    context: any
  ) => {
    if (!context.user) {
      throw new AuthenticationError('You must be logged in to edit a comment');
    }

    // Validate text
    if (!text || text.trim().length === 0) {
      throw new UserInputError('Comment text cannot be empty');
    }

    if (text.length > 2000) {
      throw new UserInputError('Comment text cannot exceed 2000 characters');
    }

    // Sanitize and edit the comment (model verifies ownership via userId)
    const sanitizedText = sanitizeCommentText(text);
    const comment = await UserComment.editComment(
      commentUuid,
      context.user.id,
      sanitizedText
    );

    if (!comment) {
      throw new UserInputError('Comment not found or you do not have permission to edit it');
    }

    //fetch the comment stats
    const [likeCount, replyCount] = await Promise.all([
      UserLike.getLikeCount(commentUuid, InkverseType.COMMENT),
      UserComment.getReplyCount(commentUuid),
    ]);

    // Purge comments cache on CDN (fire-and-forget)
    purgeCacheOnCdn({ type: 'comments', id: targetUuid });

    // Return complete comment with all fields expected by commentDetails fragment
    return {
      ...comment,
      stats: {
        uuid: comment.uuid,
        likeCount: likeCount ?? 0,
        replyCount: replyCount ?? 0,
      },
    };
  },

  setCommentVisibility: async (
    _parent: any,
    { commentUuid, isVisible }: { commentUuid: string; isVisible: boolean },
    context: any
  ) => {
    if (!context.user) {
      throw new AuthenticationError('You must be logged in to modify comment visibility');
    }

    const comment = await UserComment.setCommentVisibility(
      commentUuid,
      context.user.id,
      isVisible
    );

    if (!comment) {
      throw new UserInputError('Comment not found or you do not have permission to modify it');
    }

    //fetch the comment stats
    const [likeCount, replyCount] = await Promise.all([
      UserLike.getLikeCount(commentUuid, InkverseType.COMMENT),
      UserComment.getReplyCount(commentUuid),
    ]);

    // Purge comments cache on CDN (fire-and-forget)
    purgeCacheOnCdn({ type: 'comments', id: comment.targetUuid });
    // Purge comicissuestats cache so total counts refresh
    purgeCacheOnCdn({ type: 'comicissuestats', id: comment.targetUuid });
    purgeCacheOnCdn({ type: 'comicseriesstats', id: comment.parentUuid });

    // Return complete comment with all fields expected by commentDetails fragment
    return {
      uuid: comment.uuid,
      text: comment.text,
      createdAt: comment.createdAt,
      user: context.user,
      targetUuid: comment.targetUuid,
      targetType: comment.targetType,
      replyToUuid: comment.replyToCommentUuid || null,
      isCreator: comment.isCreator || false,
      stats: {
        uuid: comment.uuid,
        likeCount: likeCount ?? 0,
        replyCount: replyCount ?? 0,
      },
    };
  },

  deleteComment: async (
    _parent: any,
    { commentUuid, targetUuid }: { commentUuid: string; targetUuid: string; targetType: InkverseType },
    context: any
  ) => {
    if (!context.user) {
      throw new AuthenticationError('You must be logged in to delete a comment');
    }

    // Fetch comment before deleting to get parentUuid for cache purging
    const comment = await UserComment.getCommentByUuid(commentUuid);

    const deleted = await UserComment.deleteComment(commentUuid, context.user.id);

    if (!deleted) {
      throw new UserInputError('Comment not found or you do not have permission to delete it');
    }

    // Purge comments cache on CDN (fire-and-forget)
    purgeCacheOnCdn({ type: 'comments', id: targetUuid });
    // Purge comicissuestats cache so total counts refresh
    if (comment?.parentUuid) {
      purgeCacheOnCdn({ type: 'comicissuestats', id: targetUuid });
      purgeCacheOnCdn({ type: 'comicseriesstats', id: comment.parentUuid });
    }

    return true;
  },

  likeComment: async (
    _parent: any,
    { commentUuid, issueUuid }: { commentUuid: string; issueUuid: string },
    context: any
  ) => {
    if (!context.user) {
      throw new AuthenticationError('You must be logged in to like a comment');
    }

    // Verify comment exists
    const comment = await UserComment.getCommentByUuid(commentUuid);
    if (!comment) {
      throw new UserInputError('Comment not found');
    }

    // Like the comment
    await UserLike.likeItem(
      context.user.id,
      commentUuid,
      InkverseType.COMMENT,
      issueUuid,
      InkverseType.COMICISSUE
    );

    // Notification: COMMENT_LIKED (notify comment author)
    if (comment.userId !== context.user.id) {
      createNotification({
        recipientId: comment.userId,
        senderId: context.user.id,
        eventType: NotificationEventType.COMMENT_LIKED,
        targetUuid: commentUuid,
        targetType: 'COMMENT',
        parentUuid: issueUuid,
        parentType: 'COMICISSUE',
      })
    }

    // Purge comments cache so likeCount refreshes
    purgeCacheOnCdn({ type: 'comments', id: comment.targetUuid });

    return await buildUserCommentResponse(
      context.user.id,
      comment.targetUuid,
      comment.targetType
    );
  },

  unlikeComment: async (
    _parent: any,
    { commentUuid, issueUuid }: { commentUuid: string; issueUuid: string },
    context: any
  ) => {
    if (!context.user) {
      throw new AuthenticationError('You must be logged in to unlike a comment');
    }

    // Verify comment exists
    const comment = await UserComment.getCommentByUuid(commentUuid);
    if (!comment) {
      throw new UserInputError('Comment not found');
    }

    // Unlike the comment
    await UserLike.unlikeItem(
      context.user.id,
      commentUuid,
      InkverseType.COMMENT
    );

    // Purge comments cache so likeCount refreshes
    purgeCacheOnCdn({ type: 'comments', id: comment.targetUuid });

    return await buildUserCommentResponse(
      context.user.id,
      comment.targetUuid,
      comment.targetType
    );
  },

  reportComment: async (
    _parent: any,
    { commentUuid, reportType, additionalInfo }: {
      commentUuid: string;
      reportType: ReportType;
      additionalInfo?: string | null;
    },
    context: any
  ) => {
    if (!context.user) {
      throw new AuthenticationError('You must be logged in to report a comment');
    }

    // Verify comment exists
    const comment = await UserComment.getCommentByUuid(commentUuid);
    if (!comment) {
      throw new UserInputError('Comment not found');
    }

    // GraphQL enum matches database enum directly
    const dbReportType = ReportType[reportType];

    // Create the report
    await UserReport.report(
      commentUuid,
      InkverseType.COMMENT,
      dbReportType,
      context.user.id,
      additionalInfo
    );

    // Send Slack notification
    const TRUNCATED_TEXT_LENGTH = 200;
    const truncatedText = comment.text.length > TRUNCATED_TEXT_LENGTH
      ? comment.text.substring(0, TRUNCATED_TEXT_LENGTH) + '...'
      : comment.text;

    try {
      await sendSlackNotification('general', {
        text: `*🔔* *COMMENT REPORTED*\n:warning: *Comment:* ${truncatedText}\n*UUID:* ${commentUuid}\n*Report Type:* ${reportType}${additionalInfo ? `\n*Additional Info:* ${additionalInfo}` : ''}`,
      });
    } catch (error) {
      console.error('Error sending Slack notification for comment report:', error);
      // Don't throw - Slack notification failure shouldn't fail the mutation
    }

    return true;
  },
};
