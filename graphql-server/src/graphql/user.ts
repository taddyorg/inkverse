import axios from 'axios';

import { AuthenticationError, UserInputError } from './error.js';
import type { ComicSeriesModel, UserModel } from '@inkverse/shared-server/database/types';
import { User, OAuthToken, CreatorLink, ComicSeries, UserSeriesSubscription, UserDevice } from '@inkverse/shared-server/models/index';
import { UserAgeRange, type MutationResolvers, LinkType } from '@inkverse/shared-server/graphql/types';
import { getAllFollows, getProfile, type BlueskyFollower, type BlueskyProfile } from '@inkverse/shared-server/bluesky/index';
import { getNewAccessToken, TADDY_HOSTING_PROVIDER_UUID } from '@inkverse/public/hosting-providers';
import { sanitizeUsername, validateUsername } from '@inkverse/public/user';
import { sendEmail } from '@inkverse/shared-server/messaging/email/index';
import { inkverseWebsiteUrl } from '@inkverse/public/utils';
import { isAValidEmail } from '@inkverse/public/utils';
import { purgeCacheOnCdn } from '@inkverse/shared-server/cache/index';
import { createCannySSOToken, getCannySSORedirectUrl } from '@inkverse/shared-server/utils/canny';

// GraphQL Type Definitions
export const UserDefinitions = `
  """
  User Type
  """
  type User {
    id: ID!
    createdAt: Int
    updatedAt: Int
    email: String
    username: String
    isEmailVerified: Boolean
    ageRange: UserAgeRange
    birthYear: Int
    blueskyDid: String
    subscriptions(limitPerPage: Int, page: Int): [ComicSeries]
  }

  """
  Age range buckets for users
  """
  enum UserAgeRange {
    UNDER_18
    AGE_18_24
    AGE_25_34
    AGE_35_PLUS
  }

  """
  Authentication provider types
  """
  enum AuthProvider {
    GOOGLE
    APPLE
    EMAIL
  }

  """
  Profile comic series wrapper for caching
  """
  type ProfileComicSeries {
    "Id of the user"
    userId: ID!
    
    "List of comic series"
    comicSeries: [ComicSeries]
  }

  """
  Bluesky profile information
  """
  type BlueskyProfile {
    did: ID!
    handle: String!
    displayName: String
    avatar: String
    description: String
  }

  """
  Canny SSO redirect response
  """
  type CannySSO {
    userId: ID!
    ssoToken: String!
    redirectUrl: String!
  }
`;

// Query and Mutation Definitions
export const UserQueriesDefinitions = `
  """
  Get the current authenticated user
  """
  me: User

  """
  Get a user by their username
  """
  getUserByUsername(username: String!): User

  """
  Get a user by their ID
  """
  getUserById(id: ID!): User

  """
  Get Bluesky profile details for a given handle
  """
  getBlueskyProfile(handle: String!): BlueskyProfile

  """
  Get all comics from Bluesky creators
  """
  getComicsFromBlueskyCreators: [ComicSeries]

  """
  Get all comics from Patreon creators
  """
  getComicsFromPatreonCreators: [ComicSeries]

  """
  Get the current user's subscribed comics
  """
  getUserSubscribedComics(
    userId: ID!
    limitPerPage: Int
    page: Int
  ): ProfileComicSeries

  """
  Generate Canny SSO redirect URL for the current user
  """
  cannySso: CannySSO
`;

export const UserMutationsDefinitions = `
  """
  Update user profile (username and age)
  """
  updateUserProfile(
    username: String
    ageRange: UserAgeRange
    birthYear: Int
  ): User

  """
  Update user email
  """
  updateUserEmail(email: String!): User

  """
  Resend verification email
  """
  resendVerificationEmail: Boolean!

  """
  Fetch user's OAuth tokens for a specific hosting provider
  """
  fetchRefreshTokenForHostingProvider(
    hostingProviderUuid: String!
  ): String

  """
  Fetch all hosting provider tokens for the user
  """
  fetchAllHostingProviderTokens: [String!]

  """
  Save or update the user's Bluesky handle
  """
  saveBlueskyDid(did: String!): User

  """
  Subscribe to multiple comic series
  """
  subscribeToMultipleComicSeries(seriesUuids: [ID!]!): Boolean!

  """
  Save a push notification token for the user's device
  """
  savePushToken(fcmToken: String!, platform: String!): Boolean!

`;

