// Define all event types for type safety
export type PubSubEvents = {
  // Authentication events
  USER_AUTHENTICATED: { userId: string };
  USER_LOGGED_OUT: undefined;
  
  // Hosting provider events (existing pattern from React Native)
  HOSTING_PROVIDER_CONNECTED: { hostingProviderUuid: string; success: boolean };
  
  // Comic subscription events
  COMIC_SUBSCRIBED: { seriesUuid: string; userId: string };
  COMIC_UNSUBSCRIBED: { seriesUuid: string; userId: string };
  
  // User profile events
  USER_PROFILE_UPDATED: { userId: string; };
};

// Type-safe event names export for consumers who prefer string constants
export const EventNames = {
  USER_AUTHENTICATED: 'USER_AUTHENTICATED',
  USER_LOGGED_OUT: 'USER_LOGGED_OUT',
  HOSTING_PROVIDER_CONNECTED: 'HOSTING_PROVIDER_CONNECTED',
  COMIC_SUBSCRIBED: 'COMIC_SUBSCRIBED',
  COMIC_UNSUBSCRIBED: 'COMIC_UNSUBSCRIBED',
  USER_PROFILE_UPDATED: 'USER_PROFILE_UPDATED',
} as const;

// Export type for event names
export type EventName = keyof PubSubEvents; 