import { Router } from 'express';
import { providerDetails } from '@inkverse/public/hosting-providers';
import { exchangeOAuthCodeForAccessAndRefreshTokens } from '@inkverse/shared-server/utils/hosting-providers';
import { User, OAuthToken } from '@inkverse/shared-server/models/index';
import { getSafeError } from '@inkverse/shared-server/utils/errors';
import express from 'express';
import jwt, { type  JwtPayload } from 'jsonwebtoken';

const router = Router();

router.use(express.urlencoded({ extended: false }));
router.use(express.json());

router.get('/:uuid', async (req, res) => {
  const { code } = req?.query || {};
  const { uuid } = req?.params || {};

  try {
    // Validate required parameters
    if (!code || !uuid) {
      return res.redirect(`/hosting-provider/${uuid}?error=missing_parameters`);
    }

    // Exchange OAuth code for refresh and access tokens
    const tokens = await exchangeOAuthCodeForAccessAndRefreshTokens({
      hostingProviderUuid: uuid,
      code: code as string,
    });

    if (!tokens?.refreshToken) {
      return res.redirect(`/hosting-provider/${uuid}?error=tokens_not_found`);
    }
    
    const publicKey = providerDetails[uuid]?.endpoints.publicKey;
    if (!publicKey) {
      return res.redirect(`/hosting-provider/${uuid}?error=incorrect_hosting_provider`);
    }

    const decodedRefreshToken = jwt.verify(tokens.refreshToken as string, publicKey) as JwtPayload;

    // Verify correct provider
    if (decodedRefreshToken.iss !== uuid) {
      return res.redirect(`/hosting-provider/${uuid}?error=incorrect_hosting_provider`);
    }

    // Verify token is valid
    if (!decodedRefreshToken.sub || !decodedRefreshToken.exp || decodedRefreshToken.exp < Date.now() / 1000) {
      return res.redirect(`/hosting-provider/${uuid}?error=token_invalid_or_expired`);
    }

    // Verify the user exists before saving tokens
    const user = await User.getUserById(decodedRefreshToken.sub);
    if (!user) {
      return res.redirect(`/hosting-provider/${uuid}?error=user_not_found`);
    }

    // Store tokens in database (oauth_token table)
    await OAuthToken.saveOAuthTokensForUser({
      userId: user.id,
      hostingProviderUuid: uuid,
      refreshToken: tokens.refreshToken,
      refreshTokenExpiresAt: decodedRefreshToken.exp,
    });

    // Redirect back to client with success
    res.redirect(`/hosting-provider/${uuid}?success=true`);
  } catch (error) {
    console.error('OAuth callback error:', getSafeError(error, 'OAuth callback error'));
    // Redirect back to client with error
    res.redirect(`/hosting-provider/${uuid}?error=connection_failed`);
  }
});

export default router;