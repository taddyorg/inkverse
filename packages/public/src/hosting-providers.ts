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
  publicKey: string;
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
      instructionsUrl: 'https://taddy.org/developers/instructions',
      publicKey: "-----BEGIN PUBLIC KEY-----\nMIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAtnihy/rnKGH9jdqWVgot\noNqWcqY2ATJE5bHtvypEf7JVqisX7yfUKC1JY1uzlLVDoMFTJdzTnAUl4xf6EpTZ\n92RGIzWDdcEk4syPSdWms855CMArTcw9fY56/egG3kYMZlVsxRysZPT5F/ovfs0H\nCFGQRsBX5vtfoFikEelInlfS0zZjljIyIZMKxPrfV/PDw+bJUJCxut3GQVf4/UnO\n4uXBPh13WyaxvMNKf1qk4CbCW1e8n17Ec3tyz4/OqVrFmtzSO9WzIEijvrQIuJQu\nNzBsgXDhPH5FZ0giYqB+ImoeURd8TirXgncv5cxcsX4sVsTXN7VBMpczmpsKMlay\nRnKo2DrBYLHPLXlKmcRq6qNNJBSXYrtk4sxRg4pFz//D0TREWM4o2T1DLgKTWqFs\nsWzs6kWVfy8KQc0ID/k2s3iK4JbxjNj3wXzkXBJTqQEahjIGesxgZqN0OlCAbXvM\ncLCeymnlRxNm4I6fZPXs7QVXmG9aGdpkWK/xNiS10WXdJxcveoud4/QH9Trq2aKl\n3bb/g71FJFfsGheoYcd+8iS9aP5lu7f91LXC5QjfKIU7JSlY4czWA1Ji9DS4Rci5\nZTMluktVO50vhr3PQxDgrB8foxxfUq4fG/ru6jBBZPk4RfNyJv6tUjkcZF0evhnm\nBqlqHmg1hzvvuyC4WW5H7LcCAwEAAQ==\n-----END PUBLIC KEY-----"
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
export async function getNewContentToken({
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