import React from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';

import { ThemedText } from '../ui';
import { getAvatarImageUrl } from '@inkverse/public/creator';
import { type Creator } from '@inkverse/shared-client/graphql/operations';
import { CREATOR_SCREEN } from '@/constants/Navigation';
import { useNavigation } from '@react-navigation/native';
import { CreatorLinks } from './CreatorLinks';

type CreatorPageType = 
  | 'creator-screen'
  | 'mini-creator';

export interface CreatorDetailsProps {
  creator: Creator | null | undefined;
  pageType: CreatorPageType;
}

const { width } = Dimensions.get('window');

export function CreatorDetails({ creator, pageType }: CreatorDetailsProps) {
  if (!creator) { return null; }

  const avatarUrl = getAvatarImageUrl({ avatarImageAsString: creator.avatarImageAsString });

  if (pageType === 'mini-creator') {
    const navigation = useNavigation();

    return (
      <TouchableOpacity 
        onPress={() => {
            if (!creator) { return; }
            navigation.navigate(CREATOR_SCREEN, { uuid: creator.uuid });
          }}
          style={styles.creatorWrapper}
        >
          <View style={styles.creator}>
            <Image
              source={{ uri: getAvatarImageUrl({ avatarImageAsString: creator?.avatarImageAsString }) }}
              style={styles.creatorAvatar}
              contentFit="cover"
              recyclingKey={creator.uuid}
            />
            <ThemedText size="subtitle" style={styles.creatorText}>
              {creator?.name}
            </ThemedText>
          </View>
        </TouchableOpacity>
    );
  }

  return (
    <View>
      <View style={styles.container}>
        <Image 
          source={{ uri: avatarUrl }} 
          style={styles.avatar}
          contentFit="cover"
          recyclingKey={creator.uuid}
        />
        <View style={styles.infoContainer}>
          <ThemedText size="title" style={styles.name}>{creator.name}</ThemedText>
          {creator.bio && (
            <ThemedText style={styles.bio} numberOfLines={3}>
              {creator.bio}
            </ThemedText>
          )}
        </View>
      </View>
      <CreatorLinks links={creator.links} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  header: {
    marginBottom: 16,
  },
  avatar: {
    width: width * 0.2,
    height: width * 0.2,
    borderRadius: (width * 0.2) / 2,
  },
  infoContainer: {
    flex: 1,
    marginLeft: 16,
  },
  name: {
    marginBottom: 8,
  },
  bio: {
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 12,
  },
  creatorWrapper: {
    width: '50%',
    paddingHorizontal: 8,
  },
  creator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  creatorAvatar: {
    height: 32,
    width: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  creatorText: {
    fontSize: 18,
  },
}); 