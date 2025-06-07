import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '..', '..', '.env');
dotenv.config({ path: envPath });

import express, { Router, type Request, type Response } from 'express';
import cookieParser from 'cookie-parser';
import { User } from '@inkverse/shared-server/models/index';
import { type UserModel } from '@inkverse/shared-server/database/types';
import { isAValidEmail } from '@inkverse/public/utils';
import { sendEmail } from '@inkverse/shared-server/messaging/email/index';
import { inkverseWebsiteUrl } from '@inkverse/public/utils';
import { createToken, refreshAccessToken, refreshRefreshToken } from '@inkverse/shared-server/utils/authentication';
import { TokenType } from '@inkverse/public/user';
import { OAuth2Client } from 'google-auth-library';
import { addContactToList } from '@inkverse/shared-server/messaging/email/octopus';
import * as AppleSignin from 'apple-signin-auth';

const router = Router();

// Helper function to extract refresh token from cookie
function getRefreshTokenFromCookie(cookies: any): string | null {
  return cookies?.['inkverse-refresh-token'] || null;
}

// Initialize Google OAuth client
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Apple Sign-In credentials
const APPLE_CLIENT_ID = process.env.APPLE_CLIENT_ID;

// Cookie options for refresh token
const REFRESH_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 180 * 24 * 60 * 60 * 1000, // 180 days
  path: '/'
};

type SafeUser = Pick<UserModel, 'id' | 'isEmailVerified' | 'username'>;
const userModelToSafeUser = (user: UserModel): SafeUser => ({
  id: user.id,
  isEmailVerified: user.isEmailVerified,
  username: user.username
});

router.use(cookieParser());
router.use(express.urlencoded({ extended: false }));
router.use(express.json());

// Login with Email
router.post('/login-with-email', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email || !isAValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    const user = await User.getUserByEmail(email);
    
    if (user) {
      // Existing user - generate login token
      const userWithOTP = await User.checkOrResetPasswordReset(user);
      if (!userWithOTP) {
        return res.status(500).json({ error: 'Failed to generate OTP' });
      }

      const data = {
        toAddress: email,
        subject: "Inkverse Login Link",
        html: `
        <p>Click the link below to log into your Inkverse account.</p>
        <p><a href="${inkverseWebsiteUrl}/reset?token=${userWithOTP.resetPasswordToken}" target="_blank" style="color:#35629b; text-decoration:none;">Log into Inkverse</a></p>
        `
      };

      await sendEmail(data);
    } else {
      // New user - create account with just email
      const newUser = await User.createUser({ email });

      // Generate token for new user
      const userWithOTP = await User.checkOrResetPasswordReset(newUser);
      if (!userWithOTP) {
        return res.status(500).json({ error: 'Failed to generate OTP' });
      }

      const data = {
        toAddress: email,
        subject: "Welcome to Inkverse - Complete Your Sign Up",
        html: `
        <p>Click the link below to log into your Inkverse account.</p>
        <p><a href="${inkverseWebsiteUrl}/reset?token=${userWithOTP.resetPasswordToken}" target="_blank" style="color:#35629b; text-decoration:none;">Log into Inkverse</a></p>
        `
      };

      await sendEmail(data);
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: 'Authentication failed', details: error.message });
  }
});

