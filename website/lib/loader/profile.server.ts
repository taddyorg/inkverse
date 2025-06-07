import { type LoaderFunctionArgs } from "react-router";
import { getPublicApolloClient, getUserApolloClient } from "@/lib/apollo/client.server";
import { type GetUserByUsernameQuery, GetUserByUsername, type GetUserByUsernameQueryVariables, type User, type GetUserByIdQuery, type GetUserByIdQueryVariables, GetUserById } from "@inkverse/shared-client/graphql/operations";
import { handleLoaderError } from "./error-handler";
import { getRefreshToken } from "@/lib/auth/cookie";
import { jwtDecode, type JwtPayload } from 'jwt-decode';

export type ProfileLoaderData = {
  user: User | null;
  apolloState: Record<string, any>;
};

export async function loadProfile({ params, request }: LoaderFunctionArgs): Promise<ProfileLoaderData> {
  const { username } = params;
  
  if (!username) {
    throw new Response("Bad Request", { status: 400 });
  }

  
  try {
    let user;
    let apolloState;

    const publicClient = getPublicApolloClient(request);
    const publicUserResult = await publicClient.query<GetUserByUsernameQuery, GetUserByUsernameQueryVariables>({
      query: GetUserByUsername,
      variables: { username },
    });

    const userIdFromUsername = publicUserResult.data?.getUserByUsername?.id;
    if (!userIdFromUsername) {
      return {
        user: null,
        apolloState: {},
      };
    }

    // Check if user is authenticated by looking at the refresh token cookie
    const refreshToken = await getRefreshToken(request);
    
    if (refreshToken) { // User is authenticated
      const decoded = jwtDecode(refreshToken) as JwtPayload & { sub?: string };

      const shouldUseUserClient = decoded?.sub === userIdFromUsername;

      if (shouldUseUserClient) { // User is authenticated and its thier profile
        // Use user client to get full profile data
        const userClient = getUserApolloClient(request);
        
        const userResult = await userClient.query<GetUserByIdQuery, GetUserByIdQueryVariables>({
          query: GetUserById,
          variables: { id: userIdFromUsername },
        });
    
        if (!userResult.data?.getUserById) {
          return {
            user: null,
            apolloState: {},
          };
        }
  
        user = userResult.data.getUserById;
        apolloState = userClient.extract();
      } else { // User is authenticated but its not thier profile
        // Use public client to get limited profile data for other users
        const publicClient = getPublicApolloClient(request);
        
        const userResult = await publicClient.query<GetUserByIdQuery, GetUserByIdQueryVariables>({
          query: GetUserById,
          variables: { id: userIdFromUsername },
        });

        if (!userResult.data?.getUserById) {
          return {
            user: null,
            apolloState: {},
          };
        }

        user = userResult.data.getUserById;
        apolloState = publicClient.extract();
      }
    } else { // User is unauthenticated
      // Use public client to get limited profile data for unauthenticated users
      
      const publicResult = await publicClient.query<GetUserByIdQuery, GetUserByIdQueryVariables>({
        query: GetUserById,
        variables: { id: userIdFromUsername },
      });

      if (!publicResult.data?.getUserById) {
        return {
          user: null,
          apolloState: {},
        };
      }

      user = publicResult.data.getUserById;
      apolloState = publicClient.extract();
    }

    return {
      user,
      apolloState,
    };
    
  } catch (error) {
    console.log('error', error);
    return handleLoaderError(error, 'Profile');
  }
}