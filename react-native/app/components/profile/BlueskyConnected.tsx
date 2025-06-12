import React from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComicSeries } from '@inkverse/shared-client/graphql/operations';
import { ComicSeriesDetails } from '../comics/ComicSeriesDetails';
import { ThemedText, PressableOpacity, ThemedButton } from '@/app/components/ui';
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
      <ScrollView 
        style={styles.comicsList}
        showsVerticalScrollIndicator={false}
      >
        {comicSeries?.map((series) => (
          <View key={series.uuid} style={styles.comicItem}>
            <ComicSeriesDetails 
              comicseries={series} 
              pageType="list-item-no-link" 
            />
          </View>
        ))}
      </ScrollView>
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
    <View style={styles.container}>
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
          <ThemedText style={styles.skipText} font='semiBold'>
            {comicSeries && comicSeries.length > 0 ? 'Skip' : 'Continue'}
          </ThemedText>
        </PressableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    fontWeight: '600',
    textAlign: 'center',
  },
  content: {
    flex: 1,
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
    flex: 1,
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