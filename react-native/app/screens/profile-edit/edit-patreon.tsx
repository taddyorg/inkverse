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
import { HeaderBackButton, ThemedView } from '@/app/components/ui';
import { on, off, EventNames, emit } from '@inkverse/shared-client/pubsub';
import { saveHostingProviderRefreshToken, refreshHostingProviderAccessToken } from '@/lib/auth/hosting-provider';
import { TADDY_HOSTING_PROVIDER_UUID } from '@inkverse/public/hosting-providers';

export interface EditPatreonScreenParams {
  context?: 'signup' | 'profile';
}

export function EditPatreonScreen() {
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

        const user = getUserDetails();
        if (!user || !user.id) { return; }

        emit(EventNames.USER_PROFILE_UPDATED, { userId: user.id });
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

    openURL({ url });
  }, []);

  const handleSkip = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleBackToUnconnected = useCallback(() => {
    setCurrentStep('patreon');
  }, []);

  const handleContinue = useCallback(async () => {
    if (!userClientRef.current) return;

    const user = getUserDetails();
    if (!user || !user.id) { return; }

    try {
      // Extract UUIDs from the comic series
      const seriesUuids = (userDetailsState.patreonComicSeries || []).map(series => series.uuid).filter(Boolean);
      
      if (seriesUuids.length > 0) {
        await subscribeToPatreonComics({ 
          userClient: userClientRef.current,
          seriesUuids,
          userId: user.id,
        }, dispatch);
      }

      navigation.goBack();
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
    <ThemedView style={styles.container}>
      <HeaderBackButton />
      {content}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});