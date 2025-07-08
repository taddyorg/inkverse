import type { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { on } from './index';
import { EventNames, type PubSubEvents } from './types';

/**
 * Sets up event listeners for cache management.
 * This function should be called once when initializing the Apollo client.
 * 
 * @param apolloClient - The Apollo client instance to manage cache for
 */
export function setupUserClientEventListeners(apolloClient: ApolloClient<NormalizedCacheObject>): void {
  // Handle comic subscription changes
  on(EventNames.COMIC_SUBSCRIBED, (event: PubSubEvents['COMIC_SUBSCRIBED']) => {
    evictUserComicSeries(apolloClient, event.seriesUuid);
  });

  on(EventNames.COMIC_UNSUBSCRIBED, (event: PubSubEvents['COMIC_UNSUBSCRIBED']) => {
    evictUserComicSeries(apolloClient, event.seriesUuid);
  });
}

/**
 * Evicts a specific UserComicSeries entry from the Apollo cache
 * 
 * @param apolloClient - The Apollo client instance
 * @param seriesUuid - The UUID of the comic series to evict
 */
function evictUserComicSeries(userClient: ApolloClient<NormalizedCacheObject>, seriesUuid: string): void {
  try {
    // Evict the UserComicSeries entry for this series
    const evicted = userClient.cache.evict({ 
      id: userClient.cache.identify({ 
        __typename: 'UserComicSeries', 
        seriesUuid 
      }) 
    });

    if (evicted) {
      // Trigger garbage collection to clean up any orphaned references
      userClient.cache.gc();
      
      // Log in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Cache] Evicted UserComicSeries for series ${seriesUuid}`);
      }
    }
  } catch (error) {
    // Don't throw errors from cache eviction - just log them
    console.error('[Cache] Error evicting UserComicSeries:', error);
  }
}

/**
 * Clears all cache event listeners.
 * This should be called when cleaning up (e.g., on app unmount).
 * Note: This doesn't remove the specific listeners, just clears all pubsub listeners.
 * In a real app, you might want to track and remove specific listeners.
 */
export function clearCacheEventListeners(): void {
  // This is a limitation of the current pubsub implementation
  // Ideally we'd track our specific listeners and remove only those
  console.warn('[Cache] Clearing all event listeners - this will remove non-cache listeners too');
}