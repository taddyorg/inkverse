import express, { Router, type Request, type Response } from 'express';
import { User } from '@inkverse/shared-server/models/index';
import { type UserModel } from '@inkverse/shared-server/database/types';
import { isAValidEmail } from '@inkverse/public/utils';
import { sendEmail } from '@inkverse/shared-server/messaging/email/index';
import { inkverseWebsiteUrl } from '@inkverse/public/utils';
import { createToken, refreshAccessToken, refreshRefreshToken } from '@inkverse/shared-server/utils/authentication';
import { TokenType } from '@inkverse/public/user';

const router = Router();

router.use(express.urlencoded({ extended: false }));
router.use(express.json());

type SafeUser = Pick<UserModel, 'id' | 'isEmailVerified'>; 

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
    const { googleId, googleIdToken } = req.body;

    if (!googleId || !googleIdToken) {
      return res.status(400).json({ error: 'Google ID and ID token are required' });
    }

    // TODO: Implement actual token verification
    // In a real implementation, we would verify the googleIdToken with Google's OAuth API
    // For example, using Google's OAuth2 library to verify the token
    // const ticket = await client.verifyIdToken({
    //    idToken: googleIdToken,
    //    audience: process.env.GOOGLE_CLIENT_ID
    // });
    // const payload = ticket.getPayload();
    // const verifiedGoogleId = payload.sub; // Google user ID
    //
    // Then we'd compare verifiedGoogleId with the provided googleId
    // if (verifiedGoogleId !== googleId) {
    //   throw new AuthenticationError('Google ID verification failed');
    // }

    // TODO: Implement actual token verification
    // For now, we'll assume the token is valid and proceed with login
    
    // Check if user exists with this Google ID
    const existingUser = await User.getUserByGoogleId(googleId);
    
    if (!existingUser) {
      // User doesn't exist yet, they need to sign up first
      return res.status(404).json({ error: 'User not found. Please sign up first.' });
    }

    // TODO: Return tokens in actual implementation
    // For now, return success
    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Google login error:', error);
    return res.status(500).json({ error: 'Failed to login with Google' });
  }
});

// Login with Apple
router.post('/login-with-apple', async (req: Request, res: Response) => {
  try {
    const { appleId, appleIdToken } = req.body;

    if (!appleId || !appleIdToken) {
      return res.status(400).json({ error: 'Apple ID and ID token are required' });
    }

    //TODO: Implement actual token verification
    // In a real implementation, we would verify the appleIdToken with Apple's authentication services
    // Apple uses JWT tokens that need to be verified
    // For example:
    // 1. Get the Apple public key from their JWKS endpoint
    // 2. Use a JWT library to verify the token
    // 3. Check that the token was issued for your app
    // 4. Extract the verified user ID
    //
    // For now, we'll assume the token is valid and proceed with login

    // Check if user exists with this Apple ID
    const existingUser = await User.getUserByAppleId(appleId);
    
    if (!existingUser) {
      // User doesn't exist yet, they need to sign up first
      return res.status(404).json({ error: 'User not found. Please sign up first.' });
    }

    // TODO: Return tokens in actual implementation
    // For now, return success
    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Apple login error:', error);
    return res.status(500).json({ error: 'Failed to login with Apple' });
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
    return res.status(200).json({
      accessToken,
      refreshToken,
      user: user as unknown as SafeUser
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: 'Token exchange failed', details: error?.message || 'Unknown error' });
  }
});

// Refresh Access Token
router.post('/exchange-refresh-token-for-access-token', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Use the utility function to refresh the access token
    const accessToken = await refreshAccessToken(token);
    
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
    const { token } = req.body;
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Use the utility function to refresh the refresh token
    const newRefreshToken = await refreshRefreshToken(token);

    return res.status(200).json({ refreshToken: newRefreshToken });
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
    return res.status(401).json({ error: 'Failed to refresh refresh token' });
  }
});



export default router;