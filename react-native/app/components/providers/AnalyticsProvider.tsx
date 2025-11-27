import React, { useEffect } from 'react';
import { useAnalytics, AnalyticsEvent } from '@/lib/analytics';
import { getUserDetails } from '@/lib/auth/user';

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const analytics = useAnalytics();

  useEffect(() => {
    // Check if user is authenticated and identify them
    const user = getUserDetails();
    
    if (user && user.id) {
      // Identify the user with PostHog
      analytics.identify(user.id, {
        userId: user.id,
        username: user.username || undefined,
        email: user.email || undefined,
      });
    }
  }, []);

  return <>{children}</>;
}