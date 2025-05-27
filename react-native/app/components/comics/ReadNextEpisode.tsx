import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';

import { ThemedText, ThemedTextFontFamilyMap, PressableOpacity } from '../ui';

import { ComicIssue } from '@inkverse/shared-client/graphql/operations';
import { getThumbnailImageUrl } from '@inkverse/public/comicissue';
import { useThemeColor } from '@/constants/Colors';

interface ReadNextEpisodeProps {
  comicissue: ComicIssue;
  showEmptyState?: boolean;
  firstTextCTA?: string;
  secondTextCTA?: string;
  handleNavigateToIssue: (issueUuid: string, seriesUuid: string) => void;
}

export function ReadNextEpisode({ comicissue, showEmptyState = true, firstTextCTA = 'NEXT', secondTextCTA = 'EPISODE', handleNavigateToIssue }: ReadNextEpisodeProps) {
  const color = useThemeColor({}, 'action');

  if (!comicissue) {
    if (!showEmptyState) { return null; }
    return (
      <View style={styles.container}>
        <View style={styles.endButtonContainer}>
          <ThemedText style={styles.emptyText}>
            You are up to date with this series!
          </ThemedText>
        </View>
      </View>
    );
  }

  const isPatreonExclusive = comicissue.scopesForExclusiveContent?.includes('patreon');

  const NextEpisodeContent = () => (
    <View style={[styles.nextIssueButtonContainer, { borderColor: color }]}>
      {comicissue.thumbnailImageAsString && (
        <View style={styles.thumbnailWrapper}>
          <Image
            source={getThumbnailImageUrl({ thumbnailImageAsString: comicissue.thumbnailImageAsString })}
            style={[
              styles.thumbnail,
              isPatreonExclusive && styles.thumbnailLocked
            ]}
            contentFit="cover"
          />
          {isPatreonExclusive && (
            <View style={styles.lockIconContainer}>
              <MaterialIcons name="lock" size={50} color={color} />
            </View>
          )}
        </View>
      )}
      <View style={styles.titleContainer}>
        <ThemedText style={[styles.title, { color }]}>{firstTextCTA.toUpperCase()}</ThemedText>
        <ThemedText style={[styles.title, { color }]}>{secondTextCTA.toUpperCase()}</ThemedText>
        {isPatreonExclusive && (
          <ThemedText style={[styles.patreonExclusiveText, { color }]}>PATREON EXCLUSIVE</ThemedText>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {isPatreonExclusive ? (
        <View style={styles.button}>
          <NextEpisodeContent />
        </View>
      ) : (
        <PressableOpacity
          style={styles.button} 
          onPress={() => {
            if (handleNavigateToIssue && comicissue.uuid && comicissue.seriesUuid) {
              handleNavigateToIssue(comicissue.uuid, comicissue.seriesUuid);
            }
          }}
        >
          <NextEpisodeContent />
        </PressableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    justifyContent: "center",
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  button: {
    width: '100%',
    overflow: 'hidden',
  },
  nextIssueButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: '#fff', // PAPER_PINK equivalent
    borderRadius: 20,
    borderWidth: 3,
  },
  thumbnailWrapper: {
    position: 'relative',
  },
  thumbnail: {
    width: 104,
    height: 104,
    borderRadius: 20,
  },
  thumbnailLocked: {
    opacity: 0.5,
  },
  lockIconContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -25 }, { translateY: -25 }],
  },
  title: {
    textAlign: "center",
    fontSize: 24,
    fontFamily: ThemedTextFontFamilyMap.bold,
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  patreonExclusiveText: {
    fontSize: 14,
    marginTop: 8,
  },
  endButtonContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
  },
}); 