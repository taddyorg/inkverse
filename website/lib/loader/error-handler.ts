import { ServerError, CombinedGraphQLErrors } from "@apollo/client/errors";

export function handleLoaderError(error: unknown, context?: string): never {
  if (ServerError.is(error)) {
    console.error(
      `Server Error${context ? ` in ${context}` : ''}:`,
      error.bodyText
    );
    throw new Response("Error fetching data", { status: error.statusCode });
  }

  if (CombinedGraphQLErrors.is(error)) {
    console.error(
      `GraphQL Errors${context ? ` in ${context}` : ''}:`,
      error.errors
    );
  }

  throw new Response("Error fetching data", { status: 500 });
} 