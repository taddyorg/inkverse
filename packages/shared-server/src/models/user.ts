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
   * Delete user account and all associated data
   */
  static async deleteUser(id: string): Promise<boolean> {
    try {

      const user = await User.getUserById(id);
      if (!user) { return false }

      // Start a transaction to ensure all deletions succeed or fail together
      await database.transaction(async (trx) => {
        // Delete related data first
        await trx('user_device').where({ user_id: id }).del();
        await trx('oauth_token').where({ user_id: id }).del();
        await trx('userseries_subscriptions').where({ userId: id }).del();
        await trx('notification_preferences').where({ user_id: id }).del();
        
        // Finally delete the user
        await trx('users').where({ id }).del();
      });

      await removeContactFromList('signup', { email: user.email });
      
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }
}