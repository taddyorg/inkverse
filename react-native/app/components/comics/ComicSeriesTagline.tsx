import { useState, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText, ThemedTextFontFamilyMap, ThemedIcon, PressableOpacity } from '../ui';
import { RootStackParamList, EDIT_TAGLINE_SCREEN } from '@/constants/Navigation';
import { ComicSeries } from '@inkverse/shared-client/graphql/operations';
import { canEditComicSeriesTagline } from '@inkverse/shared-client/dispatch/tagline';
import { on, off, EventNames, type PubSubEvents } from '@inkverse/shared-client/pubsub';
import { getUserDetails } from '@/lib/auth/user';
import { SPACING } from '@/constants/Spacing';

interface ComicSeriesTaglineProps {
  comicseries: ComicSeries;
}

export function ComicSeriesTagline({ comicseries }: ComicSeriesTaglineProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [tagline, setTagline] = useState(comicseries.tagline);
  const [currentUser, setCurrentUser] = useState(getUserDetails());

  useEffect(() => {
    setTagline(comicseries.tagline);
  }, [comicseries.uuid, comicseries.tagline]);

  useEffect(() => {
    const handleUserAuthenticated = () => {
      setCurrentUser(getUserDetails());
    };
    const handleUserLoggedOut = () => {
      setCurrentUser(null);
    };

    on(EventNames.USER_AUTHENTICATED, handleUserAuthenticated);
    on(EventNames.USER_LOGGED_OUT, handleUserLoggedOut);

    return () => {
      off(EventNames.USER_AUTHENTICATED, handleUserAuthenticated);
      off(EventNames.USER_LOGGED_OUT, handleUserLoggedOut);
    };
  }, []);

  // Show a saved tagline right away
  useEffect(() => {
    const handleTaglineUpdated = ({ seriesUuid, tagline }: PubSubEvents['COMIC_TAGLINE_UPDATED']) => {
      if (seriesUuid !== comicseries.uuid) return;
      setTagline(tagline);
    };
    on(EventNames.COMIC_TAGLINE_UPDATED, handleTaglineUpdated);
    return () => {
      off(EventNames.COMIC_TAGLINE_UPDATED, handleTaglineUpdated);
    };
  }, [comicseries.uuid]);

  // Show the edit icon to creators of the series once a tagline is set. Admins edit taglines on the website.
  const canEdit = canEditComicSeriesTagline({ isAdmin: false, userCreatorUuid: currentUser?.creator?.uuid, tagline, comicseries });

  const handleEditTagline = () => {
    navigation.navigate(EDIT_TAGLINE_SCREEN, {
      seriesUuid: comicseries.uuid,
      currentTagline: tagline,
    });
  };

  if (!tagline) return null;

  return (
    <View style={styles.container}>
      <ThemedText style={styles.tagline}>{tagline}</ThemedText>
      {canEdit && (
        <PressableOpacity
          onPress={handleEditTagline}
          hitSlop={SPACING.sm}
          accessibilityRole="button"
          accessibilityLabel="Edit tagline"
        >
          <ThemedIcon>
            <Ionicons name="create-outline" size={18} />
          </ThemedIcon>
        </PressableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    gap: SPACING.xs,
  },
  tagline: {
    flexShrink: 1,
    fontSize: 18,
    fontFamily: ThemedTextFontFamilyMap.bold,
    textAlign: 'center',
  },
});
