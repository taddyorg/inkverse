import React, { useReducer, useRef, useState } from 'react';
import { View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EDIT_EMAIL_SCREEN, RootStackParamList } from '@/constants/Navigation';
import { HeaderBackButton, ThemedView } from '@/app/components/ui';
import { SetupEmail } from '@/app/components/profile/SetupEmail';
import { getUserApolloClient } from '@/lib/apollo';
import { userDetailsReducer, userDetailsInitialState, updateUserEmail } from '@inkverse/shared-client/dispatch/user-details';
import type { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { useNavigation, useRoute } from '@react-navigation/native';
import { mobileStorageFunctions } from '@/lib/auth/user';

export interface EditEmailScreenParams {
  passedInEmail?: string;
}

export function EditEmailScreen() {
  const navigation = useNavigation();
  const route = useRoute<NativeStackScreenProps<RootStackParamList, typeof EDIT_EMAIL_SCREEN>['route']>();
  const { passedInEmail } = route.params || {};
  const [email, setEmail] = useState(passedInEmail || '');

  const userClient = getUserApolloClient();
  const userClientRef = useRef<ApolloClient<NormalizedCacheObject> | null>(null);
  userClientRef.current = userClient;

  const [userDetailsState, userDetailsDispatch] = useReducer(userDetailsReducer, userDetailsInitialState);

  const handleEmailSubmit = async () => {
    if (!userClientRef.current || !email.trim()) return;

    try {
      const updatedUser = await updateUserEmail(
        { userClient: userClientRef.current as any, email: email.trim(), storageFunctions:mobileStorageFunctions },
        userDetailsDispatch
      );

      if (updatedUser) {
        // Update auth state with new email
        navigation.goBack();
      }
    } catch (error) {
      console.error('Failed to update email:', error);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <HeaderBackButton />
      <View style={{ marginTop: 80, paddingHorizontal: 20 }}>
        <SetupEmail
          email={email}
          setEmail={setEmail}
          userDetailsState={userDetailsState}
          onSubmit={handleEmailSubmit}
          mode="edit"
          currentEmail={passedInEmail}
          onCancel={handleCancel}
        />
      </View>
    </ThemedView>
  );
}