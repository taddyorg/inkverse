import React, { useReducer, useRef, useState } from 'react';
import { View } from 'react-native';
import { HeaderBackButton, ThemedView } from '@/app/components/ui';
import { SetupAge } from '@/app/components/profile/SetupAge';
import { getUserApolloClient } from '@/lib/apollo';
import { userDetailsReducer, userDetailsInitialState, updateAgeRange } from '@inkverse/shared-client/dispatch/user-details';
import { UserAgeRange } from '@inkverse/shared-client/graphql/operations';
import type { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EDIT_AGE_SCREEN, RootStackParamList } from '@/constants/Navigation';

export interface EditAgeScreenParams {
  passedInAgeRange?: UserAgeRange;
  passedInBirthYear?: number;
}

export function EditAgeScreen() {
  const navigation = useNavigation();
  const route = useRoute<NativeStackScreenProps<RootStackParamList, typeof EDIT_AGE_SCREEN>['route']>();
  const { passedInAgeRange, passedInBirthYear } = route.params || {};
  
  const [ageRange, setAgeRange] = useState<UserAgeRange | ''>(passedInAgeRange || '');
  const [birthYear, setBirthYear] = useState(passedInBirthYear?.toString() || '');

  const userClient = getUserApolloClient();
  const userClientRef = useRef<ApolloClient<NormalizedCacheObject> | null>(null);
  userClientRef.current = userClient;
  
  const [userDetailsState, userDetailsDispatch] = useReducer(userDetailsReducer, userDetailsInitialState);

  const handleAgeSubmit = async () => {
    if (!userClientRef.current || !ageRange) return;

    try {
      const birthYearInt = ageRange === UserAgeRange.UNDER_18 && birthYear ? parseInt(birthYear, 10) : undefined;
      
      const updatedUser = await updateAgeRange(
        { 
          userClient: userClientRef.current as any, 
          ageRange,
          birthYear: birthYearInt,
        },
        userDetailsDispatch
      );

      if (updatedUser) {
        navigation.goBack();
      }
    } catch (error) {
      console.error('Failed to update age:', error);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <HeaderBackButton />
      <View style={{ marginTop: 80, paddingHorizontal: 20 }}>
        <SetupAge
          ageRange={ageRange}
          setAgeRange={setAgeRange}
          birthYear={birthYear}
          setBirthYear={setBirthYear}
          userDetailsState={userDetailsState}
          onSubmit={handleAgeSubmit}
          mode="edit"
          currentAgeRange={passedInAgeRange}
          currentBirthYear={passedInBirthYear}
          onCancel={handleCancel}
        />
      </View>
    </ThemedView>
  );
}