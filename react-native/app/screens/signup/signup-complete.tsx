import React from 'react';
import { StyleSheet } from 'react-native';
import { Screen, ThemedView } from '@/app/components/ui';
import { SetupComplete } from '@/app/components/profile/SetupComplete';

export function SignupCompleteScreen() {
  return (
    <Screen>
      <ThemedView style={styles.container}>
        <SetupComplete />
      </ThemedView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});