import { usePostHog } from 'posthog-react-native';

// Analytics event types
export enum AnalyticsEvent {
  // User events
  USER_SIGNED_UP = 'user_signed_up',
  USER_LOGGED_IN = 'user_logged_in',
  USER_LOGGED_OUT = 'user_logged_out',
}

// User properties interface
export interface UserProperties {
  userId?: string;
  username?: string | null;
  email?: string | null;
  [key: string]: any; // Allow additional properties for PostHog compatibility
}

// Event properties interface
export interface EventProperties {
  [key: string]: any;
}

// Analytics wrapper class
export class Analytics {
  private posthog: ReturnType<typeof usePostHog> | null = null;

  // Initialize with PostHog instance
  setPostHog(posthog: ReturnType<typeof usePostHog>) {
    this.posthog = posthog;
  }

  // Identify user
  identify(userId: string, properties?: UserProperties) {
    if (__DEV__) {
      console.log('Analytics: Identify user (disabled in dev)', userId, properties);
      return;
    }

    if (!this.posthog) {
      console.warn('Analytics: PostHog not initialized');
      return;
    }

    try {
      this.posthog.identify(userId, properties);
    } catch (error) {
      console.error('Analytics: Error identifying user', error);
    }
  }

  // Identify user (alias for consistency with custom approach)
  identifyUser(params: { id: string; data?: UserProperties }) {
    const { id, data } = params;
    this.identify(id, data);
  }

  // Reset user (on logout)
  reset() {
    if (__DEV__) {
      console.log('Analytics: Reset user (disabled in dev)');
      return;
    }

    if (!this.posthog) {
      console.warn('Analytics: PostHog not initialized');
      return;
    }

    try {
      this.posthog.reset();
    } catch (error) {
      console.error('Analytics: Error resetting user', error);
    }
  }

  // Reset user (alias for consistency with custom approach)
  resetUser() {
    this.reset();
  }

  // Track event
  track(event: AnalyticsEvent | string, properties?: EventProperties) {
    if (__DEV__) {
      console.log('Analytics: Track event (disabled in dev)', event, properties);
      return;
    }

    if (!this.posthog) {
      console.warn('Analytics: PostHog not initialized');
      return;
    }

    try {
      this.posthog.capture(event, properties);
    } catch (error) {
      console.error('Analytics: Error tracking event', event, error);
    }
  }

  // Track event with noun-verb pattern
  // Tip: We recommend using a '[noun] [verb]' format for your event names
  trackEvent(params: {
    noun?: string;
    verb?: string;
    overrideEventName?: string;
    data?: EventProperties;
  }) {
    const { noun, verb, overrideEventName, data } = params;
    
    if (__DEV__) {
      console.log('Analytics: Track event (disabled in dev)', { noun, verb, overrideEventName, data });
      return;
    }

    if (!this.posthog) {
      console.warn('Analytics: PostHog not initialized');
      return;
    }

    const eventName = overrideEventName || `${safeString(noun)} ${safeString(verb)}`.trim();
    
    if (!eventName) {
      console.warn('Analytics: No event name provided');
      return;
    }

    try {
      this.posthog.capture(eventName, data);
    } catch (error) {
      console.error('Analytics: Error tracking event', eventName, error);
    }
  }

  // Track screen view
  screen(screenName: string, properties?: EventProperties) {
    if (__DEV__) {
      console.log('Analytics: Screen view (disabled in dev)', screenName, properties);
      return;
    }

    if (!this.posthog) {
      console.warn('Analytics: PostHog not initialized');
      return;
    }

    try {
      this.posthog.screen(screenName, properties);
    } catch (error) {
      console.error('Analytics: Error tracking screen', screenName, error);
    }
  }

  // Track screen with formatted name
  trackScreen(params: { name: string; data?: EventProperties }) {
    const { name, data } = params;
    this.screen(safeString(name), data);
  }

  // Set user properties
  setUserProperties(properties: UserProperties) {
    if (!this.posthog) {
      console.warn('Analytics: PostHog not initialized');
      return;
    }

    try {
      // In PostHog v4, we use $set to update user properties
      this.posthog.capture('$set', { $set: properties });
    } catch (error) {
      console.error('Analytics: Error setting user properties', error);
    }
  }
}

// Utility function to format strings for event names
function safeString(str: string | undefined | null): string {
  if (!str) return '';
  return str.trim().toLowerCase();
}

// Singleton instance
export const analytics = new Analytics();

// Custom hook for using analytics in components
export function useAnalytics() {
  const posthog = usePostHog();
  
  // Initialize analytics with PostHog instance
  if (posthog && !analytics['posthog']) {
    analytics.setPostHog(posthog);
  }
  
  return analytics;
}