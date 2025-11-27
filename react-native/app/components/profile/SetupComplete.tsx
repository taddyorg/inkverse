import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/constants/Navigation';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedText } from '@/app/components/ui';
import { SPACING } from '@/constants/Spacing';
import { getUserDetails } from '@/lib/auth/user';

export function SetupComplete() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  useEffect(() => {
    const user = getUserDetails();
    if (!user) {
      // Close the modal if no user
      navigation.getParent()?.goBack();
      return;
    }

    // Navigate to user's profile after a short delay
    const timer = setTimeout(() => {
      // Close the modal and navigate to profile tab
      navigation.getParent()?.goBack();
    }, 500);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="checkmark-circle" size={80} color="#10B981" />
      </View>
        
      <ThemedText size="title" style={styles.title}>
        Profile setup complete! 🎉
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
});