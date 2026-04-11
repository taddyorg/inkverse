import { Router } from 'express';
import express from 'express';
import axios from 'axios';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { providerDetails } from '@inkverse/public/hosting-providers';
import { User, UserCreatorClaim, CreatorContent, ComicSeries, UserComment } from '@inkverse/shared-server/models/index';
import { CreatorClaimStatus, TaddyType } from '@inkverse/shared-server/graphql/types';
import { verifyToken } from '@inkverse/shared-server/utils/authentication';
import { currentDate } from '@inkverse/shared-server/utils/date';
import { getSafeError } from '@inkverse/shared-server/utils/errors';
import { purgeCacheOnCdn } from '@inkverse/shared-server/cache/index';
import { inkverseWebsiteUrl } from '@inkverse/public/utils';
import { sendSlackNotification } from '@inkverse/shared-server/messaging/slack';

const router = Router();

router.use(express.urlencoded({ extended: false }));
router.use(express.json());

async function getHostingProviderUuidForCreator(creatorUuid: string): Promise<string | null> {
  const content = await CreatorContent.getContentForCreatorAndType(creatorUuid, TaddyType.COMICSERIES);
  if (!content.length) return null;
  const comics = await ComicSeries.getComicSeriesByUuids(content.map(c => c.contentUuid));
  return comics[0]?.hostingProviderUuid || null;
}

function verifySignedClaimToken(signedClaimToken: string): {
  claimToken: string;
  creatorUuid: string;
  status: string;
} {
  const unverified = jwt.decode(signedClaimToken) as JwtPayload | null;
  if (!unverified?.iss) {
    throw new Error('Invalid signed claim token: missing issuer');
  }

  const publicKey = providerDetails[unverified.iss]?.endpoints.publicKey;
  if (!publicKey) {
    throw new Error('Unknown hosting provider in signed claim token');
  }

  const decoded = jwt.verify(signedClaimToken, publicKey, {
    algorithms: ['RS256'],
  }) as JwtPayload;

  if (!decoded.sub || !decoded.creator_uuid || !decoded.status) {
    throw new Error('Invalid signed claim token: missing required claims');
  }

  if (decoded.status !== 'APPROVED' && decoded.status !== 'REJECTED') {
    throw new Error('Invalid signed claim token: invalid status');
  }

  return {
    claimToken: decoded.sub,
    creatorUuid: decoded.creator_uuid,
    status: decoded.status,
  };
}

/**
 * POST /api/claim-creator/initiate
 * Called by frontend to start the claim process.
 * Requires Bearer token authentication.
 */
router.post('/initiate', async (req, res) => {
  try {
    // Authenticate user from Bearer token
    const tokenPayload = verifyToken({ headers: req.headers });
    if (!tokenPayload || !tokenPayload.sub) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userId = tokenPayload.sub;
    const { creatorUuid } = req.body;

    if (!creatorUuid) {
      return res.status(400).json({ error: 'creatorUuid is required' });
    }

    // Check if creator is already claimed and if user has an existing claim (in parallel)
    const [ user, existingUser, existingClaim, hostingProviderUuid] = await Promise.all([
      User.getUserById(userId),
      User.getUserByCreatorUuid(creatorUuid),
      UserCreatorClaim.getClaimByUserAndCreator(userId, creatorUuid),
      getHostingProviderUuidForCreator(creatorUuid),
    ]);

    if (!user || !user.username) {
      return res.status(400).json({ error: 'User not found' });
    }else if (existingUser) {
      return res.status(409).json({ error: 'This creator has already been claimed' });
    }else if (existingClaim && existingClaim.status === CreatorClaimStatus.APPROVED) {
      return res.status(409).json({ error: 'This creator has already been claimed' });
    }else if (!hostingProviderUuid) {
      return res.status(400).json({ error: 'Could not determine hosting provider for this creator' });
    }

    const providerEndpoints = providerDetails[hostingProviderUuid]?.endpoints;
    if (!providerEndpoints) {
      return res.status(400).json({ error: 'Hosting provider not found' });
    }

    const clientId = process.env.TADDY_CLIENT_ID;
    const clientSecret = process.env.TADDY_CLIENT_SECRET;

    if (!providerEndpoints?.claimInitiateUrl || !clientId || !clientSecret) {
      return res.status(500).json({ error: 'Hosting provider error - cannot connect' });
    }

    const claim = (existingClaim && existingClaim.status === CreatorClaimStatus.PENDING) 
      ? existingClaim.claimTokenExpiry >= currentDate()
        ? existingClaim
        : await UserCreatorClaim.refreshClaimToken(existingClaim.id)
      : await UserCreatorClaim.createClaim(userId, creatorUuid);

    const callbackUrl = `https://inkverse.co/api/claim-creator/callback`;
    const claimInitiateUrl = `https://taddy.org/auth/claim/initiate`;
    const claimCreatorUrl = `https://taddy.org/dashboard/claim-creator?creator_uuid=${creatorUuid}&claim_token=${claim.claimToken}`;

    // POST to hosting provider to register the claim
    await axios.post(claimInitiateUrl, {
      client_id: clientId,
      client_secret: clientSecret,
      client_user_id: String(userId),
      client_profile_url: `${inkverseWebsiteUrl}/${user.username}`,
      creator_uuid: creatorUuid,
      claim_token: claim.claimToken,
      callback_url: callbackUrl,
    });

    // Return the provider dashboard URL for the user to verify ownership
    return res.json({
      claimCreatorUrl: claimCreatorUrl,
    });
  } catch (error) {
    console.error('Claim initiate error:', getSafeError(error, 'Claim initiate error'));
    return res.status(500).json({ error: 'Failed to initiate claim' });
  }
});

