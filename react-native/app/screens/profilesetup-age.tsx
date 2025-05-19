import { useState, useReducer } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useApolloClient } from '@apollo/client';
import { UserAgeRange } from '@inkverse/public/graphql/types';
import { 
  authReducer, 
  authInitialState,
  AuthActionType
} from '@inkverse/shared-client/dispatch/authentication';
import { Screen, ThemedView, ThemedText, ThemedButton } from '@/app/components/ui';
import { Colors, useThemeColor } from '@/constants/Colors';
import { HOME_SCREEN } from '@/constants/Navigation';

export function ProfileSetupAgeScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const apolloClient = useApolloClient();
  // @ts-ignore - params from previous screen
  const username = route.params?.username;
  
  const [ageRange, setAgeRange] = useState<UserAgeRange | ''>('');
  const [birthYear, setBirthYear] = useState('');
  const [authState, dispatch] = useReducer(authReducer, authInitialState);
  
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor(
    { light: Colors.light.background, dark: Colors.dark.background },
    'background'
  );
  const errorColor = useThemeColor(
    { light: '#dc2626', dark: '#ef4444' },
    'text'
  );

  const handleSubmit = async () => {
    dispatch({ type: AuthActionType.AUTH_CLEAR_ERROR });

    try {
      // Validate inputs
      if (!ageRange) {
        throw new Error('Age range is required');
      }
      if (ageRange === UserAgeRange.UNDER_18 && !birthYear) {
        throw new Error('Birth year is required for users under 18');
      }

      // Call updateUserProfile mutation with both username and age
      // await dispatchUpdateUserProfile(
      //   { 
      //     publicClient: apolloClient,
      //     username: username,
      //     ageRange,
      //     birthYear: birthYear ? parseInt(birthYear) : undefined,
      //   },
      //   dispatch
      // );

      // Navigate to home after successful update
      navigation.navigate(HOME_SCREEN);
    } catch (err: any) {
      dispatch({ type: AuthActionType.AUTH_ERROR, payload: err.message });
    }
  };

  const currentYear = new Date().getFullYear();
  const minYear = currentYear - 100;
  const maxYear = currentYear - 13; // Must be at least 13 years old

  const yearOptions = Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i);

  return (
    <Screen>
      <View style={styles.container}>
        <ThemedView style={[styles.card, { backgroundColor }]}>
          <ThemedText size="title" style={styles.title}>
            How old are you?
          </ThemedText>
          
          <ThemedText style={styles.subtitle}>
            This helps us provide age-appropriate content
          </ThemedText>
          
          {authState.error && (
            <View style={[styles.errorContainer, { backgroundColor: errorColor + '20' }]}>
              <ThemedText style={[styles.errorText, { color: errorColor }]}>
                {authState.error}
              </ThemedText>
            </View>
          )}

          <View style={styles.formContainer}>
            <View style={[styles.pickerContainer, { borderColor }]}>
              {/* <Picker
                selectedValue={ageRange}
                onValueChange={(value) => setAgeRange(value as UserAgeRange)}
                style={[styles.picker, { color: textColor }]}
              >
                <Picker.Item label="Select your age range" value="" />
                <Picker.Item label="Under 18" value={UserAgeRange.UNDER_18} />
                <Picker.Item label="18 to 24" value={UserAgeRange.AGE_18_24} />
                <Picker.Item label="25 to 34" value={UserAgeRange.AGE_25_34} />
                <Picker.Item label="35+" value={UserAgeRange.AGE_35_PLUS} />
              </Picker> */}
            </View>

            {ageRange === UserAgeRange.UNDER_18 && (
              <View style={styles.birthYearContainer}>
                <ThemedText style={styles.label}>Birth Year</ThemedText>
                <View style={[styles.pickerContainer, { borderColor }]}>
                  {/* <Picker
                    selectedValue={birthYear}
                    onValueChange={(value) => setBirthYear(value)}
                    style={[styles.picker, { color: textColor }]}
                  >
                    <Picker.Item label="Select your birth year" value="" />
                    {yearOptions.map(year => (
                      <Picker.Item key={year} label={year.toString()} value={year.toString()} />
                    ))}
                  </Picker> */}
                </View>
              </View>
            )}

            <ThemedButton
              buttonText={authState.isLoading ? 'Creating profile...' : 'Complete'}
              onPress={handleSubmit}
              disabled={authState.isLoading || !ageRange || (ageRange === UserAgeRange.UNDER_18 && !birthYear)}
              style={[
                styles.submitButton,
                (authState.isLoading || !ageRange || (ageRange === UserAgeRange.UNDER_18 && !birthYear)) && styles.submitButtonDisabled
              ]}
            />
          </View>

          <ThemedText style={styles.legalText}>
            By completing your profile, you agree to our{' '}
            <ThemedText 
              style={[styles.legalLink, { color: Colors.light.tint }]}
              onPress={() => {/* TODO: Open terms */}}
            >
              Terms of Service
            </ThemedText>{' '}
            and{' '}
            <ThemedText 
              style={[styles.legalLink, { color: Colors.light.tint }]}
              onPress={() => {/* TODO: Open privacy */}}
            >
              Privacy Policy
            </ThemedText>
          </ThemedText>
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
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    maxWidth: 400,
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
  errorContainer: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
  },
  formContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  birthYearContainer: {
    marginTop: 20,
  },
  submitButton: {
    marginTop: 24,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  legalText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  legalLink: {
    textDecorationLine: 'underline',
  },
});