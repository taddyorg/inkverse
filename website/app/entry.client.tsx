/**
 * By default, Remix will handle hydrating your app on the client for you.
 * You are free to delete this file if you'd like to, but if you ever want it revealed again, you can run `npx remix reveal` ✨
 * For more information, see https://remix.run/file-conventions/entry.client
 */

// Add this type declaration at the top of the file
declare global {
  interface Window {
    __APOLLO_STATE__: any;
  }
}

import { HydratedRouter } from "react-router/dom";
import { startTransition, StrictMode, useEffect } from "react";
import { hydrateRoot } from "react-dom/client";
import { ApolloProvider } from '@apollo/client';
import { initClient } from "@/lib/apollo/client.client"
import posthog from "posthog-js";
import config from "@/config";

function PosthogInit() {
  useEffect(() => {
    posthog.init(config.POST_HOG_INFO.API_KEY, {
      api_host: config.POST_HOG_INFO.HOST_URL,
    });
  }, []);

  return null;
}

startTransition(() => {
  // Initialize Apollo client with the hydrated state
  const apolloState = window.__APOLLO_STATE__ || {};
  const client = initClient(apolloState);

  hydrateRoot(
    document,
    <StrictMode>
      <ApolloProvider client={client}>
        <HydratedRouter />
        <PosthogInit />
      </ApolloProvider>
    </StrictMode>
  );
});
