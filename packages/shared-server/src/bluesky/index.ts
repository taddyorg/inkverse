import path from 'path';
import { fileURLToPath } from "url";
import dotenv from 'dotenv';
import { BlueskyClient } from './client.js';
import type { BlueskyFollower, BlueskyProfile } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '..', '..', '.env');
dotenv.config({ path: envPath });

// Initialize the singleton client with environment variables
let client: BlueskyClient | null = null;

/**
 * Get the Bluesky client instance
 */
function getClient(): BlueskyClient {
  if (!client) {
    const identifier = process.env.BLUESKY_IDENTIFIER || "dmathewwws.com";
    const password = process.env.BLUESKY_APP_PASSWORD;
    
    if (!password) {
      throw new Error("BLUESKY_APP_PASSWORD environment variable is not set");
    }
    
    client = BlueskyClient.getInstance(identifier, password);
  }
  return client;
}

/**
 * Get all followers for a specific Bluesky user
 * @param did - The user DID (e.g., "did:plc:abc123...")
 * @returns Array of all followers
 */
export async function getAllFollowers(did: string): Promise<BlueskyFollower[]> {
  const blueskyClient = getClient();
  return blueskyClient.getAllFollowers(did);
}

/**
 * Get the follower count for a specific Bluesky user
 * @param handle - The user handle (e.g., "example.bsky.social")
 * @returns The total number of followers
 */
export async function getFollowerCount(handle: string): Promise<number> {
  const blueskyClient = getClient();
  return blueskyClient.getFollowerCount(handle);
}

/**
 * Get profile details for a specific Bluesky user
 * @param handle - The user handle (e.g., "example.bsky.social")
 * @returns The user's profile information
 */
export async function getProfile(handle: string): Promise<BlueskyProfile> {
  const blueskyClient = getClient();
  return blueskyClient.getProfile(handle);
}

// Export types
export type { BlueskyFollower, BlueskyAuthTokens, BlueskyProfile } from './types.js';

// Export the client class for advanced usage
export { BlueskyClient } from './client.js';