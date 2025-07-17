import axios from 'axios';
import { providerDetails, type OAuthTokens } from '@inkverse/public/hosting-providers';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '..', '..', '.env');
dotenv.config({ path: envPath });

type ExchangeOAuthCodeForAccessAndRefreshTokensParams = {
  hostingProviderUuid: string;
  code: string;
  codeVerifier?: string;
}

/**
 * Exchange authorization code for OAuth tokens using axios
 */
export async function exchangeOAuthCodeForAccessAndRefreshTokens({
    hostingProviderUuid,
    code,
    codeVerifier,
  }: ExchangeOAuthCodeForAccessAndRefreshTokensParams,
): Promise<OAuthTokens> {
  try {
    const tokenUrl = providerDetails[hostingProviderUuid]?.endpoints.tokenUrl;
    if (!tokenUrl) {
      throw new Error(`Token URL not found for hosting provider ${hostingProviderUuid}`);
    }

    const clientId = process.env.TADDY_CLIENT_ID;
    const clientSecret = process.env.TADDY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('TADDY_CLIENT_ID or TADDY_CLIENT_SECRET is not set');
    }

    const response = await axios.post(tokenUrl, new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: clientId,
      client_secret: clientSecret,
      ...(codeVerifier ? { code_verifier: codeVerifier } : {}),
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const data = response.data;

    return {
      accessToken: data?.access_token,
      refreshToken: data?.refresh_token,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorData = error.response?.data;
      const errorMessage = typeof errorData === 'string' 
        ? errorData 
        : JSON.stringify(errorData) || error.message;
      throw new Error(`Failed to exchange code: ${errorMessage}`);
    }
    throw new Error(`Failed to exchange code: ${error instanceof Error ? error.message : String(error)}`);
  }
}