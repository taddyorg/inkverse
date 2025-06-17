import { type LoaderFunctionArgs } from "react-router";
import { getPublicApolloClient } from "@/lib/apollo/client.server";
import { type GetDocumentationQuery, type GetDocumentationQueryVariables, GetDocumentation } from "@inkverse/shared-client/graphql/operations";
import { handleLoaderError } from "./error-handler";

export type DocumentationLoaderData = {
  documentation: GetDocumentationQuery['getDocumentation'];
};

export async function loadDocumentation({ params, request, context }: LoaderFunctionArgs, basePath: string): Promise<DocumentationLoaderData> {
  const fullPath = params.slug 
      ? `${basePath}/${params.slug}` 
      : basePath;
  
  const client = getPublicApolloClient(request);
  
  try {
    const { data } = await client.query<GetDocumentationQuery, GetDocumentationQueryVariables>({
      query: GetDocumentation,
      variables: { id: fullPath },
    });

    if (!data?.getDocumentation) {
      throw new Response("Not Found", { status: 404 });
    }

    return {
      documentation: data.getDocumentation,
    };

  } catch (error) {
    handleLoaderError(error, 'Documentation');
  }
}