// Resolvers
export const UserQueries = {
  me: async (_parent: any, _args: any, context: any): Promise<UserModel | null> => {
    if (!context.user) { return null }
    return context.user;
  },

  getUserByUsername: async (_parent: any, { username }: { username: string }, context: any): Promise<UserModel | null> => {
    return await User.getUserByUsername(username);
  },

  getUserById: async (_parent: any, { id }: { id: string }, context: any): Promise<UserModel | null> => {
    return await User.getUserById(id);
  },

  getBlueskyProfile: async (_parent: any, { handle }: { handle: string }, _context: any): Promise<BlueskyProfile | null> => {
    if (!_context.user) {
      throw new AuthenticationError('You must be logged in to get your Bluesky profile');
    }

    // Validate handle
    if (!handle || handle.trim().length === 0) {
      throw new UserInputError('Bluesky handle cannot be empty');
    }

    // Remove bsky.app/profile/ or profile/ or @ if present at the beginning
    let cleanHandle = handle;
    if (cleanHandle.startsWith('bsky.app/profile/')) {
      cleanHandle = cleanHandle.slice(18);
    }
    if (cleanHandle.startsWith('profile/')) {
      cleanHandle = cleanHandle.slice(8);
    }
    if (cleanHandle.startsWith('@')) {
      cleanHandle = cleanHandle.slice(1);
    }

    try {
      // Get profile from Bluesky API
      const profile = await getProfile(cleanHandle);
      
      // Return only the requested fields
      return {
        did: profile.did,
        handle: profile.handle,
        displayName: profile.displayName || undefined,
        avatar: profile.avatar || undefined,
        description: profile.description || undefined,
      };
    } catch (error: any) {
      console.error('Error getting Bluesky profile:', error?.response?.data?.message);
      throw new UserInputError('Error getting Bluesky profile. Make sure you use your handle (ex: bsky.app/profile/yourhandle)');
    }
  },

  getComicsFromBlueskyCreators: async (_parent: any, _args: any, context: any): Promise<ComicSeriesModel[]> => {
    if (!context.user) {
      throw new AuthenticationError('You must be logged in to get comics from Bluesky creators');
    }

    // Check if user has a Bluesky handle
    if (!context.user.blueskyDid) {
      throw new UserInputError('You must set your Bluesky handle first');
    }

    // Get all followers from Bluesky
    const profilesFollowed = await getAllFollows(context.user.blueskyDid);
    const handles = profilesFollowed.map((profileFollowed: BlueskyFollower) => profileFollowed.handle);

    // Get all comics from the creators
    const creatorUuids = await CreatorLink.getCreatorLinksByTypeAndValue(LinkType.BLUESKY, handles);
    return await ComicSeries.getComicsFromCreatorUuids(creatorUuids);
  },

  getComicsFromPatreonCreators: async (_parent: any, _args: any, context: any): Promise<ComicSeriesModel[]> => {
    if (!context.user) {
      throw new AuthenticationError('You must be logged in to get comics from Patreon creators');
    }

    // get taddy refresh token
    const refreshToken = await OAuthToken.getRefreshToken(context.user.id, TADDY_HOSTING_PROVIDER_UUID);
    if (!refreshToken) {
      throw new UserInputError('You must have a Taddy token to find comics from Patreon creators');
    }

    const accessToken = await getNewAccessToken({
      hostingProviderUuid: TADDY_HOSTING_PROVIDER_UUID,
      refreshToken,
    });

    const response = await axios.post('https://taddy.org/auth/patreon/following', {
      token: accessToken,
    });

    const data = response.data;
    
    // Extract Patreon creator usernames from the response
    const patreonIdentifiers = data.following?.map((creator: { username: string }) => creator.username) || [];
    
    if (!patreonIdentifiers || patreonIdentifiers.length === 0) {
      return [];
    }

    // Get creator UUIDs from CreatorLink based on Patreon identifiers
    const creatorUuids = await CreatorLink.getCreatorLinksByTypeAndValue(
      LinkType.PATREON,
      patreonIdentifiers
    );

    // Use the same method as Bluesky to get comics
    return await ComicSeries.getComicsFromCreatorUuids(creatorUuids);
  },

  getUserSubscribedComics: async (_parent: any, { userId, limitPerPage = 20, page = 1 }: { userId: string; limitPerPage?: number | null; page?: number | null }, context: any): Promise<{ userId: string; comicSeries: ComicSeriesModel[] | null }> => {
    try {
      const actualLimitPerPage = limitPerPage ?? 20;
      const actualPage = page ?? 1;

      if (actualLimitPerPage > 1000) {
        throw new UserInputError('Limit per page cannot be greater than 1000');
      }

      const offset = Math.max(0, (actualPage - 1) * actualLimitPerPage);

      // Get user subscriptions
      const subscriptions = await UserSeriesSubscription.getUserSubscriptions(Number(userId), actualLimitPerPage, offset);
      
      if (!subscriptions || subscriptions.length === 0) {
        return {
          userId,
          comicSeries: []
        };
      }

      // Extract series UUIDs from subscriptions
      const seriesUuids = subscriptions.map(sub => sub.seriesUuid);

      // Get the comic series details
      const comicSeries = await ComicSeries.getComicSeriesByUuids(seriesUuids);
      const comicSeriesObject: Record<string, ComicSeriesModel> = comicSeries.reduce((acc: Record<string, ComicSeriesModel>, series: ComicSeriesModel) => { 
        acc[series.uuid] = series;
        return acc;
      }, {});
      
      const orderedComicSeries = seriesUuids.map(uuid => comicSeriesObject[uuid]).filter(Boolean) as ComicSeriesModel[];
      
      return {
        userId,
        comicSeries: orderedComicSeries
      };
    } catch (error) {
      console.error('Error getting user subscribed comics:', error);
      throw new Error('Failed to get subscribed comics');
    }
  },

  cannySso: async (_parent: any, _args: any, context: any): Promise<{ userId: string; ssoToken: string; redirectUrl: string }> => {
    if (!context.user) {
      throw new AuthenticationError('You must be logged in to access Canny SSO');
    }

    try {
      // Create SSO token using the shared utility
      const ssoToken = createCannySSOToken({
        id: context.user.id,
        email: context.user.email,
        username: context.user.username,
        name: context.user.name
      });

      // Get the redirect URL
      const redirectUrl = getCannySSORedirectUrl(ssoToken);

      return { userId: context.user.id, ssoToken, redirectUrl };
    } catch (error: any) {
      console.error('Error generating Canny SSO:', error);
      throw new Error(error.message || 'Failed to generate Canny SSO redirect');
    }
  },
};

