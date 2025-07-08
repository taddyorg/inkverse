import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getAuthorizationCodeUrl } from '@inkverse/public/hosting-providers';
import config from '@/config';
import { getUserDetails } from '@/lib/auth/user';
import { SetupPatreon } from '@/app/components/profile/SetupPatreon';
import { PatreonConnected } from '@/app/components/profile/PatreonConnected';
import { openURL } from '@/lib/utils';
import { getUserApolloClient } from '@/lib/apollo';
import { 
  userDetailsReducer,
  userDetailsInitialState,
  getComicsFromPatreonCreators,
  subscribeToPatreonComics,
} from '@inkverse/shared-client/dispatch/user-details';
import { fetchAllHostingProviderTokens } from '@inkverse/shared-client/dispatch/hosting-provider';
import { Screen, ThemedView } from '@/app/components/ui';
import { on, off, EventNames } from '@inkverse/shared-client/pubsub';
import { SIGNUP_BLUESKY_SCREEN } from '@/constants/Navigation';
import { saveHostingProviderRefreshToken, refreshHostingProviderAccessToken } from '@/lib/auth/hosting-provider';
import { TADDY_HOSTING_PROVIDER_UUID } from '@inkverse/public/hosting-providers';

export interface SignupPatreonScreenParams {
  context?: 'signup' | 'profile';
}

export function SignupPatreonScreen() {
  const navigation = useNavigation();
  const [currentStep, setCurrentStep] = useState<'patreon' | 'patreon-connected'>('patreon');
  
  const [userDetailsState, dispatch] = useReducer(userDetailsReducer, userDetailsInitialState);
  const userClient = getUserApolloClient();
  const userClientRef = useRef(userClient);

  // Listen for hosting provider connection events
  useEffect(() => {
    const handleHostingProviderConnected = async (data: { hostingProviderUuid: string; success: boolean }) => {
      // Check if this is the Patreon provider
      if (data.hostingProviderUuid === TADDY_HOSTING_PROVIDER_UUID && data.success) {
        setCurrentStep('patreon-connected');
        
        // Fetch hosting provider tokens to ensure we have the latest connection
        await fetchAllHostingProviderTokens({ 
          userClient: userClientRef.current, 
          saveHostingProviderRefreshToken, 
          refreshHostingProviderAccessToken 
        });
        
        // Fetch comics from Patreon creators
        await getComicsFromPatreonCreators(
          { userClient: userClientRef.current },
          dispatch
        );
      }
    };

    on(EventNames.HOSTING_PROVIDER_CONNECTED, handleHostingProviderConnected);

    // Cleanup subscription on unmount
    return () => {
      off(EventNames.HOSTING_PROVIDER_CONNECTED, handleHostingProviderConnected);
    };
  }, []);

  const handleConnect = useCallback(async () => {
    const user = getUserDetails();

    if (!user || !user.id) {
      console.error('User not found');
      return;
    }

    const url = getAuthorizationCodeUrl({
      hostingProviderUuid: TADDY_HOSTING_PROVIDER_UUID,
      clientId: config.TADDY_CLIENT_ID,
      clientUserId: user.id,
    });

    // Open OAuth URL in external browser
    openURL({ url });
  }, []);

  const handleSkip = useCallback(() => {
    navigation.navigate(SIGNUP_BLUESKY_SCREEN);
  }, [navigation]);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleBackToUnconnected = useCallback(() => {
    setCurrentStep('patreon');
  }, []);

  const handleContinue = useCallback(async () => {
    if (!userClientRef.current) return;

    try {
      // Extract UUIDs from the comic series
      const seriesUuids = (userDetailsState.patreonComicSeries || []).map(series => series.uuid).filter(Boolean);
      
      if (seriesUuids.length > 0) {
        await subscribeToPatreonComics({ 
          userClient: userClientRef.current,
          seriesUuids
        }, dispatch);
      }

      navigation.navigate(SIGNUP_BLUESKY_SCREEN);
    } catch (err) {
      console.error('Error subscribing to Patreon comics:', err);
    }
  }, [navigation, userDetailsState.patreonComicSeries]);

  // Show appropriate content based on state
  const content = currentStep === 'patreon-connected' ? (
    <PatreonConnected
      loading={userDetailsState.isLoading}
      error={userDetailsState.error}
      comicSeries={userDetailsState.patreonComicSeries}
      onContinue={handleContinue}
      onSkip={handleSkip}
      onBackToUnconnected={handleBackToUnconnected}
    />
  ) : (
    <SetupPatreon
      currentStep="patreon"
      onConnect={handleConnect}
      onSkip={handleSkip}
      onBack={handleBack}
      onContinue={handleBack}
    />
  );

  return (
    <Screen>
      <ThemedView style={styles.container}>
        {content}
      </ThemedView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  signupContainer: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});