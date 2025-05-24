import { Router } from 'express';
import { exchangeOAuthCodeForAccessAndRefreshTokens } from '@inkverse/shared-server/utils/hosting-providers';
import { User, OAuthToken } from '@inkverse/shared-server/models/index';
import { getSafeError } from '@inkverse/shared-server/utils/errors';
import express from 'express';
import jwt, { type  JwtPayload } from 'jsonwebtoken';

const router = Router();

router.use(express.urlencoded({ extended: false }));
router.use(express.json());

router.get('/:uuid', async (req, res) => {
  try {
    const { code } = req.query;
    const { uuid } = req.params;

    // Validate required parameters
    if (!code || !uuid) {
      return res.redirect('/profile/setup?step=patreon&error=missing_parameters');
    }

    // Exchange OAuth code for refresh and access tokens
    const tokens = await exchangeOAuthCodeForAccessAndRefreshTokens({
      hostingProviderUuid: uuid,
      code: code as string,
    });

    if (!tokens?.refreshToken) {
      return res.redirect('/profile/setup?step=patreon&error=tokens_not_found');
    }
    
    const decodedRefreshToken = jwt.decode(tokens.refreshToken as string) as JwtPayload;
    if (!decodedRefreshToken.sub || !decodedRefreshToken.exp || decodedRefreshToken.exp < Date.now() / 1000) {
      return res.redirect('/profile/setup?step=patreon&error=token_invalid_or_expired');
    }

    // Verify the user exists before saving tokens
    const user = await User.getUserById(decodedRefreshToken.sub);
    if (!user) {
      return res.redirect('/profile/setup?step=patreon&error=user_not_found');
    }

    // Store tokens in database (oauth_token table)
    await OAuthToken.saveOAuthTokensForUser({
      userId: user.id,
      hostingProviderUuid: uuid,
      refreshToken: tokens.refreshToken,
    });

    // Redirect back to client with success
    res.redirect('/profile/setup?step=complete&patreon=connected');
  } catch (error) {
    console.error('OAuth callback error:', getSafeError(error, 'OAuth callback error'));
    // Redirect back to client with error
    res.redirect('/profile/setup?step=patreon&error=connection_failed');
  }
});

export default router;