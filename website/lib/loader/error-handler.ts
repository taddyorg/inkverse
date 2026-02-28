import { ServerError, CombinedGraphQLErrors } from "@apollo/client/errors";

export function handleLoaderError(error: unknown, context?: string): void {
  // Re-throw Response objects (redirects, 401s, 404s, etc.) so React Router handles them
  if (error instanceof Response) {
    if (error.status >= 300 && error.status < 400) { // Redirects are normal control flow, not errors — re-throw silently
      throw error;
    }

    console.error(
      `[Response Error]${context ? ` in ${context}` : ''}:`,
      error.statusText,
    );

    throw error;
  }

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
    return; // Don't throw — let the caller return fallback data
  }

  // Unknown errors: still throw 500 as a safety net
  console.error(
    `Unknown Error${context ? ` in ${context}` : ''}:`,
    error
  );
  throw new Response("Error fetching data", { status: 500 });
} 