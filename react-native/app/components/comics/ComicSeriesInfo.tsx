import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ThemedText, ThemedView, ThemedIcon, PressableOpacity } from '@/app/components/ui';
import { ComicSeries } from '@inkverse/shared-client/graphql/operations';
import { getPrettySeriesStatus } from '@inkverse/public/status';
import { getPrettyContentRating } from '@inkverse/public/ratings';
import { REPORTS_SCREEN } from '@/constants/Navigation';
import { Ionicons } from '@expo/vector-icons';

interface ComicSeriesInfoProps {
  comicseries: ComicSeries;
}

export function ComicSeriesInfo({ comicseries }: ComicSeriesInfoProps) {
  const navigation = useNavigation();
  
  const handleReportComic = () => {
    navigation.navigate(REPORTS_SCREEN, {
      uuid: comicseries.uuid,
      type: 'comicseries',
    });
  };

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
      <View style={styles.infoRow}>
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
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  infoContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
    fontWeight: '600',
  },
  reportItem: {
    flexDirection: 'row',
    paddingVertical: 8,
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