import React, { useReducer, useRef, useState } from 'react';
import { View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EDIT_USERNAME_SCREEN, RootStackParamList } from '@/constants/Navigation';
import { HeaderBackButton, ThemedView } from '@/app/components/ui';
import { SetupUsername } from '@/app/components/profile/SetupUsername';
import { getUserApolloClient } from '@/lib/apollo';
import { userDetailsReducer, userDetailsInitialState, updateUsername } from '@inkverse/shared-client/dispatch/user-details';
import type { ApolloClient } from '@apollo/client';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { mobileStorageFunctions } from '@/lib/auth/user';

export interface EditUsernameScreenParams {
  passedInUsername?: string;
}

export function EditUsernameScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<NativeStackScreenProps<RootStackParamList, typeof EDIT_USERNAME_SCREEN>['route']>();
  const { passedInUsername } = route.params || {};
  const [username, setUsername] = useState(passedInUsername || '');
  
  const userClient = getUserApolloClient();
  const userClientRef = useRef<ApolloClient | null>(null);
  userClientRef.current = userClient;

  const [userDetailsState, userDetailsDispatch] = useReducer(userDetailsReducer, userDetailsInitialState);

  const handleUsernameSubmit = async () => {
    if (!userClientRef.current || !username.trim()) return;

    try {
      const updatedUser = await updateUsername(
        { userClient: userClientRef.current as any, username: username.trim(), storageFunctions:mobileStorageFunctions },
        userDetailsDispatch
      );

      if (updatedUser) {
        navigation.goBack();
      }

    } catch (error) {
      console.error('Failed to update username:', error);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <HeaderBackButton />
      <View style={{ marginTop: 80, paddingHorizontal: 20 }}>      
        <SetupUsername
          username={username}
          setUsername={setUsername}
          userDetailsState={userDetailsState}
          onSubmit={handleUsernameSubmit}
          mode="edit"
          currentUsername={passedInUsername}
          onCancel={handleCancel}
        />
      </View>
    </ThemedView>
  );
}