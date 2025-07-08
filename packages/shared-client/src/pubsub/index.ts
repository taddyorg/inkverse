import mitt, { type Emitter } from 'mitt';
import { type PubSubEvents, type EventName, EventNames } from './types';

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

// Re-export types and constants from types file
export { EventNames, type PubSubEvents, type EventName } from './types';

// Export cache management functions
export { setupUserClientEventListeners, clearCacheEventListeners } from './cache-listeners';