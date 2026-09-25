/**
 * User model for authentication
 * 
 */

import { database } from "../database/index.js";
import type { UserModel } from '@inkverse/shared-server/database/types';
import { type UserAgeRange } from "@inkverse/public/graphql/types";
import { generateRandomString } from "../utils/crypto.js";
import { currentDate } from "../utils/date.js";
import { addContactToList, removeContactFromList } from "../messaging/email/octopus.js";
import { purgeCacheOnCdn, purgeMultipleCacheOnCdn } from "../cache/index.js";

interface UserCreateOrUpdateInput {
  email?: string | null;
  username?: string | null;
  googleId?: string | null | undefined;
  appleId?: string | null | undefined;
  ageRange?: UserAgeRange | null;
  birthYear?: number | null | undefined;
  isEmailVerified?: boolean | null | undefined;
  blueskyDid?: string | null | undefined;
}

interface VerificationToken {
  token: string;
  expiry: number;
}

/**
 * Generate a verification token and expiry date
 */
async function generateVerificationToken(): Promise<VerificationToken> {
  const token = await generateRandomString(40);
  const expiry = currentDate() + (4 * 24 * 60 * 60); // 4 days in seconds
  return { token, expiry };
}

export class User {
  /**
   * Get user by ID
   */
  static async getUserById(id: string | number): Promise<UserModel | null> {
    return await database("users")
      .where({ id })
      .first('*');
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email: string): Promise<UserModel | null> {
    return await database("users")
      .where({ email })
      .first('*');
  }

  /**
   * Get user by username
   */
  static async getUserByUsername(username: string): Promise<UserModel | null> {
    const lowerUsername = username.toLowerCase().trim();
    return await database("users")
      .where({ username: lowerUsername })
      .first('*');
  }

  /**
   * Get user by Google ID
   */
  static async getUserByGoogleId(googleId: string): Promise<UserModel | null> {
    return await database("users")
      .where({ googleId })
      .first('*');
  }

  /**
   * Get user by Apple ID
   */
  static async getUserByAppleId(appleId: string): Promise<UserModel | null> {
    return await database("users")
      .where({ appleId })
      .first('*');
  }

  /**
   * Get user by creator UUID (for claimed creators)
   */
  static async getUserByCreatorUuid(creatorUuid: string): Promise<UserModel | null> {
    return await database("users")
      .where({ creatorUuid })
      .first('*');
  }

  static async getEmailsForUserIds(userIds: number[]): Promise<UserModel[]> {
    return await database('users')
      .whereIn('id', userIds)
      .whereNotNull('email')
      .select('id', 'email');
  }

  static async getMaxId(): Promise<number> {
    const result = await database("users").max('id as maxId').first();
    return Number(result?.maxId || 0);
  }

  /**
   * Get user by OTP and mark their email as verified
   */
  static async getAndVerifyEmailByOTP(otp: string): Promise<UserModel | null> {
    const user = await database('users')
      .where({ resetPasswordToken: otp })
      .andWhere('resetPasswordExpiry', '>', currentDate())
      .first();
    
    if (!user) {
      return null;
    }

    // Mark email as verified and return updated user
    const [updatedUser] = await database("users")
      .where({ id: user.id })
      .update({
        updatedAt: currentDate(),
        isEmailVerified: true,
      })
      .returning('*');

    await addContactToList('signup', { email: updatedUser.email });

    return updatedUser;
  }

  /**
   * Check if user has a valid reset password token, if not generate a new one
   */
  static async checkOrResetPasswordReset(user: UserModel): Promise<UserModel | null> {
    if (user.resetPasswordExpiry && user.resetPasswordExpiry > currentDate()) { 
      return user;
    } else {
      const { token, expiry } = await generateVerificationToken();

      const [returnedUser] = await database('users')
        .where({
          id: user.id,
        })
        .update({
          updatedAt: currentDate(),
          resetPasswordToken: token,
          resetPasswordExpiry: expiry,
        })
        .returning('*');

      return returnedUser;
    }
  }

  /**
   * Create a new user
   */
  static async createUser(userData: Partial<UserCreateOrUpdateInput>): Promise<UserModel> {
    // Create user object for database    
    // Insert user into database
    const [user] = await database("users")
      .insert({ 
        createdAt: currentDate(),
        ...userData,
      })
      .returning('*');

    return user;
  }

  /**
   * Update user fields
   */
  static async updateUser(id: string | number, userData: Partial<UserCreateOrUpdateInput>): Promise<UserModel | null> {  
    // Update user in database
    const [updatedUser] = await database("users")
      .where({ id })
      .update({
        updatedAt: currentDate(),
        ...userData,
      })
      .returning('*');
    
    return updatedUser;
  }

  static async updateUserEmail(user: UserModel, email?: string | null): Promise<UserModel | null> {
    const resetPasswordStillValid = user.resetPasswordExpiry && user.resetPasswordExpiry > currentDate();
   
    // Generate new verification token
    const { token, expiry } = await generateVerificationToken();

    const [returnedUser] = await database('users')
      .where({
        id: user.id,
      })
      .update({
        updatedAt: currentDate(),
        ...(!resetPasswordStillValid ? { resetPasswordToken: token, resetPasswordExpiry: expiry } : {}),
        ...(email ? { email } : {}),
        isEmailVerified: false,
      })
      .returning('*');

      return returnedUser;
  }

  /**
   * Clear creatorUuid for any user with the given creatorUuid
   */
  static async clearCreatorUuid(creatorUuid: string): Promise<void> {
    await database("users")
      .where({ creatorUuid })
      .update({ updatedAt: currentDate(), creatorUuid: null });
  }

