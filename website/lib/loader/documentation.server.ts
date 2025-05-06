import { type LoaderFunctionArgs } from "react-router";
import { getApolloClient } from "@/lib/apollo/client.server";
import { type GetDocumentationQuery, type GetDocumentationQueryVariables, GetDocumentation } from "@inkverse/shared-client/graphql/operations";
import { handleLoaderError } from "./error-handler";

export type DocumentationLoaderData = {
  documentation: GetDocumentationQuery['getDocumentation'];
  apolloState: Record<string, any>;
};

export async function loadDocumentation({ params, request, context }: LoaderFunctionArgs, basePath: string): Promise<DocumentationLoaderData> {
  const fullPath = params.slug 
      ? `${basePath}/${params.slug}` 
      : basePath;
  
  const client = getApolloClient(request);
  
  try {
    const { data } = await client.query<GetDocumentationQuery, GetDocumentationQueryVariables>({
      query: GetDocumentation,
      variables: { id: fullPath },
    });

    if (!data?.getDocumentation) {
      throw new Response("Not Found", { status: 404 });
    }

    const state = client.extract();

    return {
      documentation: data.getDocumentation,
      apolloState: state,
    };

  } catch (error) {
    handleLoaderError(error, 'Documentation');
  }
}