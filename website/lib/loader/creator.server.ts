import { type LoaderFunctionArgs, redirect } from "react-router";
import { getPublicApolloClient } from "@/lib/apollo/client.server";
import { type GetCreatorQuery, GetCreator, type GetCreatorQueryVariables, GetMiniCreator, type GetMiniCreatorQuery, type GetMiniCreatorQueryVariables } from "@inkverse/shared-client/graphql/operations";
import { handleLoaderError } from "./error-handler";

export type CreatorLoaderData = {
  creator: GetCreatorQuery['getCreator'];
  comicseries: NonNullable<GetCreatorQuery['getCreator']>['comics'] | null | undefined;
  loaderError?: boolean;
};

export async function loadCreator({ params, request, context }: LoaderFunctionArgs): Promise<CreatorLoaderData> {
  const { shortUrl } = params;

  const client = getPublicApolloClient(request);

  try {
    // Get creator data first
    const getCreatorUuid = await client.query<GetMiniCreatorQuery, GetMiniCreatorQueryVariables>({
      query: GetMiniCreator,
      variables: { shortUrl },
    });

    if (!getCreatorUuid.data?.getCreator || !getCreatorUuid.data?.getCreator.uuid) {
      throw new Response("Not Found", { status: 404 });
    }

    // If this creator is claimed by a user, redirect to the user's profile
    const claimedByUser = getCreatorUuid.data.getCreator.user;
    if (claimedByUser?.username) {
      throw redirect(`/${claimedByUser.username}`);
    }

    // Get comic series data first
    const creatorResult = await client.query<GetCreatorQuery, GetCreatorQueryVariables>({
      query: GetCreator,
      variables: { uuid: getCreatorUuid.data?.getCreator.uuid },
    });

    if (!creatorResult.data?.getCreator) {
      throw new Response("Not Found", { status: 404 });
    }

    // Return immediately with comic series, but defer user data
    return {
      creator: creatorResult.data.getCreator,
      comicseries: creatorResult.data.getCreator.comics,
    };
    
  } catch (error) {
    handleLoaderError(error, 'Creator');
    return { creator: null, comicseries: null, loaderError: true };
  }
}