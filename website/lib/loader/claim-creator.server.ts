import { type LoaderFunctionArgs } from "react-router";
import { getPublicApolloClient } from "@/lib/apollo/client.server";
import {
  GetClaimCreatorPage,
  type GetClaimCreatorPageQuery,
  type GetClaimCreatorPageQueryVariables,
} from "@inkverse/shared-client/graphql/operations";
import { providerDetails } from "@inkverse/public/hosting-providers";
import { handleLoaderError } from "./error-handler";

export type ClaimCreatorLoaderData = {
  creator: GetClaimCreatorPageQuery['getCreator'];
  errorParam: string | null;
  hostingProviderName: string | null;
  loaderError?: boolean;
};

export async function loadClaimCreator({ params, request }: LoaderFunctionArgs): Promise<ClaimCreatorLoaderData> {
  const { uuid } = params;

  if (!uuid) {
    throw new Response("Bad Request", { status: 400 });
  }

  const url = new URL(request.url);
  const errorParam = url.searchParams.get('error');

  try {
    const client = getPublicApolloClient(request);

    const { data } = await client.query<
      GetClaimCreatorPageQuery,
      GetClaimCreatorPageQueryVariables
    >({
      query: GetClaimCreatorPage,
      variables: { creatorUuid: uuid },
    });

    const hostingProviderUuid = data?.getCreator?.comics?.[0]?.hostingProviderUuid;
    const hostingProviderName = hostingProviderUuid
      ? providerDetails[hostingProviderUuid]?.displayName || null
      : null;

    return {
      creator: data?.getCreator || null,
      errorParam,
      hostingProviderName,
    };
  } catch (error) {
    handleLoaderError(error, 'ClaimCreator');
    return {
      creator: null,
      errorParam,
      hostingProviderName: null,
      loaderError: true,
    };
  }
}
