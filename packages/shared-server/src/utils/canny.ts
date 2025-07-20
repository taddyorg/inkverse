import jwt from 'jsonwebtoken';
import type { UserModel } from '../database/types.js';

/**
 * Canny SSO user data interface
 */
interface CannySSOUserData {
  avatarURL?: string;
  email: string;
  id: string;
  name: string;
}

/**
 * Create a Canny SSO token for the given user
 * 
 * @param user - User object from database
 * @returns Signed JWT token for Canny SSO
 * @throws Error if CANNY_SSO_PRIVATE_KEY is not configured
 */
export function createCannySSOToken(user: Pick<UserModel, 'id' | 'email' | 'username' | 'name'>): string {
  const privateKey = process.env.CANNY_SSO_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('CANNY_SSO_PRIVATE_KEY not configured');
  }

  // Prepare user data for Canny
  // Use username as display name if name is not available
  const userData: CannySSOUserData = {
    email: user.email,
    id: user.id.toString(),
    name: user.name || user.username || 'Anonymous User',
  };

  // Sign the token with HS256 algorithm as required by Canny
  return jwt.sign(userData, privateKey, { algorithm: 'HS256' });
}

/**
 * Generate Canny SSO redirect URL
 * 
 * @param ssoToken - The SSO token generated for the user
 * @param redirectPath - Optional path to redirect to after SSO (defaults to root)
 * @returns Complete Canny SSO redirect URL
 * @throws Error if CANNY_COMPANY_ID is not configured
 */
export function getCannySSORedirectUrl(ssoToken: string, redirectPath?: string): string {
  const companyId = process.env.CANNY_COMPANY_ID;
  if (!companyId) {
    throw new Error('CANNY_COMPANY_ID not configured');
  }

  // Build redirect URL - if no path provided, redirect to main Canny page
  const redirect = redirectPath 
    ? `https://inkverse.canny.io${redirectPath}` 
    : 'https://inkverse.canny.io';

  // Construct the Canny SSO URL with required parameters
  const params = new URLSearchParams({
    companyID: companyId,
    ssoToken: ssoToken,
    redirect: redirect
  });

  return `https://canny.io/api/redirects/sso?${params.toString()}`;
}