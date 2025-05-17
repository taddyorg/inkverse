import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import type { TokenPayload } from '@inkverse/public/user';
import { TokenType } from '@inkverse/public/user';
import type { User } from '@inkverse/public/graphql/types';

// Token expiration times
const timeForRefresh = 60 * 60 * 24 * 180; // 180 days for refresh token
const timeForAccess = 60 * 60 * 2; // 2 hours for access token

/**
 * Get expiration time based on token type
 */
function getTimeForType(type: TokenType): number {
	switch (type){
		case TokenType.ACCESS:
			return timeForAccess
		case TokenType.REFRESH:
			return timeForRefresh
		default:
			throw new Error(`Invalid token type: ${type}`)
	}
}

/**
 * Get JWT options for the token type
 */
function getOptionsForTokenType(type: TokenType): { expiresIn: number } {
	const expiresIn = getTimeForType(type)
	return { expiresIn }
}

/**
 * Extract Bearer token from Authorization header
 */
export const extractTokenFromHeader = (header: string | null | undefined): string | undefined => {
	if (!header) { return }
	const [scheme, token] = header.split(" ");

	if (scheme && /^Bearer$/i.test(scheme)) {
		return token;
	}
};

/**
 * Parameters for verifying a token
 */
export type VerifyTokenParams = {
	req?: { headers?: Record<string, string> };
	token?: string;
}

/**
 * Verify a JWT token
 * 
 * @param params - Request object or token string
 * @returns Decoded token payload or undefined if no token
 * @throws Error if token is invalid
 */
export const verifyToken = ({ req, token }: VerifyTokenParams): TokenPayload | undefined => {
	// Get token from request headers or passed parameter
	const tokenToVerify = token || (req ? extractTokenFromHeader(req?.headers?.authorization) : undefined);
	
	if (!tokenToVerify) { return }

	const cert = process.env.PUBLIC_JWT;
	if (!cert) { throw new Error('JWT public key not configured') }

	try {
		const decodedToken = jwt.verify(tokenToVerify, cert, { algorithms: ['RS256'] }) as JwtPayload;

		if (!(decodedToken.exp && decodedToken.iat && decodedToken.sub && decodedToken.tokenType)) { 
			throw new Error('Invalid JWT token format')
		}
	
		return {
			...decodedToken,
			sub: Number(decodedToken.sub),
			tokenType: decodedToken.tokenType as TokenType
		} as TokenPayload
	} catch (error) {
		// Provide more specific error messages
		if (error instanceof jwt.TokenExpiredError) {
			throw new Error('Token has expired')
		} else if (error instanceof jwt.JsonWebTokenError) {
			throw new Error('Invalid token signature')
		}
		throw new Error('Invalid JWT token')
	}
};

/**
 * Parameters for creating a token
 */
export type CreateTokenParams = {
	user: Pick<User, 'id'>; 
	type: TokenType;
	additionalData?: Record<string, any>;
}

/**
 * Create a JWT token
 * 
 * @param params - Parameters for token creation
 * @returns Signed JWT token
 * @throws Error if user is invalid or JWT private key is not configured
 */
export const createToken = ({ user, type, additionalData = {} }: CreateTokenParams): string => {
	if (!(user && user.id)) { throw new Error('Valid user with ID is required')}

	const privateKey = process.env.PRIVATE_JWT;
	if (!privateKey) { throw new Error('JWT private key not configured') }

	const payload = {
		sub: user.id,
		tokenType: type,
		...additionalData
	};

	return jwt.sign(payload, privateKey, { algorithm: 'RS256', ...getOptionsForTokenType(type) });
};

/**
 * Refresh an access token using a valid refresh token
 * 
 * @param refreshToken - Valid refresh token
 * @returns New access token
 * @throws Error if refresh token is invalid
 */
export const refreshAccessToken = (refreshToken: string): string => {
	// Verify the refresh token
	const decodedToken = verifyToken({ token: refreshToken });
	
	if (!decodedToken) {
		throw new Error('Invalid refresh token');
	}
	
	if (decodedToken.tokenType !== TokenType.REFRESH) {
		throw new Error('Token is not a refresh token');
	}
	
	// Create a new access token
	return createToken({ 
		user: { id: decodedToken.sub.toString() },
		type: TokenType.ACCESS
	});
};


/**
 * Refresh an refresh token using a valid refresh token
 * 
 * @param refreshToken - Valid refresh token
 * @returns New refresh token
 * @throws Error if refresh token is invalid
 */
export const refreshRefreshToken = (refreshToken: string): string => {
	// Verify the refresh token
	const decodedToken = verifyToken({ token: refreshToken });
	
	if (!decodedToken) {
		throw new Error('Invalid refresh token');
	}

	if (decodedToken.tokenType !== TokenType.REFRESH) {
		throw new Error('Token is not a refresh token');
	}
	
	// Create a new refresh token
	return createToken({
		user: { id: decodedToken.sub.toString() },
		type: TokenType.REFRESH
	});
};
