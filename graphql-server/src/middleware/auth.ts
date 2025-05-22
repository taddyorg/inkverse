/**
 * Authentication middleware for GraphQL server
 * 
 * Verifies JWT tokens and attaches user data to the request context
 */
import { verifyToken } from '@inkverse/shared-server/utils/authentication';
import type { User } from '@inkverse/public/graphql/types';
import { User as UserFns } from '@inkverse/shared-server/models/index';

/**
 * GraphQL context type for authentication
 */
export type GraphQLContext = {
  user?: User | null;
}

/**
 * Get user data from database by ID
 */
const getUserById = async (userId: string): Promise<User | null> => {
  try {
    // Use the User model to retrieve user by ID
    const user = await UserFns.getUserById(userId);
    
    if (!user) {
      console.log(`User not found for ID: ${userId}`);
      return null;
    }
    
    // Convert UserModel to GraphQL User type
    return user as unknown as User;
  } catch (error) {
    console.error(`Error retrieving user with ID ${userId}:`, error);
    return null;
  }
};

/**
 * Authentication middleware that verifies tokens and attaches user to context
 */
export const createAuthContext = async (req: Request): Promise<GraphQLContext> => {
  try {
    // Try to verify the token
    const tokenPayload = verifyToken({ headers: req.headers });
    
    if (!tokenPayload || !tokenPayload.sub) {
      // No token or invalid token
      return { user: null };
    }
    
    // Valid token, get the user data
    const userId = tokenPayload.sub.toString();
    const user = await getUserById(userId);
    
    // Return context with user data (or null if user not found)
    return { user };
  } catch (error) {
    // Token verification failed
    console.error('Authentication error:', error);
    return { user: null };
  }
};