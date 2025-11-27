import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import Svg, { Path } from 'react-native-svg';
import { ThemedText } from '../ui/ThemedText';
import { HeaderBackButton } from '../ui/HeaderBackButton';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/constants/Navigation';
import { SPACING } from '@/constants/Spacing';

interface SetupPatreonProps {
  currentStep: 'patreon' | 'patreon-connected';
  onConnect: () => void;
  onSkip: () => void;
  onBack: () => void;
  onContinue: () => void;
}

export function SetupPatreon({ currentStep, onConnect, onSkip, onBack, onContinue }: SetupPatreonProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <View style={styles.container}>
      <HeaderBackButton />
      <View style={styles.contentContainer}>
        <ThemedText style={[styles.title]} size="title">
          Connect your Patreon
        </ThemedText>
        <ThemedText style={[styles.description]} font="bold">
          Find Inkverse creators that you follow on Patreon
        </ThemedText>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={onConnect}
          style={styles.connectButton}
          activeOpacity={0.8}
        >
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="white">
            <Path d="M7.003 3.5C5.897 3.5 5 4.397 5 5.503v13C5 19.607 5.897 20.5 7.003 20.5H8.5V3.5H7.003zm8.443 0c-2.734 0-4.947 2.213-4.947 4.946c0 2.734 2.213 4.947 4.947 4.947c2.734 0 4.948-2.213 4.948-4.947c0-2.733-2.214-4.946-4.948-4.946z"/>
          </Svg>
          <ThemedText style={styles.connectButtonText} size="subtitle">Connect with Patreon</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onSkip}
          style={styles.skipButton}
          activeOpacity={0.7}
        >
          <ThemedText style={styles.skipButtonText}>Skip for now</ThemedText>
        </TouchableOpacity>
        {/* {__DEV__ && 
          <TouchableOpacity
            onPress={() => navigation.navigate(WRAPPED_API_HOSTING_PROVIDER_SCREEN, {
              uuid: TADDY_HOSTING_PROVIDER_UUID,
            })}
            style={styles.skipButton}
            activeOpacity={0.7}
          >
            <ThemedText style={styles.skipButtonText}>Open Hosting Provider</ThemedText>
          </TouchableOpacity>
        } */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.lg,
  },
  contentContainer: {
    alignItems: 'center',
    marginTop: SPACING.xxl * 2,
  },
  title: {
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  description: {
    marginBottom: SPACING.xl,
    fontSize: 16,
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: 0,
  },
  connectButton: {
    backgroundColor: '#FF424D',
    borderRadius: 8,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  connectButtonText: {
    color: 'white',
    fontSize: 16,
  },
  skipButton: {
    marginTop: SPACING.md,
    alignItems: 'center',
  },
  skipButtonText: {
    marginTop: 2,
    fontSize: 15,
  },
});