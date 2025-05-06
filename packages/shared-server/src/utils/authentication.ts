import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";

const timeForExchange = 60 * 60 * 24 * 180;
const timeForAccess = 60 * 60 * 2;

function getTokenTypeFromTimeDifference(timeDifference: number): string {
	switch (timeDifference){
		case timeForExchange:
			return 'exchange'
		default:
			return 'access'
	}
}

function getTimeForType(type: string): number {
	switch (type){
		case 'access':
			return timeForAccess
		case 'exchange':
			return timeForExchange
		default:
			throw new Error('You need to pass in a valid getTimeForType type')
	}
}

function getOptionsForTokenType(type: string): { expiresIn: number } {
	const expiresIn = getTimeForType(type)

	switch (type){
		case 'access':
		case 'exchange':
			return { expiresIn }
		default:
			throw new Error('You need to pass in a valid getOptionsForTokenType type')
	}
}

const extractTokenFromHeader = (header: string | null): string | undefined => {
	if (!header) { return }
	const [scheme, token] = header.split(" ");

	if (scheme && /^Bearer$/i.test(scheme)) {
		return token;
	}
};

type VerifyTokenParams = {
	req: Request;
	passedInToken: string;
}

type VerifyTokenResponse = JwtPayload & {
	sub: string;
	tokenType: string;
}

// OUTCOMES:
// returns null (no auth need + no user returned)
// Throws error (if bad or expired token)
// Sets + returns the user
export const verifyToken = ({ req, passedInToken }: VerifyTokenParams): VerifyTokenResponse | undefined => {
	const token = passedInToken || extractTokenFromHeader(req.headers.get('authorization'));
	
	if (!token) { return }

	const cert = process.env.PUBLIC_JWT;

	if (!cert) { throw new Error('JWT File not setup') }

	try{
		const decodedToken = jwt.verify(token, cert, { algorithms: ['RS256'] }) as JwtPayload;

		if (!(decodedToken.exp && decodedToken.iat && decodedToken.sub)) { 
			throw new Error('Invalid JWT Token')
		}
	
		return {
			...decodedToken,
			tokenType: getTokenTypeFromTimeDifference(decodedToken.exp - decodedToken.iat)
		} as VerifyTokenResponse
	} catch (error){
		throw new Error('Invalid JWT Token')
	}
};

// OUTCOMES:
// Throws error (if could not sign token)
// returns token for
export const createToken = ({ user, type }: { user: any, type: string }) => {
	if (!(user && user.id)) { throw new Error('Need to pass user details')}

	const privateKey = process.env.PRIVATE_JWT;

	if (!privateKey) { throw new Error('JWT File not setup') }

	const playload = {
		sub: user.id
	};

	return jwt.sign(playload, privateKey, { algorithm: 'RS256', ...getOptionsForTokenType(type) });
};