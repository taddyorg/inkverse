import React from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { ThemedText, ThemedTextFontFamilyMap, PressableOpacity } from '../ui';
import type { Creator } from '@inkverse/shared-client/graphql/operations';

interface SuperLikeButtonProps {
  isLoading: boolean;
  onPress: () => void;
  hasLikedAll: boolean;
  creators?: (Creator | null)[];
}

// Format creator names: "Alice", "Alice and Bob", "Alice, Bob, and Charlie"
function formatCreatorNames(creators?: (Creator | null)[]): string {
  const names = creators?.map(c => c?.name).filter((name): name is string => !!name) ?? [];
  if (names.length === 0) return 'the creators';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}

export const SuperLikeButton = ({
  isLoading,
  onPress,
  hasLikedAll,
  creators,
}: SuperLikeButtonProps) => {
  if (hasLikedAll) {
    const creatorNames = formatCreatorNames(creators);
    return (
      <View style={styles.container}>
        <View style={styles.likedAllContainer}>
          <View style={styles.likedAllRow}>
            <MaterialIcons name="favorite" size={20} color="#ef4444" />
            <ThemedText style={styles.likedAllText}>You liked all episodes!</ThemedText>
          </View>
          <ThemedText style={styles.creatorMessageText}>
            We'll let {creatorNames} know they're doing a great job!
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PressableOpacity
        onPress={onPress}
        disabled={isLoading}
        style={[styles.button, isLoading && styles.buttonDisabled]}
      >
        <View style={styles.content}>
          {isLoading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <MaterialIcons name="favorite" size={20} color="#ffffff" />
          )}
          <ThemedText style={styles.buttonText}>Like All Episodes</ThemedText>
        </View>
      </PressableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  button: {
    backgroundColor: '#f43f5e', // rose-500
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontFamily: ThemedTextFontFamilyMap.semiBold,
    fontSize: 14,
  },
  likedAllContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  likedAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  likedAllText: {
    color: '#fb7185', // rose-400
    fontFamily: ThemedTextFontFamilyMap.semiBold,
    fontSize: 16,
  },
  creatorMessageText: {
    color: '#fb7185', // rose-400
    fontFamily: ThemedTextFontFamilyMap.regular,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 4,
  },
});
