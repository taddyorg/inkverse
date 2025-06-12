import { useState, useReducer, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { 
  userDetailsReducer, 
  userDetailsInitialState,
  UserDetailsActionType 
} from '@inkverse/shared-client/dispatch/user-details';
import { Screen, ThemedView, ThemedText, PressableOpacity } from '@/app/components/ui';
import { SetupUsername } from '@/app/components/profile/SetupUsername';
import { SIGNUP_AGE_SCREEN } from '@/constants/Navigation';
import { getUserApolloClient } from '@/lib/apollo';
import { mobileStorageFunctions } from '@/lib/auth/user';
import { updateUsername } from '@inkverse/shared-client/dispatch/user-details';

export function SignupUsernameScreen() {
  const navigation = useNavigation();
  const [username, setUsername] = useState('');
  const [userDetailsState, dispatch] = useReducer(userDetailsReducer, userDetailsInitialState);

  const userClient = getUserApolloClient();
  const userClientRef = useRef(userClient);
  
  const handleSubmit = async () => {
    dispatch({ type: UserDetailsActionType.USER_DETAILS_CLEAR_ERROR });

    if (!userClientRef.current) return;

    try {
      // Validate username
      if (!username.trim()) {
        throw new Error('Username is required');
      }

      // Update username via API
      await updateUsername(
        { 
          userClient: userClientRef.current,
          username: username.trim(),
          storageFunctions: mobileStorageFunctions,
        },
        dispatch
      );

      // Save username and move to next step
      navigation.navigate(SIGNUP_AGE_SCREEN);
    } catch (err: any) {
      // Error is handled by the dispatch function
      console.error(err);
    }
  };

  return (
    <Screen>
      <View style={styles.container}>
        <ThemedView style={{flex: 1, width: '100%' }}>
          <ThemedText size="title" style={styles.title}>
            Complete your profile
          </ThemedText>
          <SetupUsername
            username={username}
            setUsername={setUsername}
            userDetailsState={userDetailsState}
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
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
});