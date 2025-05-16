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