export const UserMutations: MutationResolvers = {
  updateUserProfile: async (_parent, { username, ageRange, birthYear }, context): Promise<UserModel | null> => {
    // Check if user is authenticated
    if (!context.user) {
      throw new AuthenticationError('You must be logged in to update your profile');
    }

    // Validate username if provided
    if (username) {
      const validation = validateUsername(username);
      if (!validation.isValid) {
        throw new UserInputError(validation.error || 'Invalid username');
      }

      // Check if username is already taken by another user
      const existingUser = await User.getUserByUsername(username);
      if (existingUser && existingUser.id !== context.user.id) {
        throw new UserInputError('This username is already taken');
      }
    }

    //If age range is under 18, birth year is required
    if (ageRange === UserAgeRange.UNDER_18 && !birthYear) {
      throw new UserInputError('Birth year is required for users under 18');
    }

    const userData = {
      ...(username && { username: sanitizeUsername(username) }),
      ...(ageRange && { ageRange, birthYear: ageRange === UserAgeRange.UNDER_18 ? birthYear : null }),
    }

    if (Object.keys(userData).length === 0) {
      throw new UserInputError('No valid fields to update');
    }

    // Update the user profile
    return await User.updateUser(context.user.id, userData);
  },

  fetchRefreshTokenForHostingProvider: async (_parent: any, { hostingProviderUuid }: { hostingProviderUuid: string }, context: any): Promise<string | null> => {
    // Check if user is authenticated
    if (!context.user) {
      throw new AuthenticationError('You must be logged in to fetch tokens');
    }

    // Validate hostingProviderUuid
    if (!hostingProviderUuid) {
      throw new UserInputError('Hosting provider UUID is required');
    }

    return await OAuthToken.getRefreshToken(context.user.id, hostingProviderUuid);
    
  },

  fetchAllHostingProviderTokens: async (_parent: any, _args: any, context: any): Promise<string[] | null> => {
    if (!context.user) {
      throw new AuthenticationError('You must be logged in to fetch tokens');
    }
    return await OAuthToken.getAllRefreshTokensForUser(context.user.id);
  },

  saveBlueskyDid: async (_parent: any, { did }: { did: string }, context: any): Promise<UserModel | null> => {
    // Check if user is authenticated
    if (!context.user) {
      throw new AuthenticationError('You must be logged in to save your Bluesky DID');
    }

    // Update the user's Bluesky DID
    return await User.updateUser(context.user.id, { blueskyDid: did });
  },

  subscribeToMultipleComicSeries: async (_parent: any, { seriesUuids }: { seriesUuids: string[] }, context: any): Promise<boolean> => {
    if (!context.user) {
      throw new AuthenticationError('You must be logged in to subscribe to series');
    }

    if (!seriesUuids || seriesUuids.length === 0) {
      throw new UserInputError('At least one series UUID is required');
    }

    // Filter out null/undefined values and duplicate UUIDs
    const uniqueSeriesUuids = [...new Set(seriesUuids.filter(Boolean))];

    try {
      // Subscribe to all series
      const results = await Promise.allSettled(
        uniqueSeriesUuids.map(seriesUuid => 
          UserSeriesSubscription.subscribeToComicSeries(Number(context.user.id), seriesUuid)
        )
      );

      await purgeCacheOnCdn({ type: 'profilecomicseries', id: String(context.user.id), shortUrl: context.user.username });

      // Return true if at least one subscription succeeded
      return results.some(result => result.status === 'fulfilled' && result.value);
    } catch (error) {
      console.error('Error subscribing to multiple comic series:', error);
      throw new Error('Failed to subscribe to comic series');
    }
  },

  updateUserEmail: async (_parent: any, { email }: { email: string }, context: any): Promise<UserModel | null> => {
    if (!context.user) {
      throw new AuthenticationError('You must be logged in to update your email');
    }

    if (!isAValidEmail(email)) {
      throw new UserInputError('Invalid email format');
    }

    // Check if email is already taken by another user
    const existingUser = await User.getUserByEmail(email);
    if (existingUser && existingUser.id !== context.user.id) {
      throw new UserInputError('This email is already taken');
    }

    // Update the user's email
    const updatedUser = await User.updateUserEmail(context.user, email);
    
    if (!updatedUser) {
      throw new Error('Failed to update email');
    }

    // Send verification email to the new email address
    const data = {
      toAddress: email,
      subject: "Confirm your email address for Inkverse",
      html: `
      <p>Click the link below to confirm your email address.</p>
      <p><a href="${inkverseWebsiteUrl}/reset?token=${updatedUser.resetPasswordToken}" target="_blank" style="color:#35629b; text-decoration:none;">Confirm your email address</a></p>
      `
    };

    await sendEmail(data);

    return updatedUser;
  },

  resendVerificationEmail: async (_parent: any, _args: any, context: any): Promise<boolean> => {
    if (!context.user) {
      throw new AuthenticationError('You must be logged in to resend a verification email');
    }

    const updatedUser = await User.updateUserEmail(context.user);
    if (!updatedUser) {
      throw new Error('Failed to to user for email verification');
    }

    // Send verification email to the new email address
    const data = {
      toAddress: updatedUser.email,
      subject: "Confirm your email address for Inkverse",
      html: `
      <p>Click the link below to confirm your email address.</p>
      <p><a href="${inkverseWebsiteUrl}/reset?token=${updatedUser.resetPasswordToken}" target="_blank" style="color:#35629b; text-decoration:none;">Confirm your email address</a></p>
      `
    };

    await sendEmail(data);

    return true;
  },

  savePushToken: async (_parent: any, { fcmToken, platform }: { fcmToken: string, platform: string }, context: any): Promise<boolean> => {
    if (!context.user) {
      throw new AuthenticationError('You must be logged in to save a push token');
    }

    if (!fcmToken || !platform) {
      throw new UserInputError('FCM token and platform are required');
    }

    try {
      await UserDevice.savePushToken(context.user.id, fcmToken, platform);
      return true;
    } catch (error) {
      console.error('Error saving push token:', error);
      throw new Error('Failed to save push token');
    }
  },
};

export const UserFieldResolvers = {
  User: {
    createdAt: (user: UserModel, _args: any, context: any) => {
      if (!context.user || context.user.id !== user.id) { return null; }
      return user.createdAt || null;
    },
    updatedAt: (user: UserModel, _args: any, context: any) => {
      if (!context.user || context.user.id !== user.id) { return null; }
      return user.updatedAt || null;
    },
    email: (user: UserModel, _args: any, context: any) => {
      if (!context.user || context.user.id !== user.id) { return null; }
      return user.email || null;
    },
    isEmailVerified: (user: UserModel, _args: any, context: any) => {
      if (!context.user || context.user.id !== user.id) { return null; }
      return user.isEmailVerified || null;
    },
    ageRange: (user: UserModel, _args: any, context: any) => {
      if (!context.user || context.user.id !== user.id) { return null; }
      return user.ageRange || null;
    },
    birthYear: (user: UserModel, _args: any, context: any) => {
      if (!context.user || context.user.id !== user.id) { return null; }
      return user.birthYear || null;
    },
    blueskyDid: (user: UserModel, _args: any, context: any) => {
      if (!context.user || context.user.id !== user.id) { return null; }
      return user.blueskyDid || null;
    },
  },
};