import React from 'react';
import { View, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText, useLayout } from '../ui';
import { getAvatarImageUrl } from '@inkverse/public/creator';
import { type Creator } from '@inkverse/shared-client/graphql/operations';
import { CREATOR_SCREEN, PROFILE_SCREEN } from '@/constants/Navigation';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/constants/Navigation';
import { CreatorLinks } from './CreatorLinks';
import { Colors } from '@/constants/Colors';
import { MAX_CONTENT_WIDTH } from '@/constants/Layout';

type CreatorPageType =
  | 'creator-screen'
  | 'mini-creator'
  | 'profile-screen';

export interface CreatorDetailsProps {
  creator: Creator | null | undefined;
  pageType: CreatorPageType;
}

// Matches the website's h-40 avatar
const MAX_AVATAR_SIZE = 160;

export function CreatorDetails({ creator, pageType }: CreatorDetailsProps) {
  const colorScheme = useColorScheme() ?? 'light';
  // 30% of the page column on phones, capped so it doesn't grow on landscape and iPad
  const { contentWidth } = useLayout(MAX_CONTENT_WIDTH.page);
  const avatarSize = Math.min(contentWidth * 0.3, MAX_AVATAR_SIZE);

  if (!creator) { return null; }

  const avatarUrl = getAvatarImageUrl({ avatarImageAsString: creator.avatarImageAsString });

  if (pageType === 'mini-creator') {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    return (
      <TouchableOpacity 
        onPress={() => {
            if (!creator) { return; }
            if (creator.user?.id) {
              navigation.navigate(PROFILE_SCREEN, { userId: creator.user.id });
            } else {
              navigation.navigate(CREATOR_SCREEN, { uuid: creator.uuid });
            }
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
          style={[styles.avatar, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}
          contentFit="cover"
          recyclingKey={creator.uuid}
        />
        <View style={styles.infoContainer}>
          <View style={styles.nameRow}>
            <ThemedText size="title" style={styles.name}>{creator.name}</ThemedText>
            {pageType === 'profile-screen' && (
              <Ionicons
                name="checkmark-circle"
                size={18}
                color={colorScheme === 'light' ? Colors.light.tint : Colors.dark.tag}
                style={styles.verifiedBadge}
              />
            )}
          </View>
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
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    marginBottom: 12,
  },
  infoContainer: {
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    marginBottom: 8,
    textAlign: 'center',
  },
  verifiedBadge: {
    marginLeft: 4,
    marginBottom: 6,
  },
  bio: {
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 12,
    textAlign: 'center',
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