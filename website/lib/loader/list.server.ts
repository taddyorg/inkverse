import { type LoaderFunctionArgs } from "react-router";
import { getApolloClient } from "@/lib/apollo/client.server";
import { type GetListQuery, GetList, type GetListQueryVariables } from "@inkverse/shared-client/graphql/operations";
import { handleLoaderError } from "./error-handler";

export type ListLoaderData = {
  list: GetListQuery['getList'];
  apolloState: Record<string, any>;
};

export async function loadList({ params, request, context }: LoaderFunctionArgs): Promise<ListLoaderData> {
  const { id } = params;

  if (!id) {
    throw new Response("Not Found", { status: 404 });
  }

  const client = getApolloClient(request);

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

    const state = client.extract();

    // Return immediately with comic series, but defer user data
    return {
      list: listResult.data.getList,
      apolloState: state,
    };
    
  } catch (error) {
    return handleLoaderError(error, 'List');
  }
}