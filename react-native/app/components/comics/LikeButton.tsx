import React from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { ThemedText, ThemedTextFontFamilyMap, PressableOpacity } from '../ui';

interface LikeButtonProps {
  isLiked: boolean;
  likeCount: number;
  isLoading: boolean;
  onPress: () => void;
  variant?: 'default' | 'footer';
}

export const LikeButton = ({
  isLiked,
  likeCount,
  isLoading,
  onPress,
  variant = 'default',
}: LikeButtonProps) => {
  const formattedCount = likeCount.toLocaleString();
  const isFooter = variant === 'footer';

  // Colors based on variant
  const iconColor = isFooter ? '#FFFFFF' : '#000000';
  const likedColor = isFooter ? '#FFFFFF' : '#f43f5e';
  const textColor = isFooter ? '#FFFFFF' : '#000000';

  return (
    <View style={[styles.container, isFooter && styles.containerFooter]}>
      <PressableOpacity
        onPress={onPress}
        disabled={isLoading}
        style={[
          styles.button,
          isFooter && styles.buttonFooter,
          isLoading && styles.buttonDisabled,
        ]}
      >
        <View style={styles.content}>
          {isLoading
          ? <ActivityIndicator size="small" color={iconColor} />
          : isLiked
            ? <MaterialIcons name="favorite" size={22} color={likedColor} />
            : <MaterialIcons name="favorite-border" size={22} color={iconColor} />
          }
          <ThemedText style={[styles.countText, { color: textColor }]}>
            {formattedCount}
          </ThemedText>
        </View>
      </PressableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  containerFooter: {
    paddingVertical: 0,
    marginLeft: 5,
  },
  button: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    height: 40,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonFooter: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    marginLeft: 6,
    color: '#000000',
    fontFamily: ThemedTextFontFamilyMap.semiBold,
    fontSize: 16,
  },
});
