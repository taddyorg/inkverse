/**
 * Authentication token payload (JWT)
 */

// Token types
export enum TokenType {
  ACCESS = 'access',
  REFRESH = 'refresh'
}

// Token payload
export type TokenPayload = {
  sub: number; // User ID
  tokenType: TokenType;
  exp: number; // Expiration timestamp
  iat: number; // Issued at timestamp
}

export interface UsernameValidationResult {
  isValid: boolean;
  error?: string;
}

// Extract route segments from React Router generated types
function extractReservedRouteSegments(): string[] {
  return [
      "/",
      "/blog",
      "/open-source", 
      "/updates",
      "/brand-kit",
      "/terms-of-service",
      "/comics",
      "/creators",
      "/lists",
      "/tagged",
      "/search",
      "/api",
      "/download-app",
      "/reset",
      "/logout",
      "/hosting-provider",
      "/profile"
  ];
}

export const USERNAME_VALIDATION = {
  MIN_LENGTH: 3,
  MAX_LENGTH: 20,
  PATTERN: /^[a-zA-Z0-9][a-zA-Z0-9_-]*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/,
  
  // Static reserved usernames
  STATIC_RESERVED_USERNAMES: [
    // System/admin usernames
    'admin', 'administrator', 'api', 'app', 'www', 'ftp', 'mail', 
    'email', 'support', 'help', 'info', 'contact', 'news', 'test', 'demo',
    'user', 'users', 'account', 'accounts', 'profile', 'profiles', 'settings',
    'login', 'logout', 'signin', 'signup', 'register', 'auth', 'authentication',
    'root', 'system', 'public', 'private', 'secure', 'security', 'staff',
    'moderator', 'mod', 'null', 'undefined', 'void', 'delete', 'remove',
    
    // App-specific reserved words
    'inkverse',
  ],

  // Get all reserved usernames (static + dynamic routes)
  get RESERVED_USERNAMES(): string[] {
    return [
      ...this.STATIC_RESERVED_USERNAMES,
      ...extractReservedRouteSegments()
    ];
  }
} as const;

export function validateUsername(username: string): UsernameValidationResult {
  if (!username || typeof username !== 'string') {
    return {
      isValid: false,
      error: 'Username is required'
    };
  }

  const trimmedUsername = username.trim();

  if (trimmedUsername.length === 0) {
    return {
      isValid: false,
      error: 'Username cannot be empty'
    };
  }

  if (trimmedUsername.length < USERNAME_VALIDATION.MIN_LENGTH) {
    return {
      isValid: false,
      error: `Username must be at least ${USERNAME_VALIDATION.MIN_LENGTH} characters long`
    };
  }

  if (trimmedUsername.length > USERNAME_VALIDATION.MAX_LENGTH) {
    return {
      isValid: false,
      error: `Username must be no more than ${USERNAME_VALIDATION.MAX_LENGTH} characters long`
    };
  }

  if (!USERNAME_VALIDATION.PATTERN.test(trimmedUsername)) {
    return {
      isValid: false,
      error: 'Username can only contain letters, numbers, underscores, and hyphens. It must start and end with a letter or number.'
    };
  }

  if (USERNAME_VALIDATION.RESERVED_USERNAMES.includes(trimmedUsername.toLowerCase())) {
    return {
      isValid: false,
      error: 'This username is reserved and cannot be used'
    };
  }

  return {
    isValid: true
  };
}

export function sanitizeUsername(inputUsername: string): string {
  // Remove special characters except underscore and hyphen, make lowercase
  const sanitized = inputUsername
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .toLowerCase()
    .trim();
  
  // Enforce max length
  return sanitized.slice(0, USERNAME_VALIDATION.MAX_LENGTH);
}