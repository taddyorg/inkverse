import type { ApolloError } from "@apollo/client";
import type { ServerError } from "@apollo/client/link/utils";

export function handleLoaderError(error: unknown, context?: string): never {
  const apolloError = error as ApolloError;
  
  if (apolloError.networkError && 'result' in apolloError.networkError) {
    console.error(
      `GraphQL Errors${context ? ` in ${context}` : ''}:`, 
      apolloError.networkError.result
    );
  }

  const statusCode = (apolloError.networkError as ServerError)?.statusCode;
  
  throw new Response(
    "Error fetching data", 
    { status: statusCode || 500 }
  );
} 