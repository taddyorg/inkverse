import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComicSeries } from '@inkverse/shared-client/graphql/operations';
import { ComicSeriesDetails } from '../comics/ComicSeriesDetails';
import { Colors, useThemeColor } from '@/constants/Colors';
import { ThemedText } from '../ui/ThemedText';
import { HeaderBackButton } from '../ui/HeaderBackButton';
import { SPACING } from '@/constants/Spacing';
import { ThemedButton } from '../ui/ThemedButton';

interface PatreonConnectedProps {
  loading: boolean;
  error: string | null;
  comicSeries: ComicSeries[] | null;
  onContinue: () => void;
  onSkip: () => void;
  onBackToUnconnected: () => void;
}

interface ComicsFoundProps {
  comicSeries: ComicSeries[] | null;
  onContinue: () => void;
}

function ComicsFound({ comicSeries, onContinue }: ComicsFoundProps) {
  return (
    <>
      <ThemedText style={[styles.foundText]}>
        We found {comicSeries?.length} comic{comicSeries?.length === 1 ? '' : 's'} from creators you support on Patreon.
      </ThemedText>
      <ScrollView style={styles.comicsList} showsVerticalScrollIndicator={false}>
        {comicSeries?.map((series) => {
          return (
            <View key={series.uuid} style={styles.comicItem}>
              <ComicSeriesDetails comicseries={series} pageType="list-item-no-link" />
            </View>
          );
        })}
      </ScrollView>
      <ThemedButton
        style={styles.continueButton}
        onPress={onContinue}
        buttonText="Add these comics to your profile"
      />
    </>
  );
}

function NoComicsFound() {
  return (
    <ThemedText style={[styles.noComicsText]}>
      We didn't find any Inkverse creators you support on Patreon.
    </ThemedText>
  );
}

export function PatreonConnected({ loading, error, comicSeries, onContinue, onSkip, onBackToUnconnected }: PatreonConnectedProps) {
  const buttonColor = useThemeColor(
    { light: Colors.light.button, dark: Colors.dark.button },
    'button'
  );
    
  const textColor = useThemeColor(
    { light: Colors.light.text, dark: Colors.dark.text },
    'text'
  );
  return (
    <View style={styles.container}>
      <HeaderBackButton onPress={onBackToUnconnected} />
      <View style={styles.iconContainer}>
        <Ionicons name="checkmark-circle" size={80} color="#10B981" />
      </View>
      
      <ThemedText style={[styles.title]} size="title">Patreon Connected!</ThemedText>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={buttonColor} />
          <ThemedText style={[{ color: textColor }]}>Finding creators you support...</ThemedText>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : comicSeries && comicSeries.length > 0 ? (
        <ComicsFound comicSeries={comicSeries} onContinue={onContinue} />
      ) : (
        <NoComicsFound />
      )}
      <TouchableOpacity
        onPress={onSkip}
        style={styles.skipButton}
        activeOpacity={0.7}
      >
        <ThemedText style={styles.skipButtonText}>
          {comicSeries && comicSeries.length > 0 ? 'Skip' : 'Continue'}
        </ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.lg,
  },
  iconContainer: {
    marginBottom: SPACING.xl,
  },
  title: {
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  errorContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  errorText: {
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  foundText: {
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  noComicsText: {
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  comicsList: {
    flex: 1,
    width: '100%',
    marginBottom: SPACING.md,
  },
  comicItem: {
    marginBottom: SPACING.md,
  },
  continueButton: {
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
  },
  skipButton: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  skipButtonText: {
    fontSize: 14,
  },
});