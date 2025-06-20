import { type LoaderFunctionArgs } from "react-router";
import { getPublicApolloClient } from "@/lib/apollo/client.server";
import { type GetListQuery, GetList, type GetListQueryVariables } from "@inkverse/shared-client/graphql/operations";
import { handleLoaderError } from "./error-handler";

export type ListLoaderData = {
  list: GetListQuery['getList'];
};

export async function loadList({ params, request, context }: LoaderFunctionArgs): Promise<ListLoaderData> {
  const { id } = params;

  if (!id) {
    throw new Response("Not Found", { status: 404 });
  }

  const client = getPublicApolloClient(request);

  const listId = id.split('-')[0].slice(2);

  try {
    // Get creator data first
    const listResult = await client.query<GetListQuery, GetListQueryVariables>({
      query: GetList,
      variables: { id: listId },
    });
    
    if (!listResult.data?.getList) {
      throw new Response("Not Found", { status: 404 });
    }

    return {
      list: listResult.data.getList,
    };
    
  } catch (error) {
    return handleLoaderError(error, 'List');
  }
}