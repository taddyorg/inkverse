import { type LoaderFunctionArgs } from "react-router";
import { getPublicApolloClient, getUserApolloClient } from "@/lib/apollo/client.server";
import { type GetUserByUsernameQuery, GetUserByUsername, type GetUserByUsernameQueryVariables } from "@inkverse/shared-client/graphql/operations";
import { handleLoaderError } from "./error-handler";
import { getRefreshToken } from "@/lib/auth/cookie";
import { jwtDecode, type JwtPayload } from 'jwt-decode';
import { type ProfileState, loadProfileById } from "@inkverse/shared-client/dispatch/profile";

export async function loadProfile({ params, request, context }: LoaderFunctionArgs): Promise<ProfileState> {
  const { username } = params;
  
  if (!username) {
    throw new Response("Bad Request", { status: 400 });
  }

  try {
    const publicClient = getPublicApolloClient(request);
    
    // Step 1: Get user ID from username
    const publicUserResult = await publicClient.query<GetUserByUsernameQuery, GetUserByUsernameQueryVariables>({
      query: GetUserByUsername,
      variables: { username },
    });

    const userIdFromUsername = publicUserResult.data?.getUserByUsername?.id;
    if (!userIdFromUsername) {
      return {
        user: null,
        subscribedComics: null,
        isLoading: false,
        error: null,
        apolloState: publicClient.extract(),
      };
    }

    // Check if user is authenticated
    const refreshToken = await getRefreshToken(request);
    let currentUserId: string | undefined;
    let userClient;

    if (refreshToken) {
      const decoded = jwtDecode(refreshToken) as JwtPayload & { sub?: string };
      currentUserId = decoded?.sub;
      userClient = getUserApolloClient(request);
    }

    // Step 2: Fetch user data using the helper function
    const profileData = await loadProfileById({
      publicClient,
      userClient,
      userId: userIdFromUsername,
      currentUserId,
    });

    if (!profileData) {
      return {
        user: null,
        subscribedComics: null,
        isLoading: false,
        error: null,
        apolloState: publicClient.extract(),
      };
    }

    // Step 4: Extract Apollo state from the appropriate client
    const apolloState = (currentUserId && userClient && currentUserId === userIdFromUsername)
      ? userClient.extract()
      : publicClient.extract();

    return {
      ...profileData,
      apolloState,
    };
    
  } catch (error) {
    console.log('error', error);
    const errorResult = handleLoaderError(error, 'Profile');
    return {
      user: null,
      subscribedComics: null,
      isLoading: false,
      error: errorResult,
      apolloState: {},
    };
  }
}