  /**
   * Delete user account and all associated data
   *
   * Removes every row keyed to the user (devices, tokens, subscriptions, notification
   * preferences/settings, likes, comments, reports, creator claims, notifications sent
   * and received), plus likes/notifications/reports that point at the user's comments.
   * Replies other users left on the deleted comments are left in place.
   * After the transaction commits, purges the affected CDN caches and unsubscribes the
   * user from the email list.
   */
  static async deleteUser(id: string): Promise<boolean> {
    try {
      const user = await User.getUserById(id);
      if (!user) { return false }

      // Collect ids needed for cache purging before anything is deleted
      const comments: { uuid: string; targetUuid: string; parentUuid: string | null }[] = await database('user_comments')
        .where({ userId: id })
        .select('uuid', 'targetUuid', 'parentUuid');

      const likes: { likeableUuid: string; likeableType: string; parentUuid: string | null }[] = await database('user_likes')
        .where({ userId: id })
        .select('likeableUuid', 'likeableType', 'parentUuid');

      const recipientRows: { recipientId: number | string }[] = await database('user_notifications')
        .where({ senderId: id })
        .distinct('recipientId');

      const commentUuids = comments.map(c => c.uuid);
      const recipientIds = recipientRows
        .map(r => String(r.recipientId))
        .filter(recipientId => recipientId !== String(id));

      // Start a transaction to ensure all deletions succeed or fail together
      await database.transaction(async (trx) => {
        // Delete related data first
        await trx('user_device').where({ userId: id }).del();
        await trx('oauth_token').where({ userId: id }).del();
        await trx('userseries_subscriptions').where({ userId: id }).del();
        await trx('notification_preferences').where({ userId: id }).del();
        await trx('notification_settings').where({ userId: id }).del();
        await trx('user_reports').where({ reporterUserId: id }).del();
        await trx('user_creator_claims').where({ userId: id }).del();

        // Notifications the user received or triggered for others
        await trx('user_notifications')
          .where({ recipientId: id })
          .orWhere({ senderId: id })
          .del();

        // Rows that point at the user's comments and would be orphaned
        if (commentUuids.length > 0) {
          await trx('user_notifications')
            .where((builder) => {
              builder
                .where({ targetType: 'COMMENT' }).whereIn('targetUuid', commentUuids)
                .orWhere((inner) => {
                  inner.where({ contextType: 'COMMENT' }).whereIn('contextUuid', commentUuids);
                });
            })
            .del();

          await trx('user_likes')
            .where({ likeableType: 'COMMENT' })
            .whereIn('likeableUuid', commentUuids)
            .del();

          await trx('user_reports')
            .where({ targetType: 'COMMENT' })
            .whereIn('targetUuid', commentUuids)
            .del();
        }

        await trx('user_likes').where({ userId: id }).del();
        await trx('user_comments').where({ userId: id }).del();

        // Finally delete the user
        await trx('users').where({ id }).del();
      });

      await User.purgeCachesForDeletedUser({ id, username: user.username, creatorUuid: user.creatorUuid, comments, likes, recipientIds });

      await removeContactFromList('signup', { email: user.email });

      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  /**
   * Purge every CDN / GraphQL cache entry that could still reference a deleted user
   * or the comments and likes that were removed with them.
   */
  private static async purgeCachesForDeletedUser({ id, username, creatorUuid, comments, likes, recipientIds }: {
    id: string;
    username: string | null | undefined;
    creatorUuid: string | null | undefined;
    comments: { uuid: string; targetUuid: string; parentUuid: string | null }[];
    likes: { likeableUuid: string; likeableType: string; parentUuid: string | null }[];
    recipientIds: string[];
  }): Promise<void> {
    try {
      const commentTargetUuids = new Set<string>();
      const issueUuids = new Set<string>();
      const seriesUuids = new Set<string>();

      for (const comment of comments) {
        if (comment.targetUuid) {
          commentTargetUuids.add(comment.targetUuid);
          issueUuids.add(comment.targetUuid);
        }
        if (comment.parentUuid) { seriesUuids.add(comment.parentUuid); }
      }

      for (const like of likes) {
        switch (like.likeableType) {
          case 'COMICISSUE':
            issueUuids.add(like.likeableUuid);
            if (like.parentUuid) { seriesUuids.add(like.parentUuid); }
            break;
          case 'COMICSERIES':
            seriesUuids.add(like.likeableUuid);
            break;
          case 'COMMENT':
            // Comment likes store the issue as the parent
            if (like.parentUuid) {
              commentTargetUuids.add(like.parentUuid);
              issueUuids.add(like.parentUuid);
            }
            break;
        }
      }

      await purgeCacheOnCdn({ type: 'user', id, shortUrl: username || '' });
      await purgeCacheOnCdn({ type: 'profilecomicseries', id, shortUrl: username || '' });
      await purgeCacheOnCdn({ type: 'notificationsettings', id });

      if (creatorUuid) {
        await purgeCacheOnCdn({ type: 'creator', id: creatorUuid });
      }

      for (const targetUuid of commentTargetUuids) {
        await purgeCacheOnCdn({ type: 'comments', id: targetUuid });
      }

      if (issueUuids.size > 0) {
        await purgeMultipleCacheOnCdn({ type: 'comicissuestats', ids: [...issueUuids] });
      }

      for (const seriesUuid of seriesUuids) {
        await purgeCacheOnCdn({ type: 'comicseriesstats', id: seriesUuid });
      }

      if (recipientIds.length > 0) {
        await purgeMultipleCacheOnCdn({ type: 'notificationfeed', ids: recipientIds });
      }
    } catch (error) {
      console.error('Error purging caches for deleted user:', error);
    }
  }
}
