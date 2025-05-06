import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { PressableOpacity } from '../ui';
import { ComicIssue } from '@inkverse/shared-client/graphql/types';

// Use the same height as the header for consistency
export const FOOTER_HEIGHT = 80;

interface ComicFooterProps {
  footerPosition: Animated.AnimatedInterpolation<string | number>;
  comicissue: ComicIssue;
  allIssues: ComicIssue[];
  onNavigateToIssue: (issueUuid: string, seriesUuid: string) => void;
}

export function ComicFooter({ 
  footerPosition, 
  comicissue, 
  allIssues, 
  onNavigateToIssue 
}: ComicFooterProps) {
  // Find the current issue index
  const currentIndex = allIssues.findIndex(issue => issue.uuid === comicissue.uuid);
  
  // Determine if we have previous/next issues
  const hasPreviousIssue = currentIndex > 0;
  const hasNextIssue = currentIndex < allIssues.length - 1 && currentIndex !== -1;
  
  // Get the previous and next issues if they exist
  const previousIssue = hasPreviousIssue ? allIssues[currentIndex - 1] : null;
  const nextIssue = hasNextIssue ? allIssues[currentIndex + 1] : null;

  // Handle navigation to previous issue
  const handlePreviousIssue = () => {
    if (previousIssue && previousIssue.uuid && comicissue.seriesUuid) {
      onNavigateToIssue(previousIssue.uuid, comicissue.seriesUuid);
    }
  };

  // Handle navigation to next issue
  const handleNextIssue = () => {
    if (nextIssue && nextIssue.uuid && comicissue.seriesUuid) {
      onNavigateToIssue(nextIssue.uuid, comicissue.seriesUuid);
    }
  };

  return (
    <Animated.View style={[styles.footer, { transform: [{ translateY: footerPosition }] }]}>
      <View style={styles.right}>
        {hasPreviousIssue && (
          <PressableOpacity onPress={handlePreviousIssue} style={styles.navigationButton}>
            <Ionicons name="chevron-back" size={28} color="white" />
          </PressableOpacity>
        )}
        {hasNextIssue && (
          <PressableOpacity onPress={handleNextIssue} style={styles.navigationButton}>
            <Ionicons name="chevron-forward" size={28} color="white" />
          </PressableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: FOOTER_HEIGHT,
    width: '100%',
    backgroundColor: '#000000',
    paddingHorizontal: 16,
    paddingBottom: 14,
    zIndex: 10,
  },
  right: {
    flex: 1,
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  navigationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  navigationText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginHorizontal: 4,
  },
  nextText: {
    textAlign: 'right',
  },
}); 