import { createToken, verifyToken, refreshAccessToken, refreshRefreshToken } from '@inkverse/shared-server/utils/authentication';
import { AuthenticationError, UserInputError } from './error.js';
import type { UserModel } from '@inkverse/shared-server/database/types';
import { User } from '@inkverse/shared-server/models/index';
import { TokenType } from '@inkverse/public/user';
import { isAValidEmail } from '@inkverse/public/utils';
import { AuthProvider, UserAgeRange, type AuthResponse, type MutationResolvers, type MutationSignUpArgs, type MutationLoginWithEmailArgs, type MutationLoginWithGoogleArgs, type MutationLoginWithAppleArgs } from '@inkverse/public/graphql/types';
import type { GraphQLContext } from 'src/middleware/auth.js';
import { sendEmail } from '@inkverse/shared-server/messaging/email/index';
import { inkverseWebsiteUrl } from '@inkverse/public/utils';

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
    username: String!
    isEmailVerified: Boolean
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
  Register a new user
  """
  signUp(
    email: String!
    username: String!
    provider: AuthProvider!
    providerId: String
    ageRange: UserAgeRange!
    birthYear: Int
  ): AuthResponse!

  """
  Log in an existing user
  """
  loginWithEmail(
    email: String!
  ): Boolean

  """
  Log in with Google
  """
  loginWithGoogle(
    googleId: String!
    googleIdToken: String!
  ): Boolean

  """
  Log in with Apple
  """
  loginWithApple(
    appleId: String!
    appleIdToken: String!
  ): Boolean

  """
  Exchange OTP token for authentication tokens
  """
  exchangeOTPForTokens(
    otp: String!
  ): AuthResponse!

  """
  Exchange refresh token for new access token
  """
  exchangeRefreshForAccessToken(
    refreshToken: String!
  ): String!

  """
  Exchange refresh token for new refresh token
  """
  exchangeRefreshForRefreshToken(
    refreshToken: String!
  ): String!

`;

// Resolvers
export const UserQueries = {
  me: async (_parent: any, _args: any, context: any): Promise<UserModel | null> => {
    if (!context.user) { return null }
    return context.user;
  },
};

export const UserMutations: MutationResolvers = {
  signUp: async (_parent:any, { email, username, provider, providerId, ageRange, birthYear }: MutationSignUpArgs, context: GraphQLContext): Promise<AuthResponse> => {

    // Validate inputs
    if (!email) {
      throw new UserInputError('Email is required');
    }

    // Check if email is valid
    if (!isAValidEmail(email)) {
      throw new UserInputError('Invalid email format');
    }

    // Check for existing user with email
    const existingUser = await User.getUserByEmail(email);
    if (existingUser) {
      throw new UserInputError('Email already in use');
    }

    // Validate age data
    if (ageRange === UserAgeRange.UNDER_18 && !birthYear) {
      throw new UserInputError('Birth year is required for users under 18');
    }

    // Create user input object
    const userData = {
      email,
      username,
      ageRange,
      birthYear,
      googleId: provider === AuthProvider.GOOGLE ? providerId : null,
      appleId: provider === AuthProvider.APPLE ? providerId : null,
    };

    // Create user in database
    const user = await User.createUser(userData);

    // Generate tokens
    const accessToken = createToken({
      user: { id: user.id.toString() },
      type: TokenType.ACCESS
    });

    const refreshToken = createToken({
      user: { id: user.id.toString() },
      type: TokenType.REFRESH
    });

    // Return auth response
    return {
      accessToken,
      refreshToken,
      user
    };
  },

  // Always returns true, so that you can't tell if the email exists or not
  loginWithEmail: async (_parent: any, { email }: MutationLoginWithEmailArgs, context: GraphQLContext): Promise<boolean> => {
    // Find user based on provided credentials
    const user = await User.getUserByEmail(email);
    if (!user) { return true }

    // Generate email verification token
    const userWithOTP = await User.checkOrResetPasswordReset(user);
    if (!userWithOTP) { return true }

    const data = {
      toAddress: email,
      subject: "Taddy Login Link",
      html: `
      <p>Welcome! You are receiving this because you just are trying to login to your Inkverse account.</p>
      <p>Please click on the below link to log into your account.</p>
      <p><a href="${inkverseWebsiteUrl}/reset?token=${userWithOTP.resetPasswordToken}" target="_blank" style="color:#35629b; text-decoration:none;">Log into Inkverse</a></p>
      `
    }

    // Send email verification
    await sendEmail(data);

    return true;
  },

  loginWithGoogle: async (_parent: any, { googleId, googleIdToken }: { googleId: string, googleIdToken: string }, context: GraphQLContext): Promise<boolean> => {
    if (!googleId || !googleIdToken) {
      throw new UserInputError('Google ID and ID token are required');
    }

    try {
      // In a real implementation, we would verify the googleIdToken with Google's OAuth API
      // For example, using Google's OAuth2 library to verify the token
      // const ticket = await client.verifyIdToken({
      //    idToken: googleIdToken,
      //    audience: process.env.GOOGLE_CLIENT_ID
      // });
      // const payload = ticket.getPayload();
      // const verifiedGoogleId = payload.sub; // Google user ID
      //
      // Then we'd compare verifiedGoogleId with the provided googleId
      // if (verifiedGoogleId !== googleId) {
      //   throw new AuthenticationError('Google ID verification failed');
      // }

      // TODO: Implement actual token verification
      // For now, we'll assume the token is valid and proceed with login
      
      // Check if user exists with this Google ID
      const existingUser = await User.getUserByGoogleId(googleId);
      
      if (!existingUser) {
        // User doesn't exist yet, they need to sign up first
        return false;
      }

      // TODO: Return tokens in actual implementation
      // For now, return success
      return true;
    } catch (error) {
      console.error('Google login error:', error);
      throw new AuthenticationError('Failed to login with Google');
    }
  },

  loginWithApple: async (_parent: any, { appleId, appleIdToken }: { appleId: string, appleIdToken: string }, context: GraphQLContext): Promise<boolean> => {
    if (!appleId || !appleIdToken) {
      throw new UserInputError('Apple ID and ID token are required');
    }

    try {
      // In a real implementation, we would verify the appleIdToken with Apple's authentication services
      // Apple uses JWT tokens that need to be verified
      // For example:
      // 1. Get the Apple public key from their JWKS endpoint
      // 2. Use a JWT library to verify the token
      // 3. Check that the token was issued for your app
      // 4. Extract the verified user ID
      //
      // For now, we'll assume the token is valid and proceed with login

      // Check if user exists with this Apple ID
      const existingUser = await User.getUserByAppleId(appleId);
      
      if (!existingUser) {
        // User doesn't exist yet, they need to sign up first
        return false;
      }

      // TODO: Return tokens in actual implementation
      // For now, return success
      return true;
    } catch (error) {
      console.error('Apple login error:', error);
      throw new AuthenticationError('Failed to login with Apple');
    }
  },

  exchangeOTPForTokens: async (_parent: any, { otp }: { otp: string }, context: GraphQLContext): Promise<AuthResponse> => {
    if (!otp) {
      throw new UserInputError('OTP token is required');
    }

    // Find user by OTP token
    const user = await User.getAndVerifyEmailByOTP(otp);
    
    if (!user) {
      throw new AuthenticationError('Invalid or expired OTP token');
    }

    // Generate authentication tokens
    const accessToken = createToken({
      user: { id: user.id.toString() },
      type: TokenType.ACCESS
    });

    const refreshToken = createToken({
      user: { id: user.id.toString() },
      type: TokenType.REFRESH
    });

    // Return auth response
    return {
      accessToken,
      refreshToken,
      user
    };
  },

  exchangeRefreshForAccessToken: async (_parent: any, { refreshToken }: { refreshToken: string }, context: GraphQLContext): Promise<string> => {
    try {
      // Use the utility function to refresh the access token
      return refreshAccessToken(refreshToken);
    } catch (error) {
      // Convert known error types to proper GraphQL errors
      if (error instanceof Error) {
        if (error.message.includes('expired')) {
          throw new AuthenticationError('Refresh token has expired');
        } else if (error.message.includes('invalid')) {
          throw new AuthenticationError('Invalid refresh token');
        }
      }
      // Generic error for unexpected issues
      throw new AuthenticationError('Failed to refresh access token');
    }
  },

  exchangeRefreshForRefreshToken: async (_parent: any, { refreshToken }: { refreshToken: string }, context: GraphQLContext): Promise<string> => {
    try {
      // Use the utility function to refresh the refresh token
      return refreshRefreshToken(refreshToken);
    } catch (error) {
      // Convert known error types to proper GraphQL errors
      if (error instanceof Error) {
        if (error.message.includes('expired')) {
          throw new AuthenticationError('Refresh token has expired');
        } else if (error.message.includes('invalid')) {
          throw new AuthenticationError('Invalid refresh token');
        }
      }
      // Generic error for unexpected issues
      throw new AuthenticationError('Failed to refresh refresh token');
    }
  },

};

export const UserFieldResolvers = {
  User: {

  },
};