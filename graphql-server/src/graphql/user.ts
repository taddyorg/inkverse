import { AuthenticationError, UserInputError } from './error.js';
import type { UserModel } from '@inkverse/shared-server/database/types';
import { User } from '@inkverse/shared-server/models/index';
import { UserAgeRange, type MutationResolvers } from '@inkverse/shared-server/graphql/types';

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
    isProfileSetup: Boolean
    ageRange: UserAgeRange
    birthYear: Int
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
  Authentication response with user data
  """
  type AuthResponse {
    accessToken: String!
    refreshToken: String!
    user: User!
  }
`;

// Query and Mutation Definitions
export const UserQueriesDefinitions = `
  """
  Get the current authenticated user
  """
  me: User
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

`;

// Resolvers
export const UserQueries = {
  me: async (_parent: any, _args: any, context: any): Promise<UserModel | null> => {
    if (!context.user) { return null }
    return context.user;
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
      ...(ageRange && { ageRange }),
      ...(birthYear && { birthYear }),
    }

    if (Object.keys(userData).length === 0) {
      throw new UserInputError('No valid fields to update');
    }

    // Update the user profile
    return await User.updateUser(context.user.id, userData);
  },

};

export const UserFieldResolvers = {
  User: {

  },
};