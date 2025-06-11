import { useState, useReducer } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { 
  authReducer, 
  authInitialState,
  AuthActionType
} from '@inkverse/shared-client/dispatch/authentication';
import { Screen, ThemedView, ThemedText, PressableOpacity } from '@/app/components/ui';
import { SetupUsername } from '@/app/components/profile/SetupUsername';
import { useThemeColor } from '@/constants/Colors';
import { SIGNUP_AGE_SCREEN } from '@/constants/Navigation';

export function SignupUsernameScreen() {
  const navigation = useNavigation();
  const [username, setUsername] = useState('');
  const [authState, dispatch] = useReducer(authReducer, authInitialState);
  
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text'); 
  const handleSubmit = async () => {
    dispatch({ type: AuthActionType.AUTH_CLEAR_ERROR });

    try {
      // For now, just store username in state and navigate to age selection
      // The actual mutation will be called after both steps are complete
      navigation.navigate(SIGNUP_AGE_SCREEN);
      
    } catch (err: any) {
      dispatch({ type: AuthActionType.AUTH_ERROR, payload: err.message });
    }
  };

  return (
    <Screen>
      <View style={styles.container}>
        <ThemedView style={{flex: 1, backgroundColor, width: '100%' }}>
          <ThemedText size="title" style={styles.title}>
            Complete your profile
          </ThemedText>
          <SetupUsername
            username={username}
            setUsername={setUsername}
            authState={authState}
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