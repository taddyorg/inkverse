/**
 * User model for authentication
 * 
 */

import { database } from "../database/index.js";
import type { UserModel } from '@inkverse/shared-server/database/types';
import { AuthProvider, type UserAgeRange } from "@inkverse/public/graphql/types";
import { generateRandomString } from "../utils/crypto.js";
import { currentDate } from "../utils/date.js";
import { addContactToList } from "../messaging/email/octopus.js";

interface UserCreateOrUpdateInput {
  email?: string | null;
  username?: string | null;
  googleId?: string | null | undefined;
  appleId?: string | null | undefined;
  ageRange?: UserAgeRange | null;
  birthYear?: number | null | undefined;
  isEmailVerified?: boolean | null | undefined;
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

  static async checkOrResetPasswordReset(user: UserModel): Promise<UserModel | null> {
    if (user.resetPasswordExpiry && user.resetPasswordExpiry > currentDate()) { 
      return user
    }else{
      const hex = await generateRandomString(40)
      const expiryDate = currentDate() + (4 * 24 * 60 * 60); // 4 days in seconds

      const [ returnedUser ] = await database('users')
        .where({
          id: user.id,
        })
        .update({
          updatedAt: currentDate(),
          resetPasswordToken: hex,
          resetPasswordExpiry: expiryDate
        })
        .returning('*');

      return returnedUser
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

  /**
   * Mark user email as verified
   */
  static async markEmailAsVerified(id: string | number): Promise<UserModel | null> {
    const [updatedUser] = await database("users")
      .where({ id })
      .update({
        updatedAt: currentDate(),
        isEmailVerified: true,
      })
      .returning('*');
    
    return updatedUser;
  }
  
  /**
   * Generate a username from email
   */
  static sanitizeUsername(inputUsername: string): string {
    // Remove special characters and make lowercase
    const sanitized = inputUsername
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .toLowerCase()
      .trim();
    
    // Enforce 80 character limit
    return sanitized.slice(0, 80);
  }
}