import { type LoaderFunctionArgs } from "react-router";
import { getPublicApolloClient } from "@/lib/apollo/client.server";
import { type GetUserByUsernameQuery, GetUserByUsername, type GetUserByUsernameQueryVariables } from "@inkverse/shared-client/graphql/operations";
import { handleLoaderError } from "./error-handler";
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
      };
    }

    // Step 2: Fetch user data using the helper function
    const profileData = await loadProfileById({
      publicClient,
      userId: userIdFromUsername,
    });

    if (!profileData) {
      return {
        user: null,
        subscribedComics: null,
        isLoading: false,
        error: null,
      };
    }

    return profileData;
    
  } catch (error) {
    const errorResult = handleLoaderError(error, 'Profile');
    return {
      user: null,
      subscribedComics: null,
      isLoading: false,
      error: errorResult,
    };
  }
}