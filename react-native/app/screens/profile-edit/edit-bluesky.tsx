import React, { useState, useReducer, useRef, useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { 
  userDetailsReducer,
  userDetailsInitialState,
  UserDetailsActionType,
  verifyBlueskyHandle,
  saveBlueskyDid,
  getComicsFromBlueskyCreators,
  subscribeToComics,
} from '@inkverse/shared-client/dispatch/user-details';
import { isValidDomain } from '@inkverse/shared-client/utils/common';
import { HeaderBackButton, ThemedView } from '@/app/components/ui';
import { SetupBluesky } from '@/app/components/profile/SetupBluesky';
import { BlueskyConnected } from '@/app/components/profile/BlueskyConnected';
import { getUserApolloClient } from '@/lib/apollo';

export interface EditBlueskyScreenParams {
  context?: 'signup' | 'profile';
}

export function EditBlueskyScreen() {
  const navigation = useNavigation();
  const [currentStep, setCurrentStep] = useState<'bluesky' | 'bluesky-verify' | 'bluesky-connected'>('bluesky');
  const [blueskyHandle, setBlueskyHandle] = useState('');
  
  const [userDetailsState, dispatch] = useReducer(userDetailsReducer, userDetailsInitialState);
  const userClient = getUserApolloClient();
  const userClientRef = useRef(userClient);

  const handleBack = useCallback(() => {
    if (currentStep === 'bluesky-verify') {
      setCurrentStep('bluesky');
    } else if (currentStep === 'bluesky-connected') {
      setCurrentStep('bluesky');
    } else {
      navigation.goBack();
    }
    dispatch({ type: UserDetailsActionType.USER_DETAILS_CLEAR_ERROR });
  }, [currentStep, navigation]);

  const handleSkip = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleBlueskyVerify = useCallback(async () => {
    dispatch({ type: UserDetailsActionType.USER_DETAILS_CLEAR_ERROR });

    if (!userClientRef.current) return;

    if (!isValidDomain(blueskyHandle)) {
      dispatch({ 
        type: UserDetailsActionType.USER_DETAILS_ERROR, 
        payload: 'Invalid Bluesky handle. Make sure you use your full handle (ex: yourhandle.bsky.social)' 
      });
      return;
    }

    try {
      // Verify the Bluesky handle
      await verifyBlueskyHandle(
        { 
          userClient: userClientRef.current,
          handle: blueskyHandle.trim() 
        },
        dispatch
      );

      setCurrentStep('bluesky-verify');
    } catch (err: any) {
      // Error is handled by the dispatch function
      console.error('Error verifying Bluesky handle:', err);
    }
  }, [blueskyHandle]);

  const handleBlueskyDidSave = useCallback(async (did: string) => {
    dispatch({ type: UserDetailsActionType.USER_DETAILS_CLEAR_ERROR });

    if (!userClientRef.current) return;

    try {
      // Save Bluesky DID
      await saveBlueskyDid(
        { 
          userClient: userClientRef.current,
          did,
        },
        dispatch
      );

      // Get comics from Bluesky creators after saving DID  
      await getComicsFromBlueskyCreators(
        { userClient: userClientRef.current },
        dispatch
      );
      
      setCurrentStep('bluesky-connected');
    } catch (err: any) {
      // Error is handled by the dispatch function
      console.error('Error saving Bluesky DID:', err);
    }
  }, []);

  const handleSubscribeToBlueskyComics = useCallback(async () => {
    if (!userClientRef.current) return;

    try {
      // Extract UUIDs from the comic series
      const seriesUuids = (userDetailsState.blueskyComicSeries || [])
        .map(series => series.uuid)
        .filter(Boolean);
      
      if (seriesUuids.length === 0) {
        navigation.goBack();
        return;
      }

      const result = await subscribeToComics({ 
        userClient: userClientRef.current,
        seriesUuids
      }, dispatch);

      if (result.success) {
        navigation.goBack();
      }
    } catch (err) {
      console.error('Error subscribing to Bluesky comics:', err);
      // Error is handled by dispatch
    }
  }, [navigation, userDetailsState.blueskyComicSeries]);

  // Show appropriate content based on state
  if (currentStep === 'bluesky-connected') {
    return (
      <ThemedView style={styles.container}>
        <HeaderBackButton onPress={handleBack} />
        <BlueskyConnected 
          handle={blueskyHandle}
          loading={userDetailsState.isLoading || userDetailsState.blueskySubscriptionLoading}
          error={userDetailsState.error || userDetailsState.blueskySubscriptionError}
          comicSeries={userDetailsState.blueskyComicSeries}
          onContinue={handleSubscribeToBlueskyComics}
          onSkip={handleSkip}
        />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <HeaderBackButton onPress={handleBack} />
      <SetupBluesky
        blueskyHandle={blueskyHandle}
        setBlueskyHandle={setBlueskyHandle}
        userDetailsState={userDetailsState}
        currentStep={currentStep as 'bluesky' | 'bluesky-verify'}
        onVerify={handleBlueskyVerify}
        onConfirm={handleBlueskyDidSave}
        onBack={handleBack}
        onSkip={handleSkip}
        mode="settings"
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});