/**
 * POST /api/claim-creator/callback
 * Called by Taddy's server with a signed JWT containing the claim_token and status.
 * Verifies the JWT signature, processes the claim, and returns a redirect URL.
 */
router.post('/callback', async (req, res) => {
  try {
    const { signed_claim_token } = req.body;

    if (!signed_claim_token || typeof signed_claim_token !== 'string') {
      return res.status(400).json({ success: false, error: 'Missing signed_claim_token' });
    }

    // Verify JWT signature and extract claims
    const { claimToken, creatorUuid, status } = verifySignedClaimToken(signed_claim_token);

    // Look up the claim
    const claim = await UserCreatorClaim.getClaimByToken(claimToken);
    if (!claim) {
      return res.status(400).json({ success: false, error: 'Invalid or expired claim token' });
    }

    if (claim.status !== CreatorClaimStatus.PENDING) {
      return res.json({
        success: true,
        redirectUrl: `${inkverseWebsiteUrl}/claim-creator/${claim.creatorUuid}`,
      });
    }

    // Cross-validate creatorUuid from JWT matches the claim record
    if (claim.creatorUuid !== creatorUuid) {
      return res.status(400).json({ success: false, error: 'Creator UUID mismatch' });
    }

    if (status === CreatorClaimStatus.APPROVED) {
      // Race condition guard: check if another user already claimed this creator
      const existingUser = await User.getUserByCreatorUuid(claim.creatorUuid);
      if (existingUser) {
        return res.json({
          success: false,
          error: 'Creator already claimed',
          redirectUrl: `${inkverseWebsiteUrl}/claim-creator/${claim.creatorUuid}?error=Creator+already+claimed`,
        });
      }

      // Approve the claim (updates claim status + sets creator_uuid on user)
      const approvedClaim = await UserCreatorClaim.approveClaim(claimToken);
      if (!approvedClaim) {
        return res.status(500).json({ success: false, error: 'Failed to approve claim' });
      }

      const user = await User.getUserById(approvedClaim.userId);

      sendSlackNotification('general', {
        text: `*🔔* *CLAIM APPROVED*\n*Creator:* ${approvedClaim?.creatorUuid}\n*User:* ${user?.username}: https://inkverse.co/${user?.username}`,
      });

      // Purge CDN cache for the creator and user profile
      try {
        await purgeCacheOnCdn({ type: 'creator', id: approvedClaim.creatorUuid });
        await purgeCacheOnCdn({ type: 'user', id: String(approvedClaim.userId), shortUrl: user?.username || '' });

        const creatorSeriesContent = await CreatorContent.getContentForCreatorAndType(
          approvedClaim.creatorUuid,
          TaddyType.COMICSERIES,
          undefined, 0, 1000
        );
        const seriesUuids = creatorSeriesContent.map(c => c.contentUuid);

        if (seriesUuids.length > 0) {
          const affectedIssueUuids = await UserComment.markCommentsAsCreator(
            approvedClaim.userId,
            seriesUuids
          );
          for (const issueUuid of affectedIssueUuids) {
            purgeCacheOnCdn({ type: 'comments', id: issueUuid });
          }
        }
      } catch (error) {
        console.error('Purge or retroactively marking comments as creator ERROR:', error);
      }

      return res.json({
        success: true,
        redirectUrl: `${inkverseWebsiteUrl}/claim-creator/${claim.creatorUuid}`,
      });
    }

    if (status === CreatorClaimStatus.REJECTED) {
      const rejectedClaim = await UserCreatorClaim.rejectClaim(claimToken);
      if (!rejectedClaim) {
        return res.status(500).json({ success: false, error: 'Failed to reject claim' });
      }

      const user = await User.getUserById(rejectedClaim.userId);

      sendSlackNotification('general', {
        text: `*🔔* *CLAIM REJECTED*\n*Creator:* ${rejectedClaim.creatorUuid}\n*User:* ${user?.username}: https://inkverse.co/${user?.username}`,
      });

      return res.json({
        success: true,
        redirectUrl: `${inkverseWebsiteUrl}/claim-creator/${rejectedClaim.creatorUuid}`,
      });
    }
  } catch (error) {
    console.error('Claim callback error:', getSafeError(error, 'Claim callback error'));
    return res.status(400).json({ success: false, error: 'Invalid or expired signed claim token' });
  }
});

export default router;
