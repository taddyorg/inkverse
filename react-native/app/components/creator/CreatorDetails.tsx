import React from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, useColorScheme } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '../ui';
import { getAvatarImageUrl } from '@inkverse/public/creator';
import { type Creator } from '@inkverse/shared-client/graphql/operations';
import { CREATOR_SCREEN, PROFILE_SCREEN } from '@/constants/Navigation';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/constants/Navigation';
import { CreatorLinks } from './CreatorLinks';
import { Colors } from '@/constants/Colors';

type CreatorPageType =
  | 'creator-screen'
  | 'mini-creator'
  | 'profile-screen';

export interface CreatorDetailsProps {
  creator: Creator | null | undefined;
  pageType: CreatorPageType;
}

const { width } = Dimensions.get('window');

export function CreatorDetails({ creator, pageType }: CreatorDetailsProps) {
  const colorScheme = useColorScheme() ?? 'light';

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
          style={styles.avatar}
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
    width: width * 0.3,
    height: width * 0.3,
    borderRadius: (width * 0.3) / 2,
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