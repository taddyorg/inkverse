import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/constants/Navigation';
import { ThemedText, ThemedView, ThemedIcon, PressableOpacity } from '@/app/components/ui';
import { ComicSeries } from '@inkverse/shared-client/graphql/operations';
import { getPrettySeriesStatus } from '@inkverse/public/status';
import { getPrettyContentRating } from '@inkverse/public/ratings';
import { REPORTS_SCREEN } from '@/constants/Navigation';
import { Ionicons } from '@expo/vector-icons';
import { CreatorDetails } from '../creator/CreatorDetails';
import { SPACING } from '@/constants/Spacing';

interface ComicSeriesInfoProps {
  comicseries: ComicSeries;
}

export function ComicSeriesInfo({ comicseries }: ComicSeriesInfoProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleReportComic = () => {
    navigation.navigate(REPORTS_SCREEN, {
      uuid: comicseries.uuid,
      type: 'comicseries',
    });
  };

  const creators = comicseries.creators?.filter(Boolean) ?? [];

  return (
    <ThemedView style={styles.infoContainer}>
      <View style={styles.infoRow}>
        {comicseries.status && (
            <View style={styles.infoItem}>
              <ThemedText style={styles.infoLabel}>Series Status</ThemedText>
              <ThemedText style={styles.infoValue}>{getPrettySeriesStatus(comicseries.status)}</ThemedText>
            </View>
          )
        }
        {comicseries.contentRating && (
            <View style={styles.infoItem}>
              <ThemedText style={styles.infoLabel}>Age Rating</ThemedText>
              <ThemedText style={styles.infoValue}>{getPrettyContentRating(comicseries.contentRating)}</ThemedText>
            </View>
          )
        }
      </View>
      <View style={[styles.infoRow, creators.length === 0 && styles.lastInfoRow]}>
        <View style={styles.infoItem}>
          <ThemedText style={styles.infoLabel}># of Episodes</ThemedText>
          <ThemedText style={styles.infoValue}>{comicseries.issueCount || 0}</ThemedText>
        </View>
        <View style={styles.infoItemHorizontal}>
          <PressableOpacity onPress={handleReportComic} style={styles.reportButton}>
            <View style={styles.reportItem}>
              <ThemedIcon>
                <Ionicons name="flag-outline" size={16} />
              </ThemedIcon>
              <ThemedText style={styles.reportText}>Report Comic</ThemedText>
            </View>
          </PressableOpacity>

        </View>
      </View>
      {creators.length > 0 && (
        <View>
          {/*<ThemedText style={styles.infoLabel}>{creators.length > 1 ? 'Creators Info' : 'Creator Info'}</ThemedText>*/}
          <View style={styles.creatorGrid}>
            {creators.map((creator) => (
              <CreatorDetails
                key={creator?.uuid}
                creator={creator}
                pageType='mini-creator'
              />
            ))}
          </View>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  infoContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  // Last element: the next section (or the list's bottom padding) supplies the space below
  creatorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  // Used when there are no creators below, so the next section supplies the space
  lastInfoRow: {
    marginBottom: 0,
  },
  infoItem: {
    flex: 1,
  },
  infoItemHorizontal: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
  },
  reportItem: {
    flexDirection: 'row',
  },
  reportButton: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  reportText: {
    fontSize: 16,
    marginLeft: 4,
  },
});