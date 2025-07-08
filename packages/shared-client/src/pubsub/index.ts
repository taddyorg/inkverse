import mitt, { type Emitter } from 'mitt';

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
};

// Create a typed mitt instance
export const pubsub: Emitter<PubSubEvents> = mitt<PubSubEvents>();

// Export convenience methods with proper typing
export const emit = pubsub.emit;
export const on = pubsub.on;
export const off = pubsub.off;

// Helper function to clear all listeners (useful for cleanup)
export const clearAllListeners = () => {
  pubsub.all.clear();
};

// Type-safe event names export for consumers who prefer string constants
export const EventNames = {
  USER_AUTHENTICATED: 'USER_AUTHENTICATED',
  USER_LOGGED_OUT: 'USER_LOGGED_OUT',
  HOSTING_PROVIDER_CONNECTED: 'HOSTING_PROVIDER_CONNECTED',
  COMIC_SUBSCRIBED: 'COMIC_SUBSCRIBED',
  COMIC_UNSUBSCRIBED: 'COMIC_UNSUBSCRIBED',
} as const;

// Export type for event names
export type EventName = keyof PubSubEvents;