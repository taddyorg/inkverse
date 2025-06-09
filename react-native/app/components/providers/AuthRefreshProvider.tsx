import React, { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { refreshAccessToken, refreshRefreshToken, clearUserData, getRefreshToken } from '@/lib/auth/user';
import { fetchAllHostingProviderTokens } from '@inkverse/shared-client/dispatch/hosting-provider';
import { saveHostingProviderRefreshToken, refreshHostingProviderAccessToken } from '@/lib/auth/hosting-provider';
import { getUserApolloClient } from '@/lib/apollo';

interface AuthRefreshProviderProps {
  children: React.ReactNode;
}

// Refresh token every 15 minutes
const REFRESH_INTERVAL = 15 * 60 * 1000;

export function AuthRefreshProvider({ children }: AuthRefreshProviderProps) {
  const appState = useRef(AppState.currentState);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastRefreshTimeRef = useRef<number>(Date.now());
  const userClient = getUserApolloClient();

  const startTokenRefreshInterval = async () => {
    // Clear any existing interval
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    // Check if we have a refresh token before starting the interval
    const hasRefreshToken = await getRefreshToken();
    if (!hasRefreshToken) {
      console.log('🚫 No refresh token available, skipping interval setup');
      return;
    }

    // Set up the new interval
    refreshIntervalRef.current = setInterval(async () => {
      try {
        // Double-check we still have a refresh token before attempting refresh
        const currentRefreshToken = await getRefreshToken();
        if (!currentRefreshToken) {
          console.log('🚫 No refresh token available, stopping interval');
          stopTokenRefreshInterval();
          return;
        }

        console.log('⚡ Performing scheduled token refresh...');
        await refreshAccessToken();
        lastRefreshTimeRef.current = Date.now();
      } catch (error) {
        console.error('❌ Scheduled token refresh failed:', error);
      }
    }, REFRESH_INTERVAL);

    console.log('✅ Token refresh interval started (every 15 minutes)');
  };

  const stopTokenRefreshInterval = () => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
      console.log('⏹️ Token refresh interval stopped');
    }
  };

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    console.log('📱 App state changed:', appState.current, '->', nextAppState);

    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      // App has come to the foreground
      console.log('🔄 App came to foreground, checking token refresh...');

      const timeSinceLastRefresh = Date.now() - lastRefreshTimeRef.current;
      const shouldRefresh = timeSinceLastRefresh >= REFRESH_INTERVAL;

      if (shouldRefresh) {
        console.log('⚡ Time since last refresh:', Math.round(timeSinceLastRefresh / 1000), 'seconds');
        console.log('⚡ Performing immediate token refresh...');
        try {
          await refreshAccessToken();
          lastRefreshTimeRef.current = Date.now();
        } catch (error) {
          console.error('❌ Immediate token refresh failed:', error);
        }
      }

      // Always restart the interval when app comes to foreground
      await startTokenRefreshInterval();
    } else if (nextAppState.match(/inactive|background/)) {
      // App has gone to the background
      console.log('📱 App went to background, stopping refresh interval');
      stopTokenRefreshInterval();
    }

    appState.current = nextAppState;
  };

  useEffect(() => {
    // Initialize token refresh system when component mounts
    const initializeTokenRefresh = async () => {
      console.log('🔄 Initializing auth refresh system...');
      
      // Check if we have a refresh token
      const hasRefreshToken = await getRefreshToken();
      if (!hasRefreshToken) {
        console.log('🚫 No refresh token available, skipping initial refresh');
        await clearUserData();
        return;
      }

      // Perform initial token refresh on app open
      try {
        console.log('⚡ Performing initial token refresh...');
        await Promise.allSettled([
          refreshAccessToken(),
          refreshRefreshToken(),
          fetchAllHostingProviderTokens({ 
            userClient: userClient as any, 
            saveHostingProviderRefreshToken, 
            refreshHostingProviderAccessToken 
          })
        ]);
        
        lastRefreshTimeRef.current = Date.now();
        console.log('✅ Initial token refresh completed');
      } catch (error) {
        console.error('❌ Initial token refresh failed:', error);
      }

      // Start the periodic refresh interval
      await startTokenRefreshInterval();
    };
    
    initializeTokenRefresh();

    // Set up app state listener
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Cleanup function
    return () => {
      stopTokenRefreshInterval();
      subscription?.remove();
    };
  }, []);

  return <>{children}</>;
} 