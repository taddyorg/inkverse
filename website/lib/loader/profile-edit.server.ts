import type { LoaderFunctionArgs } from 'react-router';
import { redirect } from 'react-router';
import { getUserApolloClient } from '@/lib/apollo/client.server';
import { GetMeDetails, GetProfileByUserId, type User } from '@inkverse/shared-client/graphql/operations';
import { jwtDecode, type JwtPayload } from 'jwt-decode';
import { getRefreshToken } from '../auth/cookie';

interface ProfileEditLoaderData {
  user: User;
}

export async function loadProfileEdit({ request }: LoaderFunctionArgs): Promise<ProfileEditLoaderData> {
  // Check if user is authenticated by looking at the refresh token cookie
  const refreshToken = await getRefreshToken(request);

  if (!refreshToken) { // User is not authenticated
    throw redirect('/');
  }

  const decoded = jwtDecode(refreshToken) as JwtPayload & { sub?: string };

  if (!decoded.sub) {
    throw redirect('/');
  }

  try {
    const userClient = getUserApolloClient(request);

    const { data } = await userClient.query({
      query: GetMeDetails,
    });

    if (!data?.me) {
      console.log('User not found');
      throw redirect('/');
    }

    return {
      user: data.me
    };
  } catch (error) {
    console.error('Error fetching user for profile edit:', error);
    throw redirect('/');
  }
}