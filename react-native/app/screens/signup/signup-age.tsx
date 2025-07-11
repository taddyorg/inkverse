import { useState, useReducer } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { UserAgeRange } from '@inkverse/public/graphql/types';
import { updateAgeRange, UserDetailsActionType, userDetailsInitialState, userDetailsReducer } from '@inkverse/shared-client/dispatch/user-details';
import { Screen, ThemedView, HeaderBackButton } from '@/app/components/ui';
import { SetupAge } from '@/app/components/profile/SetupAge';
import { useThemeColor } from '@/constants/Colors';
import { SIGNUP_NOTIFICATIONS_SCREEN } from '@/constants/Navigation';
import { getUserApolloClient } from '@/lib/apollo';

export function SignupAgeScreen() {
  const navigation = useNavigation();
  
  const [ageRange, setAgeRange] = useState<UserAgeRange | ''>('');
  const [birthYear, setBirthYear] = useState('');
  const [userDetailsState, dispatch] = useReducer(userDetailsReducer, userDetailsInitialState);
  
  const backgroundColor = useThemeColor({}, 'background');

  const handleSubmit = async () => {
    try {
      dispatch({ type: UserDetailsActionType.USER_DETAILS_CLEAR_ERROR });
      const userClient = getUserApolloClient();

      if (!userClient) return;

      // Validate inputs
      if (!ageRange) {
        throw new Error('Age range is required');
      }
      if (ageRange === UserAgeRange.UNDER_18 && !birthYear) {
        throw new Error('Birth year is required for users under 18');
      }

      // Call updateAgeRange mutation
      await updateAgeRange(
        { 
          userClient,
          ageRange,
          birthYear: birthYear ? parseInt(birthYear) : undefined,
        },
        dispatch as any
      );

      // Navigate to Notifications screen after successful update
      navigation.navigate(SIGNUP_NOTIFICATIONS_SCREEN, { isReturningUser: false });
    } catch (err: any) {
      dispatch({ type: UserDetailsActionType.USER_DETAILS_ERROR, payload: err.message });
    }
  };

  return (
    <Screen>
      <View style={styles.container}>
        <HeaderBackButton />
        <ThemedView style={[styles.card, { backgroundColor }]}>
          <SetupAge
            ageRange={ageRange}
            userDetailsState={userDetailsState}
            setAgeRange={setAgeRange}
            birthYear={birthYear}
            setBirthYear={setBirthYear}
            onSubmit={handleSubmit}
            mode="setup"
          />
        </ThemedView>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.8,
  },
  legalText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 24,
  },
  legalLink: {
    textDecorationLine: 'underline',
  },
});