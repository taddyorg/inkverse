/**
 * Authentication middleware for GraphQL server
 * 
 * Verifies JWT tokens and attaches user data to the request context
 */

import { verifyToken } from '@inkverse/shared-server/utils/authentication';
import type { GraphQLContext } from '../graphql/utils';
import type { User } from '@inkverse/public/graphql/types';

/**
 * Get user data from database by ID
 */
const getUserById = async (userId: string): Promise<User | null> => {
  // TODO: Implement user retrieval from database
  // For now, return a placeholder user
  // In a real implementation, this would query the database
  console.log(`Getting user data for ID: ${userId}`);
  
  // Placeholder implementation
  return {
    id: userId,
    createdAt: Math.floor(Date.now() / 1000),
    email: 'user@example.com',
    username: 'testuser',
    isEmailVerified: true
  } as User;
};

/**
 * Authentication middleware that verifies tokens and attaches user to context
 */
export const createAuthContext = async (req: Request): Promise<GraphQLContext> => {
  try {
    // Try to verify the token
    const tokenPayload = verifyToken({ req });
    
    if (!tokenPayload || !tokenPayload.sub) {
      // No token or invalid token
      return { user: null };
    }
    
    // Valid token, get the user data
    const userId = tokenPayload.sub;
    const user = await getUserById(userId);
    
    // Return context with user data (or null if user not found)
    return { user };
  } catch (error) {
    // Token verification failed
    console.error('Authentication error:', error);
    return { user: null };
  }
};