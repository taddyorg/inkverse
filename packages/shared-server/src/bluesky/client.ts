import axios, { AxiosError } from "axios";
import jwt from "jsonwebtoken";
import { getSafeError } from "../utils/errors.js";
import type { 
  BlueskyAuthTokens, 
  BlueskyFollower, 
  BlueskyFollowsResponse, 
  BlueskyRefreshResponse, 
  BlueskySessionResponse,
  BlueskyProfile 
} from "./types.js";

const BLUESKY_BASE_URL = "https://bsky.social/xrpc";
const TOKEN_REFRESH_BUFFER = 5 * 60; // Refresh 5 minutes before expiration

export class BlueskyClient {
  private static instance: BlueskyClient;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private identifier: string;
  private password: string;

  private constructor(identifier: string, password: string) {
    this.identifier = identifier;
    this.password = password;
  }

  /**
   * Get or create the singleton instance
   */
  public static getInstance(identifier?: string, password?: string): BlueskyClient {
    if (!BlueskyClient.instance) {
      if (!identifier || !password) {
        throw new Error("Identifier and password are required for first initialization");
      }
      BlueskyClient.instance = new BlueskyClient(identifier, password);
    }
    return BlueskyClient.instance;
  }

  /**
   * Check if a JWT token is expired or about to expire
   */
  private isTokenExpired(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as { exp?: number, iat?: number };
      if (!decoded || typeof decoded !== 'object') {
        console.warn('Invalid JWT token structure');
        return true;
      }
      
      if (!decoded.exp) {
        return true;
      }
      
      const now = Math.floor(Date.now() / 1000);
      const expirationTime = decoded.exp - TOKEN_REFRESH_BUFFER;
      
      return now >= expirationTime;
    } catch (error) {
      console.warn('Error decoding JWT token:', error);
      return true;
    }
  }

  /**
   * Create a new session with Bluesky
   */
  private async createSession(): Promise<BlueskyAuthTokens> {
    try {
      const response = await axios.post<BlueskySessionResponse>(
        `${BLUESKY_BASE_URL}/com.atproto.server.createSession`,
        {
          identifier: this.identifier,
          password: this.password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      this.accessToken = response.data.accessJwt;
      this.refreshToken = response.data.refreshJwt;

      return {
        accessJwt: response.data.accessJwt,
        refreshJwt: response.data.refreshJwt,
      };
    } catch (error) {
      if (error instanceof AxiosError) {
        throw getSafeError(
          error,
          `Failed to create Bluesky session: ${error.response?.data?.message || error.message}`
        );
      }
      throw getSafeError(error, "Failed to create Bluesky session");
    }
  }

  /**
   * Refresh the access token using the refresh token
   */
  private async refreshSession(): Promise<BlueskyAuthTokens> {
    if (!this.refreshToken) {
      throw new Error("No refresh token available");
    }

    try {
      const response = await axios.post<BlueskyRefreshResponse>(
        `${BLUESKY_BASE_URL}/com.atproto.server.refreshSession`,
        {},
        {
          headers: {
            Authorization: `Bearer ${this.refreshToken}`,
          },
        }
      );

      this.accessToken = response.data.accessJwt;
      this.refreshToken = response.data.refreshJwt;

      return {
        accessJwt: response.data.accessJwt,
        refreshJwt: response.data.refreshJwt,
      };
    } catch (error) {
      if (error instanceof AxiosError) {
        throw getSafeError(
          error,
          `Failed to refresh Bluesky session: ${error.response?.data?.message || error.message}`
        );
      }
      throw getSafeError(error, "Failed to refresh Bluesky session");
    }
  }

  /**
   * Get a valid access token, refreshing if necessary
   */
  public async getValidAccessToken(): Promise<string> {
    // If no access token, create new session
    if (!this.accessToken || !this.refreshToken) {
      await this.createSession();
      return this.accessToken!;
    }

    // If access token is expired, try to refresh
    if (this.isTokenExpired(this.accessToken)) {
      // Check if refresh token is also expired
      if (this.isTokenExpired(this.refreshToken)) {
        // Both tokens expired, create new session
        await this.createSession();
      } else {
        // Refresh the access token
        await this.refreshSession();
      }
    }

    return this.accessToken!;
  }

  /**
   * Make an authenticated request with automatic token refresh on expiration
   */
  private async makeAuthenticatedRequest<T>(
    method: 'GET' | 'POST',
    url: string,
    data?: any,
    params?: URLSearchParams
  ): Promise<T> {
    let attempt = 0;
    const maxAttempts = 2;

    while (attempt < maxAttempts) {
      try {
        const accessToken = await this.getValidAccessToken();
        
        const config = {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            ...(method === 'POST' && { "Content-Type": "application/json" }),
          },
          ...(params && { params }),
        };

        const response = method === 'GET' 
          ? await axios.get<T>(url, config)
          : await axios.post<T>(url, data, config);

        return response.data;
      } catch (error) {
        if (error instanceof AxiosError) {
          const status = error.response?.status;
          const isTokenError = status === 400 || status === 401;
          
          // If it's a token error and we haven't retried yet, force refresh and try again
          if (isTokenError && attempt === 0) {
            this.accessToken = null;
            this.refreshToken = null;
            attempt++;
            continue;
          }
        }
        throw error;
      }
    }

    throw new Error("Max authentication attempts exceeded");
  }

  /**
   * Get all followers for a specific Bluesky user
   */
  public async getAllFollows(did: string): Promise<BlueskyFollower[]> {
    const followers: BlueskyFollower[] = [];
    let cursor: string | undefined = undefined;

    try {
      while (true) {
        const params = new URLSearchParams({
          actor: did,
          limit: "100",
        });

        if (cursor) {
          params.append("cursor", cursor);
        }

        const response = await this.makeAuthenticatedRequest<BlueskyFollowsResponse>(
          'GET',
          `${BLUESKY_BASE_URL}/app.bsky.graph.getFollows?${params.toString()}`
        );

        followers.push(...response.follows);

        cursor = response.cursor;
        if (!cursor) {
          break;
        }
      }

      return followers;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw getSafeError(
          error,
          `Failed to get followers for ${did}: ${error.response?.data?.message || error.message}`
        );
      }
      throw getSafeError(error, `Failed to get followers for ${did}`);
    }
  }

  /**
   * Get the follower count for a specific Bluesky user
   */
  public async getFollowerCount(handle: string): Promise<number> {
    const followers = await this.getAllFollows(handle);
    return followers.length;
  }

  /**
   * Get profile details for a specific Bluesky user
   */
  public async getProfile(handle: string): Promise<BlueskyProfile> {
    try {
      const params = new URLSearchParams({
        actor: handle,
      });

      const response = await this.makeAuthenticatedRequest<BlueskyProfile>(
        'GET',
        `${BLUESKY_BASE_URL}/app.bsky.actor.getProfile?${params.toString()}`
      );

      return response;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw getSafeError(
          error,
          `Failed to get profile for ${handle}: ${error.response?.data?.message || error.message}`
        );
      }
      throw getSafeError(error, `Failed to get profile for ${handle}`);
    }
  }

  /**
   * Reset the singleton instance (useful for testing or changing credentials)
   */
  public static reset(): void {
    BlueskyClient.instance = null as any;
  }
}