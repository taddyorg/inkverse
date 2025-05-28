// Types for Bluesky API responses

export interface BlueskySessionResponse {
  did: string;
  didDoc: {
    "@context": string[];
    id: string;
    alsoKnownAs: string[];
    verificationMethod: Array<{
      id: string;
      type: string;
      controller: string;
      publicKeyMultibase: string;
    }>;
    service: Array<{
      id: string;
      type: string;
      serviceEndpoint: string;
    }>;
  };
  handle: string;
  email: string;
  emailConfirmed: boolean;
  emailAuthFactor: boolean;
  accessJwt: string;
  refreshJwt: string;
  active: boolean;
}

export interface BlueskyRefreshResponse {
  accessJwt: string;
  refreshJwt: string;
  handle: string;
  did: string;
  didDoc?: BlueskySessionResponse["didDoc"];
  active: boolean;
}

export interface BlueskyFollower {
  did: string;
  handle: string;
  displayName?: string;
  description?: string;
  avatar?: string;
  indexedAt?: string;
  createdAt?: string;
  associated?: {
    lists?: number;
    feedgens?: number;
    starterPacks?: number;
    labeler?: boolean;
    chat?: {
      allowIncoming: string;
    };
  };
  viewer?: {
    muted?: boolean;
    blockedBy?: boolean;
    blocking?: string;
    following?: string;
    followedBy?: string;
  };
  labels?: Array<any>;
}

export interface BlueskyFollowsResponse {
  subject: {
    did: string;
    handle: string;
    displayName?: string;
    description?: string;
    avatar?: string;
    associated?: BlueskyFollower["associated"];
    viewer?: BlueskyFollower["viewer"];
    labels?: Array<any>;
    createdAt?: string;
    indexedAt?: string;
  };
  follows: BlueskyFollower[];
  cursor?: string;
}

export interface BlueskyAuthTokens {
  accessJwt: string;
  refreshJwt: string;
}

export interface BlueskyProfile {
  did: string;
  handle: string;
  displayName?: string;
  description?: string;
  avatar?: string;
  banner?: string;
  followersCount?: number;
  followsCount?: number;
  postsCount?: number;
  associated?: {
    lists?: number;
    feedgens?: number;
    starterPacks?: number;
    labeler?: boolean;
    chat?: {
      allowIncoming: string;
    };
  };
  joinedViaStarterPack?: {
    uri: string;
    cid: string;
    record: any;
    creator: any;
    listItemCount: number;
    joinedWeekCount: number;
    joinedAllTimeCount: number;
    labels: any[];
    indexedAt: string;
  };
  viewer?: {
    muted?: boolean;
    blockedBy?: boolean;
    blocking?: string;
    following?: string;
    followedBy?: string;
    mutedByList?: string;
    blockingByList?: string;
  };
  labels?: Array<any>;
  createdAt?: string;
  indexedAt?: string;
}