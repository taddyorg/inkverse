import fs from 'fs'
import readline from 'readline'
import { getNewRefreshToken, providerDetails } from '@inkverse/public/hosting-providers'
import { OAuthToken, User } from '@inkverse/shared-server/models/index';
import jwt, { type JwtPayload } from 'jsonwebtoken';

// Make the main process async
export async function refreshHostingProviderAccessToken(outputPath: string): Promise<void> {

    const start = +new Date();
    console.log('');
    console.log(`[SYNC] /**`)
    console.log(`[SYNC]  * STARTING REFRESH HOSTING PROVIDER ACCESS TOKEN PROCESS.`)
    console.log(`[SYNC]  *     args: ${[ outputPath ].join(', ')}`)
    console.log(`[SYNC]  */`)
    
    const fileStream = fs.createReadStream(outputPath, "utf8")
    
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    })

    for await (const line of rl) {
        const oauthToken = JSON.parse(line)
        const { userId, refreshToken, hostingProviderUuid } = oauthToken
        if (!userId || !refreshToken || !hostingProviderUuid) continue

        const newRefreshToken = await getNewRefreshToken({
            hostingProviderUuid,
            refreshToken,
        })

        const publicKey = providerDetails[hostingProviderUuid]?.endpoints.publicKey;
        if (!publicKey) continue

        const decodedRefreshToken = jwt.verify(newRefreshToken as string, publicKey) as JwtPayload;

        // Verify correct provider
        if (decodedRefreshToken.iss !== hostingProviderUuid) {
          console.log(`[SYNC] Incorrect hosting provider ${decodedRefreshToken.iss} for ${hostingProviderUuid}`)
          continue
        }
    
        // Verify token is valid
        if (!decodedRefreshToken.sub || !decodedRefreshToken.exp || decodedRefreshToken.exp < Date.now() / 1000) {
          console.log(`[SYNC] Token invalid or expired for ${hostingProviderUuid}`)
          continue
        }
    
        // Verify the user exists before saving tokens
        const user = await User.getUserById(decodedRefreshToken.sub);

        if (!user || user.id !== userId) {
          console.log(`[SYNC] User not found or mismatch for ${hostingProviderUuid}`)
          continue
        }

        await OAuthToken.saveOAuthTokensForUser({
            userId,
            hostingProviderUuid,
            refreshToken: newRefreshToken,
            refreshTokenExpiresAt: decodedRefreshToken.exp,
        })
    }

    const end = +new Date();
    console.log(`[SYNC] Finished in ${end - start}ms`)
}