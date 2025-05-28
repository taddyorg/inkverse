import { AuthenticationError, UserInputError } from './error.js';
import type { UserModel } from '@inkverse/shared-server/database/types';
import { User, OAuthToken } from '@inkverse/shared-server/models/index';
import { UserAgeRange, type MutationResolvers } from '@inkverse/shared-server/graphql/types';
import { getAllFollows, getProfile, type BlueskyFollower, type BlueskyProfile } from '@inkverse/shared-server/bluesky/index';

// GraphQL Type Definitions
export const UserDefinitions = `
  """
  User Type
  """
  type User {
    id: ID!
    createdAt: Int
    updatedAt: Int
    email: String!
    username: String
    isEmailVerified: Boolean
    ageRange: UserAgeRange
    birthYear: Int
    blueskyDid: String
  }

  """
  Public profile
  """
  type PublicProfile {
    id: ID!
    username: String
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
  Bluesky profile information
  """
  type BlueskyProfile {
    did: ID!
    handle: String!
    displayName: String
    avatar: String
    description: String
  }
`;

// Query and Mutation Definitions
export const UserQueriesDefinitions = `
  """
  Get the current authenticated user
  """
  me: User

  """
  Get Bluesky profile details for a given handle
  """
  getBlueskyProfile(handle: String!): BlueskyProfile

  """
  Get the list of followers for the authenticated user's Bluesky account
  """
  getBlueskyFollowers: [String!]
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
  
`;

// Resolvers
export const UserQueries = {
  me: async (_parent: any, _args: any, context: any): Promise<UserModel | null> => {
    if (!context.user) { return null }
    return context.user;
  },
  
  getBlueskyProfile: async (_parent: any, { handle }: { handle: string }, _context: any): Promise<BlueskyProfile | null> => {
    if (!_context.user) {
      throw new AuthenticationError('You must be logged in to get your Bluesky profile');
    }

    // Validate handle
    if (!handle || handle.trim().length === 0) {
      throw new UserInputError('Bluesky handle cannot be empty');
    }

    // Remove @ if present at the beginning
    const cleanHandle = handle.startsWith('@') ? handle.slice(1) : handle;

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
      throw new UserInputError('Error getting Bluesky profile. Make sure you use your full handle (ex: yourhandle.bsky.social)');
    }
  },

  getBlueskyFollowers: async (_parent: any, _args: any, context: any): Promise<string[]> => {
    // Check if user is authenticated
    if (!context.user) {
      throw new AuthenticationError('You must be logged in to get your Bluesky followers');
    }

    // Check if user has a Bluesky handle
    if (!context.user.blueskyDid) {
      throw new UserInputError('You must set your Bluesky handle first');
    }

    // Get all followers from Bluesky
    const profilesFollowed = await getAllFollows(context.user.blueskyDid);
    return profilesFollowed.map((profileFollowed: BlueskyFollower) => profileFollowed.handle);
  },
};

export const UserMutations: MutationResolvers = {
  updateUserProfile: async (_parent, { username, ageRange, birthYear }, context): Promise<UserModel | null> => {
    // Check if user is authenticated
    if (!context.user) {
      throw new AuthenticationError('You must be logged in to update your profile');
    }

    //If age range is under 18, birth year is required
    if (ageRange === UserAgeRange.UNDER_18 && !birthYear) {
      throw new UserInputError('Birth year is required for users under 18');
    }

    const userData = {
      ...(username && { username: User.sanitizeUsername(username) }),
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
};

export const UserFieldResolvers = {
  User: {
    
  },
};