/**
 * OAuth Token model for managing OAuth refresh tokens
 * 
 * Security notes:
 * - We only store the refresh token, not the access token
 * - Access tokens are short-lived and should be obtained on-demand
 * - Refresh tokens must be stored in plaintext to exchange for new access tokens
 * - Database should be encrypted at rest
 * - Use HTTPS for all OAuth flows
 */

import { database } from "../database/index.js";
import { getSafeError } from "../utils/errors.js";

export class OAuthToken {
  /**
   * Save OAuth tokens for a user
   */
  static async saveOAuthTokensForUser(params: {
    userId: string;
    hostingProviderUuid: string;
    refreshToken: string;
    refreshTokenExpiresAt: number;
  }): Promise<void> {
    const { userId, hostingProviderUuid, refreshToken, refreshTokenExpiresAt } = params;
    
    try {
      // Validate inputs
      if (!userId || !hostingProviderUuid || !refreshToken) {
        throw new Error('Missing required parameters for saving OAuth tokens');
      }
      
      // Store only refresh token in database
      // Access tokens are short-lived and shouldn't be persisted
      await database('oauth_token')
        .insert({
          userId,
          hostingProviderUuid,
          refreshToken,
          refreshTokenExpiresAt,
          createdAt: new Date(),
        })
        .onConflict(['user_id', 'hosting_provider_uuid'])
        .merge({
          refreshToken,
          refreshTokenExpiresAt,
          updatedAt: new Date(),
        });
    } catch (error) {
      throw getSafeError(error, 'Failed to save OAuth tokens');
    }
  }

  /**
   * Get OAuth refresh token for a user and hosting provider
   */
  static async getRefreshToken(userId: string, hostingProviderUuid: string): Promise<string | null> {
    try {
      const [hostingProvider] = await database('oauth_token')
        .where({
          userId,
          hostingProviderUuid,
        })
        .select('refreshToken');
      
      return hostingProvider?.refreshToken || null;
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  }

  /**
   * Get all OAuth refresh tokens for a user
   */
  static async getAllRefreshTokensForUser(userId: string): Promise<string[] | null> {
    const tokens = await database('oauth_token')
      .where({ userId })
      .select('refreshToken');

    return tokens.map((token) => token.refreshToken);
  }

  /**
   * Get all OAuth connections for a user
   */
  static async syncHostingProviderTokens(userId: string): Promise<Array<{ hostingProviderUuid: string; refreshToken: string }>> {
    try {
      const oauthTokens = await database('oauth_token')
        .where({ userId })
        .select('hostingProviderUuid', 'refreshToken');
      
      return oauthTokens;
    } catch (error) {
      console.error('Error getting user OAuth connections:', error);
      return [];
    }
  }

  /**
   * Delete OAuth tokens for a user and hosting provider
   */
  static async deleteRefreshTokensForUserAndHostingProvider(userId: string, hostingProviderUuid: string): Promise<void> {
    try {
      await database('oauth_token')
        .where({
          userId,
          hostingProviderUuid,
        })
        .delete();
    } catch (error) {
      throw getSafeError(error, 'Failed to delete OAuth connection');
    }
  }

  /**
   * Delete all OAuth connections for a user
   */
  static async deleteAllRefreshTokensForUser(userId: string): Promise<void> {
    try {
      await database('oauth_token')
        .where({ userId })
        .delete();
    } catch (error) {
      throw getSafeError(error, 'Failed to delete all refresh tokens for user');
    }
  }
}