import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText, PressableOpacity } from '../ui';
import { showShareSheet } from '@/lib/share-sheet';

const HEADER_HEIGHT = 128;

interface ComicHeaderProps {
  headerPosition: Animated.AnimatedInterpolation<string | number>;
  comicseries: any;
  comicissue: any;
}

export function ComicHeader({ headerPosition, comicseries, comicissue }: ComicHeaderProps) {
  const navigation = useNavigation();
  
  return (
    <Animated.View style={[styles.header, { transform: [{ translateY: headerPosition }] }]}>
      <View style={styles.container}>
        <PressableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </PressableOpacity>
        <View style={styles.center}>
          {comicseries && 
            <ThemedText 
              style={styles.comicTitle} 
              ellipsizeMode="tail" 
              numberOfLines={1}
              font="semiBold"
            >
              {comicseries.name}
            </ThemedText>
          }
          {comicissue && 
            <ThemedText 
              style={styles.episodeTitle} 
              ellipsizeMode='tail' 
              numberOfLines={1}
              font="semiBold"
            >
              {comicissue.name}
            </ThemedText>
          }
        </View>
        <PressableOpacity
          style={styles.shareButton}
          onPress={() => { showShareSheet({ type: 'comicissue', item: comicissue, parentItem: comicseries }); }}> 
          <Ionicons name="share-outline" size={24} color="white" />
        </PressableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: -8,
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: HEADER_HEIGHT,
    width: '100%',
    paddingBottom: 16,
    backgroundColor: '#000000',
    zIndex: 10,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    width: '100%',
  },
  backButton: {
    paddingHorizontal: 16,
  },
  shareButton: {
    paddingHorizontal: 16,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  comicTitle: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
    color: '#FFFFFF',
  },
  episodeTitle: {
    width: '100%',
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});

// Export the header height constant for use in other components
export { HEADER_HEIGHT }; 