/**
 * Authentication utilities for Inkverse
 * 
 * Exports all authentication-related functionality from shared-client
 */

// Re-export everything from storage and token
export * from './storage';
export * from './token';
export * from './apollo-client';

// Default export for convenience
import * as auth from './token';
export default auth;