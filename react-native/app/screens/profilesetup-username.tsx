// import { useState, useReducer } from 'react';
// import { StyleSheet, View, TextInput } from 'react-native';
// import { useNavigation } from '@react-navigation/native';
// import { useApolloClient } from '@apollo/client';
// import { 
//   authReducer, 
//   authInitialState,
//   AuthActionType
// } from '@inkverse/shared-client/dispatch/authentication';
// import { Screen, ThemedView, ThemedText, ThemedButton } from '@/app/components/ui';
// import { Colors, useThemeColor } from '@/constants/Colors';
// import { PROFILE_SETUP_AGE_SCREEN } from '@/constants/Navigation';

// export function ProfileSetupUsernameScreen() {
//   const navigation = useNavigation();
//   const apolloClient = useApolloClient();
//   const [username, setUsername] = useState('');
//   const [authState, dispatch] = useReducer(authReducer, authInitialState);
  
//   const backgroundColor = useThemeColor({}, 'background');
//   const textColor = useThemeColor({}, 'text');
//   const borderColor = useThemeColor(
//     { light: Colors.light.background, dark: Colors.dark.background },
//     'background'
//   );
//   const errorColor = useThemeColor(
//     { light: '#dc2626', dark: '#ef4444' },
//     'text'
//   );

//   const handleSubmit = async () => {
//     dispatch({ type: AuthActionType.AUTH_CLEAR_ERROR });

//     try {
//       // Validate input
//       if (!username.trim()) {
//         throw new Error('Username is required');
//       }

//       // For now, just store username in state and navigate to age selection
//       // The actual mutation will be called after both steps are complete
//       navigation.navigate(PROFILE_SETUP_AGE_SCREEN, { username: username.trim() });
      
//     } catch (err: any) {
//       dispatch({ type: AuthActionType.AUTH_ERROR, payload: err.message });
//     }
//   };

//   return (
//     <Screen>
//       <View style={styles.container}>
//         <ThemedView style={[styles.card, { backgroundColor }]}>
//           <ThemedText size="title" style={styles.title}>
//             Choose your username
//           </ThemedText>
          
//           <ThemedText style={styles.subtitle}>
//             This is how other users will see you on Inkverse
//           </ThemedText>
          
//           {authState.error && (
//             <View style={[styles.errorContainer, { backgroundColor: errorColor + '20' }]}>
//               <ThemedText style={[styles.errorText, { color: errorColor }]}>
//                 {authState.error}
//               </ThemedText>
//             </View>
//           )}

//           <TextInput
//             style={[styles.input, { color: textColor, borderColor }]}
//             value={username}
//             onChangeText={setUsername}
//             placeholder="Enter username"
//             placeholderTextColor={textColor + '80'}
//             autoCapitalize="none"
//             autoCorrect={false}
//             autoFocus={true}
//           />

//           <ThemedButton
//             buttonText="Next"
//             onPress={handleSubmit}
//             disabled={authState.isLoading || !username.trim()}
//             style={[
//               styles.submitButton,
//               (authState.isLoading || !username.trim()) && styles.submitButtonDisabled
//             ]}
//           />
//         </ThemedView>
//       </View>
//     </Screen>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: 16,
//   },
//   card: {
//     borderRadius: 12,
//     padding: 24,
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 2,
//     },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 5,
//     maxWidth: 400,
//     width: '100%',
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: '700',
//     marginBottom: 16,
//     textAlign: 'center',
//   },
//   subtitle: {
//     fontSize: 16,
//     textAlign: 'center',
//     marginBottom: 32,
//     opacity: 0.8,
//   },
//   errorContainer: {
//     borderRadius: 8,
//     padding: 12,
//     marginBottom: 16,
//   },
//   errorText: {
//     fontSize: 14,
//   },
//   input: {
//     borderWidth: 1,
//     borderRadius: 8,
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     fontSize: 16,
//     marginBottom: 24,
//   },
//   submitButton: {
//     marginTop: 8,
//   },
//   submitButtonDisabled: {
//     opacity: 0.5,
//   },
// });