// Login with Google
router.post('/login-with-google', async (req: Request, res: Response) => {
  try {
    const { googleIdToken } = req.body;

    if (!googleIdToken) {
      return res.status(400).json({ error: 'Google ID token is required' });
    }

    if (!GOOGLE_CLIENT_ID) {
      return res.status(500).json({ error: 'Server configuration error: Missing Google Client ID' });
    }

    // Verify the Google ID token with Google's OAuth API
    const ticket = await googleClient.verifyIdToken({
      idToken: googleIdToken,
      audience: GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(401).json({ error: 'Invalid Google token: empty payload' });
    }

    // Verify required fields
    if (!payload.sub) {
      return res.status(401).json({ error: 'Invalid Google token: missing user ID' });
    }
    
    if (!payload.email) {
      return res.status(401).json({ error: 'Invalid Google token: missing email' });
    }
    
    // Verify token issuer is Google
    if (payload.iss !== 'accounts.google.com' && payload.iss !== 'https://accounts.google.com') {
      return res.status(401).json({ error: 'Invalid Google token: incorrect issuer' });
    }
    
    // Extract user information from verified token
    const googleId = payload.sub; // Google user ID
    const email = payload.email; // User's email from Google
    const isEmailVerified = payload.email_verified || false;
        
    // Check if user exists with this Google ID
    const alreadyGoogleUser = await User.getUserByGoogleId(googleId);

    if (alreadyGoogleUser) {
      // User exists, generate tokens
      const accessToken = createToken({
        user: { id: alreadyGoogleUser.id },
        type: TokenType.ACCESS
      });

      const refreshToken = createToken({
        user: { id: alreadyGoogleUser.id },
        type: TokenType.REFRESH
      });

      if (!alreadyGoogleUser.isEmailVerified && isEmailVerified) {
        await User.updateUser(alreadyGoogleUser.id, { isEmailVerified: isEmailVerified });
        await addContactToList('signup', { email: alreadyGoogleUser.email });
      }

      // Set the refresh token cookie as plain string
      res.cookie('inkverse-refresh-token', refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

      return res.status(200).json({
        accessToken,
        refreshToken,
        user: userModelToSafeUser(alreadyGoogleUser)
      });
    }
    
    // Check if a user with this email exists
    const alreadyEmailUser = await User.getUserByEmail(email);
    
    if (alreadyEmailUser) {
      // Link Google ID to existing user account
      const updatedUser = await User.updateUser(alreadyEmailUser.id, 
        { 
          googleId,
          ...(isEmailVerified && { isEmailVerified })
        });

      if (updatedUser && isEmailVerified) {
        await addContactToList('signup', { email: alreadyEmailUser.email });
      }

      if (!updatedUser) {
        return res.status(500).json({ error: 'Failed to link Google account' });
      }
      
      // User exists and linked, generate tokens
      const accessToken = createToken({
        user: { id: updatedUser.id },
        type: TokenType.ACCESS
      });

      const refreshToken = createToken({
        user: { id: updatedUser.id },
        type: TokenType.REFRESH
      });

      res.cookie('inkverse-refresh-token', refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

      return res.status(200).json({
        accessToken,
        refreshToken,
        user: userModelToSafeUser(updatedUser)
      });
    }
    
    // User doesn't exist, create a new one
    const newUser = await User.createUser({
      email,
      googleId,
      isEmailVerified, // Use email verification status from Google token
    });

    if (newUser && isEmailVerified) {
      await addContactToList('signup', { email: newUser.email });
    }
    
    const accessToken = createToken({
      user: { id: newUser.id },
      type: TokenType.ACCESS
    });

    const refreshToken = createToken({
      user: { id: newUser.id },
      type: TokenType.REFRESH
    });

    res.cookie('inkverse-refresh-token', refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

    return res.status(200).json({
      accessToken,
      refreshToken,
      user: userModelToSafeUser(newUser)
    });

  } catch (error: any) {
    console.error('Google login error:', error);
    
    // Provide specific error messages for token verification failures
    if (error.message && error.message.includes('Token used too late')) {
      return res.status(401).json({ error: 'Expired Google token' });
    }
    
    if (error.message && error.message.includes('Invalid token signature')) {
      return res.status(401).json({ error: 'Invalid Google token signature' });
    }
    
    if (error.message && error.message.includes('Wrong number of segments')) {
      return res.status(401).json({ error: 'Malformed Google token' });
    }
    
    if (error.message && error.message.includes('audience mismatch')) {
      return res.status(401).json({ error: 'Google token was not issued for this application' });
    }
    
    return res.status(500).json({ error: 'Failed to login with Google', details: error?.message || 'Unknown error' });
  }
});

// Apple Sign-In Callback
router.post('/login-with-apple', async (req: Request, res: Response) => {
  try {
    const { code, id_token } = req.body;
    
    if (!id_token) {
      return res.status(400).json({ error: 'ID token is required' });
    }
    
    if (!APPLE_CLIENT_ID) {
      return res.status(500).json({ error: 'Server configuration error: Missing Apple Client ID' });
    }

    // Verify the Apple ID token
    // This will fetch Apple's public keys and verify the token signature
    const appleIdTokenClaims = await AppleSignin.verifyIdToken(id_token, {
      audience: APPLE_CLIENT_ID, // Client ID - validation
    });

    // Extract user information from verified token
    const appleUserId = appleIdTokenClaims.sub; // Apple user ID
    let email = appleIdTokenClaims.email;
    const isEmailVerified = !!appleIdTokenClaims.email_verified;

    if (!appleUserId) {
      return res.status(401).json({ error: 'Invalid Apple ID token: missing user ID' });
    }

    // Check if user exists with this Apple ID
    let user = await User.getUserByAppleId(appleUserId);
    
    // For subsequent sign-ins, Apple doesn't include email in the token
    // Use the email from our database if available
    if (!email && user && user.email) {
      email = user.email;
    }
    
    if (user) {
      // User exists, generate tokens
      const accessToken = createToken({
        user: { id: user.id },
        type: TokenType.ACCESS
      });

      const refreshToken = createToken({
        user: { id: user.id },
        type: TokenType.REFRESH
      });

      if (!user.isEmailVerified && isEmailVerified && email) {
        await User.updateUser(user.id, { isEmailVerified });
        await addContactToList('signup', { email });
      }

      res.cookie('inkverse-refresh-token', refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

      return res.status(200).json({
        accessToken,
        refreshToken,
        user: userModelToSafeUser(user)
      });
    }
    
    // If we don't have an email at this point, we can't proceed with new user creation
    if (!email) {
      return res.status(401).json({ error: 'Email is required for new account creation' });
    }
    
    // Check if a user with this email exists
    const existingUser = await User.getUserByEmail(email);
    
    if (existingUser) {
      // Link Apple ID to existing user account
      const updatedUser = await User.updateUser(existingUser.id, { 
        appleId: appleUserId,
        ...(isEmailVerified && { isEmailVerified })
      });

      if (updatedUser && isEmailVerified) {
        await addContactToList('signup', { email });
      }

      if (!updatedUser) {
        return res.status(500).json({ error: 'Failed to link Apple account' });
      }
      
      // User exists and linked, generate tokens
      const accessToken = createToken({
        user: { id: updatedUser.id },
        type: TokenType.ACCESS
      });

      const refreshToken = createToken({
        user: { id: updatedUser.id },
        type: TokenType.REFRESH
      });

      res.cookie('inkverse-refresh-token', refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

      return res.status(200).json({
        accessToken,
        refreshToken,
        user: userModelToSafeUser(updatedUser)
      });
    }
    
    // User doesn't exist, create a new one
    const newUser = await User.createUser({
      email,
      appleId: appleUserId,
      isEmailVerified,
    });

    if (newUser && isEmailVerified) {
      await addContactToList('signup', { email });
    }
    
    const accessToken = createToken({
      user: { id: newUser.id },
      type: TokenType.ACCESS
    });

    const refreshToken = createToken({
      user: { id: newUser.id },
      type: TokenType.REFRESH
    });

    res.cookie('inkverse-refresh-token', refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

    return res.status(200).json({
      accessToken,
      refreshToken,
      user: userModelToSafeUser(newUser)
    });
    
  } catch (error: any) {
    console.error('Apple login error:', error);
    
    // Provide specific error messages for token verification failures
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid Apple ID token: ' + error.message });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Expired Apple ID token' });
    }
    
    return res.status(500).json({ error: 'Failed to login with Apple', details: error.message });
  }
});

// Exchange OTP for Tokens
router.post('/exchange-otp', async (req: Request, res: Response) => {
  try {
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ error: 'OTP token is required' });
    }

    // Find user by OTP token and verify email
    const user = await User.getAndVerifyEmailByOTP(otp);

    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired OTP token' });
    }

    // Generate authentication tokens
    const accessToken = createToken({
      user: { id: user.id.toString() },
      type: TokenType.ACCESS
    });

    const refreshToken = createToken({
      user: { id: user.id.toString() },
      type: TokenType.REFRESH
    });

    // Return auth response
    res.cookie('inkverse-refresh-token', refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

    return res.status(200).json({
      accessToken,
      refreshToken,
      user: userModelToSafeUser(user)
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: 'Token exchange failed', details: error?.message || 'Unknown error' });
  }
});

// Refresh Access Token
router.post('/exchange-refresh-token-for-access-token', async (req: Request, res: Response) => {
  try {
    // Check for token in body or cookie
    const { token } = req.body;
    const cookieToken = getRefreshTokenFromCookie(req.cookies);
    const refreshToken = token || cookieToken;
    
    if (!refreshToken) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Use the utility function to refresh the access token
    const accessToken = await refreshAccessToken(refreshToken);
    
    return res.status(200).json({ accessToken });
  } catch (error: any) {
    // Convert known error types to proper errors
    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        return res.status(401).json({ error: 'Refresh token has expired' });
      } else if (error.message.includes('invalid')) {
        return res.status(401).json({ error: 'Invalid refresh token' });
      }
    }
    // Generic error for unexpected issues
    return res.status(401).json({ error: 'Failed to refresh access token' });
  }
});

// Refresh Refresh Token
router.post('/exchange-refresh-token-for-refresh-token', async (req: Request, res: Response) => {
  try {
    // Check for token in body or cookie
    const { token } = req.body;
    const cookieToken = getRefreshTokenFromCookie(req.cookies);
    const refreshToken = token || cookieToken;
    
    if (!refreshToken) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Use the utility function to refresh the refresh token
    const newRefreshToken = await refreshRefreshToken(refreshToken);

    if (!newRefreshToken) {
      return res.status(401).json({ error: 'No new refresh token' });
    }

    // Set the new refresh token as cookie
    res.cookie('inkverse-refresh-token', newRefreshToken, REFRESH_TOKEN_COOKIE_OPTIONS)

    return res.status(200).json({ refreshToken: newRefreshToken });
  } catch (error: any) {
    console.log('error', error);
    // Convert known error types to proper errors
    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        return res.status(401).json({ error: 'Refresh token has expired' });
      } else if (error.message.includes('invalid')) {
        return res.status(401).json({ error: 'Invalid refresh token' });
      }
    }
    // Generic error for unexpected issues
    return res.status(401).json({ error: 'Failed to refresh refresh token' });
  }
});

export default router;