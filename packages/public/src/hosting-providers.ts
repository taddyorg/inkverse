import axios from 'axios';

export interface OAuthTokens {
  accessToken?: string;
  refreshToken?: string;
}

export interface ContentTokenResponse {
  contentToken: string;
  seriesUuid: string;
  expiresIn: number;
}

export interface OAuthEndpoints {
  signupUrl: string;
  authorizeUrl: string;
  tokenUrl: string;
  newAccessTokenUrl: string;
  newRefreshTokenUrl: string;
  newContentTokenUrl: string;
  instructionsUrl?: string;
}

export interface ProviderDetails {
  displayName: string;
  endpoints: OAuthEndpoints;
}

export const providerDetails: Record<string, ProviderDetails> = {
  "e9957105-80e4-46e3-8e82-20472b9d7512": {
    displayName: 'Taddy Ink',
    endpoints: {
      signupUrl: 'https://taddy.org/developers/signup',
      authorizeUrl: 'https://taddy.org/fans/authorize',
      tokenUrl: 'https://taddy.org/auth/oauth2/token',
      newAccessTokenUrl: 'https://taddy.org/auth/oauth2/new_access_token',
      newRefreshTokenUrl: 'https://taddy.org/auth/oauth2/new_refresh_token',
      newContentTokenUrl: 'https://taddy.org/auth/oauth2/new_content_token',
      instructionsUrl: 'https://taddy.org/developers/instructions'
    }
  }
}

type GetAuthorizationCodeUrlParams = {
  hostingProviderUuid: string;
  clientId: string;
  clientUserId: string;
  responseType?: string;
  accessToken?: string;
  seriesUuid?: string;
  state?: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
}

/**
 * Get authorization code for hosting provider
 */
export function getAuthorizationCodeUrl({
  hostingProviderUuid,
  clientId,
  clientUserId,
  responseType = 'code',
  accessToken,
  seriesUuid,
  state,
  codeChallenge,
  codeChallengeMethod,
}: GetAuthorizationCodeUrlParams): string {
  const authorizeUrl = providerDetails[hostingProviderUuid]?.endpoints.authorizeUrl;
  if (!authorizeUrl) {
    throw new Error(`Authorize URL not found for hosting provider ${hostingProviderUuid}`);
  }

  const url = new URL(authorizeUrl);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('client_user_id', clientUserId);
  url.searchParams.set('response_type', responseType);

  if (accessToken) {
    url.searchParams.set('access_token', accessToken);
  }
  if (seriesUuid) {
    url.searchParams.set('series_uuid', seriesUuid);
  }
  if (state) {
    url.searchParams.set('state', state);
  }
  if (codeChallenge) {
    url.searchParams.set('code_challenge', codeChallenge);
  }
  if (codeChallengeMethod) {
    url.searchParams.set('code_challenge_method', codeChallengeMethod);
  }

  return url.toString();
}


type ExchangeOAuthCodeForAccessAndRefreshTokensParams = {
  hostingProviderUuid: string;
  code: string;
  clientId: string;
  clientSecret: string;
  codeVerifier?: string;
}

/**
 * Exchange authorization code for OAuth tokens using axios
 */
export async function exchangeOAuthCodeForAccessAndRefreshTokens({
    hostingProviderUuid,
    code,
    clientId,
    clientSecret,
    codeVerifier,
  }: ExchangeOAuthCodeForAccessAndRefreshTokensParams,
): Promise<OAuthTokens> {
  try {
    const tokenUrl = providerDetails[hostingProviderUuid]?.endpoints.tokenUrl;
    if (!tokenUrl) {
      throw new Error(`Token URL not found for hosting provider ${hostingProviderUuid}`);
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
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Failed to exchange code: ${error.response?.data || error.message}`);
    }
    throw new Error(`Failed to exchange code: ${error}`);
  }
}

type GetNewAccessTokenParams = {
  hostingProviderUuid: string;
  refreshToken: string;
}

/**
 * Refresh access token using refresh token with axios
 */
export async function getNewAccessToken({
    hostingProviderUuid,
    refreshToken,
  }: GetNewAccessTokenParams,
): Promise<string> {
  try {
    const newAccessTokenUrl = providerDetails[hostingProviderUuid]?.endpoints.newAccessTokenUrl;
    
    if (!newAccessTokenUrl) {
      throw new Error(`New access token URL not found for hosting provider ${hostingProviderUuid}`);
    }

    const response = await axios.post(newAccessTokenUrl, new URLSearchParams({
      refresh_token: refreshToken,
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const data = response.data;

    return data.token;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Failed to refresh access token: ${error.response?.data || error.message}`);
    }
    throw new Error(`Failed to refresh access token: ${error}`);
  }
}

type GetNewRefreshTokenParams = {
  hostingProviderUuid: string;
  refreshToken: string;
}

/**
 * Get new refresh token using axios
 */
export async function getNewRefreshToken({
    hostingProviderUuid,
    refreshToken,
  }: GetNewRefreshTokenParams,
): Promise<string> {
  try {
    const newRefreshTokenUrl = providerDetails[hostingProviderUuid]?.endpoints.newRefreshTokenUrl;
    if (!newRefreshTokenUrl) {
      throw new Error(`New refresh token URL not found for hosting provider ${hostingProviderUuid}`);
    }

    const response = await axios.post(newRefreshTokenUrl, new URLSearchParams({
      refresh_token: refreshToken,
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const data = response.data;

    return data.token;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Failed to get new refresh token: ${error.response?.data || error.message}`);
    }
    throw new Error(`Failed to get new refresh token: ${error}`);
  }
}

type GetContentTokenParams = {
  hostingProviderUuid: string;
  accessToken: string;
  seriesUuid: string;
}

/**
 * Get content token for a specific series using axios
 */
export async function getContentToken({
    hostingProviderUuid,
    accessToken,
    seriesUuid,
  }: GetContentTokenParams,
): Promise<string> {
  try {
    const newContentTokenUrl = providerDetails[hostingProviderUuid]?.endpoints.newContentTokenUrl;
    if (!newContentTokenUrl) {
      throw new Error(`New content token URL not found for hosting provider ${hostingProviderUuid}`);
    }

    const response = await axios.post(newContentTokenUrl, new URLSearchParams({
      access_token: accessToken,
      series_uuid: seriesUuid,
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const data = response.data;

    return data.token;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Failed to get content token: ${error.response?.data || error.message}`);
    }
    throw new Error(`Failed to get content token: ${error}`);
  }
}