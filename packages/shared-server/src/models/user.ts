/**
 * User model for authentication
 * 
 */

import { database } from "../database/index.js";
import type { UserModel } from '@inkverse/shared-server/database/types';
import { AuthProvider, type UserAgeRange } from "@inkverse/public/graphql/types";
import { generateRandomString } from "../utils/crypto.js";

interface UserCreateOrUpdateInput {
  email: string;
  username: string;
  googleId: string | null | undefined;
  appleId: string | null | undefined;
  ageRange: UserAgeRange;
  birthYear: number | null | undefined;
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
      .where({ google_id: googleId })
      .first('*');
  }

  /**
   * Get user by Apple ID
   */
  static async getUserByAppleId(appleId: string): Promise<UserModel | null> {
    return await database("users")
      .where({ apple_id: appleId })
      .first('*');
  }

  /**
   * Get user by OTP and mark their email as verified
   */
  static async getAndVerifyEmailByOTP(otp: string): Promise<UserModel | null> {
    const user = await database('users')
      .where({ resetPasswordToken: otp })
      .andWhere('resetPasswordExpiry', '>', Date.now() / 1000)
      .first();
    
    if (!user) {
      return null;
    }

    // Mark email as verified and return updated user
    const [updatedUser] = await database("users")
      .where({ id: user.id })
      .update({
        updatedAt: Date.now() / 1000,
        isEmailVerified: true,
      })
      .returning('*');
    
    return updatedUser;
  }

  static async checkOrResetPasswordReset(user: UserModel): Promise<UserModel | null> {
    if (user.resetPasswordExpiry && user.resetPasswordExpiry > Date.now() / 1000) { 
      return user
    }else{
      const hex = await generateRandomString(40)
      const expiryDate = (Date.now() / 1000) + (4 * 24 * 60 * 60); // 4 days in seconds

      const [ returnedUser ] = await database('users')
        .where({
          id: user.id,
        })
        .update({
          updatedAt: Date.now() / 1000,
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
  static async createUser(userData: UserCreateOrUpdateInput): Promise<UserModel> {
    // Create user object for database    
    // Insert user into database
    const [user] = await database("users")
      .insert({ 
        createdAt: Date.now() / 1000,
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
        updatedAt: Date.now() / 1000,
        ...userData,
      })
      .returning('*');
    
    return updatedUser;
  }

  /**
   * Link OAuth provider to existing user account
   */
  static async linkProviderToUser(
    userId: string, 
    provider: AuthProvider, 
    providerId: string,
  ): Promise<UserModel | null> {
    try {
      const [updatedUser] = await database("users")
        .where({ id: userId })
        .update({
          updatedAt: Date.now() / 1000,
          ...(provider === AuthProvider.GOOGLE && { googleId: providerId }),
          ...(provider === AuthProvider.APPLE && { appleId: providerId }),
        })
        .returning('*');
      
      return updatedUser;
    } catch (error) {
      console.error(`Failed to link ${provider} provider to user ${userId}:`, error);
      return null;
    }
  }

  /**
   * Mark user email as verified
   */
  static async markEmailAsVerified(id: string | number): Promise<UserModel | null> {
    const [updatedUser] = await database("users")
      .where({ id })
      .update({
        updatedAt: Date.now() / 1000,
        isEmailVerified: true,
      })
      .returning('*');
    
    return updatedUser;
  }
  
  /**
   * Generate a username from email
   */
  private static safeUsername(inputUsername: string): string {
    // Remove special characters and make lowercase
    const sanitized = inputUsername
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .toLowerCase();
    
    // Enforce 80 character limit
    return sanitized.slice(0, 80);
  }
}