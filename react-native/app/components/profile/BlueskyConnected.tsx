import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComicSeries } from '@inkverse/shared-client/graphql/operations';
import { ComicSeriesDetails } from '../comics/ComicSeriesDetails';
import { ThemedText, PressableOpacity, ThemedButton, FormColumn } from '@/app/components/ui';
import { useThemeColor } from '@/constants/Colors';
import { SPACING } from '@/constants/Spacing';


interface BlueskyConnectedProps {
  handle: string;
  loading: boolean;
  error: string | null;
  comicSeries: ComicSeries[] | null;
  onContinue: () => void;
  onSkip: () => void;
}

interface ComicsFoundProps {
  comicSeries: ComicSeries[] | null;
  onContinue: () => void;
}

function ComicsFound({ comicSeries, onContinue }: ComicsFoundProps) {  
  return (
    <>
      <ThemedText style={styles.foundText}>
        We found {comicSeries?.length} comic{comicSeries?.length === 1 ? '' : 's'} you follow on Bluesky.
      </ThemedText>
      <View style={styles.comicsList}>
        {comicSeries?.map((series) => (
          <View key={series.uuid} style={styles.comicItem}>
            <ComicSeriesDetails 
              comicseries={series} 
              pageType="list-item-no-link" 
            />
          </View>
        ))}
      </View>
      <ThemedButton
        onPress={onContinue}
        buttonText="Add these comics to your profile"
        style={styles.continueButton}
      />
    </>
  );
}

function NoComicsFound() {
  return (
    <ThemedText style={styles.noComicsText}>
      We didn't find any comics you follow on Bluesky.
    </ThemedText>
  );
}

export function BlueskyConnected({ 
  handle, 
  loading, 
  error, 
  comicSeries, 
  onContinue, 
  onSkip 
}: BlueskyConnectedProps) {
  const textColor = useThemeColor({}, 'text');
  const errorColor = useThemeColor(
    { light: '#dc2626', dark: '#ef4444' },
    'text'
  );
  const primaryColor = useThemeColor({}, 'button');
  const buttonTextColor = useThemeColor({}, 'buttonText');

  return (
    <FormColumn scroll scrollContentStyle={styles.scrollContent} style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-circle" size={80} color="#10B981" />
        </View>
        
        <ThemedText size="title" style={styles.title}>
          Bluesky Connected!
        </ThemedText>
      </View>
      
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={textColor} />
            <ThemedText style={styles.loadingText}>
              Finding creators you follow...
            </ThemedText>
          </View>
        ) : error ? (
          <View style={styles.errorSection}>
            <ThemedText style={[styles.errorText, { color: errorColor }]}>
              {error}
            </ThemedText>
            <ThemedText style={styles.connectedText}>
              But your Bluesky account is connected.
            </ThemedText>
          </View>
        ) : comicSeries && comicSeries.length > 0 ? (
          <ComicsFound comicSeries={comicSeries} onContinue={onContinue} />
        ) : (
          <NoComicsFound />
        )}
        
        <PressableOpacity onPress={onSkip} style={styles.skipButton}>
          <ThemedText style={styles.skipText}>
            {comicSeries && comicSeries.length > 0 ? 'Skip' : 'Continue'}
          </ThemedText>
        </PressableOpacity>
      </View>
    </FormColumn>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flexGrow: 1,
    padding: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
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
    textAlign: 'center',
  },
  content: {
    flexGrow: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: 16,
  },
  errorSection: {
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  connectedText: {
    fontSize: 16,
    textAlign: 'center',
  },
  foundText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  noComicsText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: SPACING.xl,
  },
  comicsList: {
    flexGrow: 1,
    marginBottom: SPACING.lg,
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
  skipText: {
    fontSize: 14,
  },
});