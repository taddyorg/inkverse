import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useMatches,
  type LoaderFunction,
} from "react-router";

import { useEffect, useState } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { getSettings } from "@/lib/action/settings";
import config from "../config";

import type { Route } from "./+types/root";
import stylesheet from "./app.css?url";
import { getPublicApolloClient, getUserApolloClient } from "@/lib/apollo/client.client";
import { Navbar } from './components/ui';
import { refreshAccessToken, refreshRefreshToken } from '@/lib/auth/user';
import { isAuthenticated } from '@/lib/auth/user';

import 'react-notion-x/src/styles.css'
import 'prismjs/themes/prism-tomorrow.css'
import 'katex/dist/katex.min.css'
import { fetchAllHostingProviderTokens } from "@inkverse/shared-client/dispatch/hosting-provider";
import { saveHostingProviderRefreshToken, refreshHostingProviderAccessToken } from "@/lib/auth/hosting-provider";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://ink0.inkverse.co" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600;800&display=swap",
  },
  { rel: "stylesheet", href: stylesheet },
  { rel: "icon", type: "image/x-icon", href: "/favicon/favicon.ico" },
  { rel: "apple-touch-icon", href: "/favicon/apple-touch-icon.png" },
  { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon/favicon-32x32.png" },
  { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon/favicon-16x16.png" },
  { rel: "icon", type: "image/png", sizes: "192x192", href: "/favicon/android-chrome-192x192.png" },
  { rel: "icon", type: "image/png", sizes: "512x512", href: "/favicon/android-chrome-512x512.png" },
];

export const loader: LoaderFunction = async ({ request }) => {
  const settings = await getSettings(request);
  return { settings };
};

export function Layout({ children }: { children: React.ReactNode }) {
  const { settings: initialSettings } = useLoaderData<{ settings: { theme: string, zoomMode: string } }>();
  const [theme, setTheme] = useState(initialSettings.theme || 'light');
  const [zoomMode, setZoomMode] = useState(initialSettings.zoomMode || 'out');

  const matches = useMatches();
  const currentRouteData = matches[matches.length - 1]?.data;
  
  // Refresh access and refresh tokens on app start
  useEffect(() => {
    const refreshTokensOnAppStart = async () => {
      if (isAuthenticated()) {
        try {
          const userClient = getUserApolloClient();
          await Promise.allSettled([
            refreshAccessToken(),
            refreshRefreshToken(),
            fetchAllHostingProviderTokens({ userClient, saveHostingProviderRefreshToken, refreshHostingProviderAccessToken })
          ]);
        } catch (error) {
          console.error('Failed to refresh tokens on app start:', error);
        }
      }
    };

    refreshTokensOnAppStart();
  }, []);

  // Refresh access token every 15 minutes
  useEffect(() => {
    if (!isAuthenticated()) return;
  
    // Refresh tokens every 15 minutes
    const interval = setInterval(async () => {
      await refreshAccessToken();
      console.log('Access token refreshed on interval');
    }, 15 * 60 * 1000);
  
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Handle Apollo state restoration
    if ((currentRouteData as any)?.apolloState) {
      const client = getPublicApolloClient();
      if (client) {
        client.restore((currentRouteData as any).apolloState);
      }
    }
  }, [currentRouteData]);

  // Set initial zoom class based on zoom mode
  useEffect(() => {
    if (zoomMode === 'in') {
      document.documentElement.classList.add('zoomed-in');
    } else {
      document.documentElement.classList.remove('zoomed-in');
    }
  }, [zoomMode]);

  const handleThemeChange = async (newTheme: string) => {
    setTheme(newTheme);

    // Update settings with the new theme
    await fetch('/api/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ theme: newTheme, zoomMode: zoomMode }),
    });
  };

  const handleZoomModeChange = async (newZoomMode: string) => {
    setZoomMode(newZoomMode);

    // Update settings with new zoom mode
    await fetch('/api/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ theme: theme, zoomMode: newZoomMode }),
    });
  };
  
  return (
    <html lang="en" className={theme}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <GoogleOAuthProvider clientId={config.GOOGLE_CLIENT_ID}>
          <Navbar 
            theme={theme}
            zoomMode={zoomMode}
            onThemeChange={handleThemeChange} 
            onZoomModeChange={handleZoomModeChange}
          />
          {children}
        </GoogleOAuthProvider>
        <ScrollRestoration />
        <script
          dangerouslySetInnerHTML={{
            __html: (currentRouteData as any)?.apolloState
              ? `window.__APOLLO_STATE__=${JSON.stringify(
                  JSON.parse(JSON.stringify((currentRouteData as any).apolloState))
                ).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/\//g, '\\u002f')};`
              : '',
          }}
        />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
