import { useEffect, useReducer, useCallback } from 'react';
import { StyleSheet, View, useColorScheme } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps, NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';

import { Screen, HeaderBackButton, ThemedText, ThemedActivityIndicator, ThemedButton } from '@/app/components/ui';
import { RootStackParamList, CLAIM_CREATOR_SCREEN, SIGNUP_SCREEN, PROFILE_SCREEN } from '@/constants/Navigation';
import { getPublicApolloClient, getUserApolloClient } from '@/lib/apollo';
import { isAuthenticated, getAccessToken, getUserDetails } from '@/lib/auth/user';
import { openURL } from '@/lib/utils';
import { Colors } from '@/constants/Colors';
import config from '@/config';

import { getAvatarImageUrl } from '@inkverse/public/creator';
import { providerDetails } from '@inkverse/public/hosting-providers';
import {
  claimCreatorReducer,
  claimCreatorInitialState,
  fetchClaimStatus,
  initiateClaim,
  ClaimCreatorActionType,
} from '@inkverse/shared-client/dispatch/claim-creator';
import {
  GetClaimCreatorPage,
} from '@inkverse/shared-client/graphql/operations';
import type {
  GetClaimCreatorPageQuery,
  GetClaimCreatorPageQueryVariables,
} from '@inkverse/shared-client/graphql/operations';

export type ClaimCreatorScreenParams = {
  uuid: string;
};

export function ClaimCreatorScreen() {
  const route = useRoute<NativeStackScreenProps<RootStackParamList, typeof CLAIM_CREATOR_SCREEN>['route']>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const colorScheme = (useColorScheme() ?? 'light')
  const { uuid } = route.params;

  const [state, dispatch] = useReducer(claimCreatorReducer, claimCreatorInitialState);
  const { isLoading, error, claimStatus } = state;

  // Local state for creator data
  const [creatorData, setCreatorData] = useReducer(
    (prev: CreatorData, next: Partial<CreatorData>) => ({ ...prev, ...next }),
    { creator: null, hostingProviderName: null, isCreatorLoading: true }
  );

  const { creator, hostingProviderName, isCreatorLoading } = creatorData;

  // Fetch creator data
  useEffect(() => {
    async function loadCreator() {
      try {
        const publicClient = getPublicApolloClient();
        const { data } = await publicClient.query<
          GetClaimCreatorPageQuery,
          GetClaimCreatorPageQueryVariables
        >({
          query: GetClaimCreatorPage,
          variables: { creatorUuid: uuid },
        });

        const creatorResult = data?.getCreator ?? null;
        let providerName: string | null = null;

        if (creatorResult?.comics) {
          const providerUuid = creatorResult.comics.find(
            (c: any) => c?.hostingProviderUuid
          )?.hostingProviderUuid;
          if (providerUuid && providerDetails[providerUuid]) {
            providerName = providerDetails[providerUuid].displayName;
          }
        }

        setCreatorData({
          creator: creatorResult,
          hostingProviderName: providerName,
          isCreatorLoading: false,
        });
      } catch (err) {
        console.error('Failed to load creator', err);
        setCreatorData({ isCreatorLoading: false });
      }
    }

    loadCreator();
  }, [uuid]);

  // Fetch claim status once creator is loaded and user is authenticated
  useEffect(() => {
    if (!creator?.uuid) return;

    if (isAuthenticated()) {
      const userClient = getUserApolloClient();
      const currentUser = getUserDetails();
      fetchClaimStatus(
        { userClient, creatorUuid: creator.uuid, userId: currentUser?.id ? String(currentUser.id) : undefined },
        dispatch,
      );
    } else {
      dispatch({ type: ClaimCreatorActionType.FETCH_STATUS_SUCCESS, payload: null });
    }
  }, [creator?.uuid]);

  const handleClaim = useCallback(async () => {
    if (!isAuthenticated()) {
      navigation.navigate(SIGNUP_SCREEN);
      return;
    }

    const user = getUserDetails();
    if (!user?.username) {
      return;
    }

    const accessToken = await getAccessToken();
    if (!accessToken || !creator?.uuid) return;

    const result = await initiateClaim(
      { baseUrl: config.CLAIM_URL, creatorUuid: creator.uuid, accessToken },
      dispatch
    );

    if (result?.claimCreatorUrl) {
      openURL({ url: result.claimCreatorUrl });
    }
  }, [creator?.uuid, navigation]);

  if (isCreatorLoading || isLoading) {
    return (
      <Screen style={styles.container}>
        <View style={styles.header}>
          <HeaderBackButton />
        </View>
        <View style={styles.loadingContainer}>
          <ThemedActivityIndicator />
        </View>
      </Screen>
    );
  }

  if (!creator) {
    return (
      <Screen style={styles.container}>
        <View style={styles.header}>
          <HeaderBackButton />
        </View>
        <View style={styles.centerContainer}>
          <ThemedText style={styles.errorText}>Creator not found</ThemedText>
        </View>
      </Screen>
    );
  }

  const user = getUserDetails();
  const avatarUrl = creator.avatarImageAsString
    ? getAvatarImageUrl({ avatarImageAsString: creator.avatarImageAsString })
    : undefined;
  const providerName = hostingProviderName || 'hosting provider';
  const effectiveStatus = claimStatus?.toLowerCase() || null;

  return (
    <Screen style={styles.container}>
      <View style={styles.header}>
        <HeaderBackButton />
      </View>
      <View style={styles.content}>
        {/* Initial state - show creator info and benefits */}
        {!effectiveStatus && (
          <View style={styles.centerContainer}>
            {avatarUrl && (
              <Image
                source={{ uri: avatarUrl }}
                style={styles.avatar}
                contentFit="cover"
              />
            )}
            <ThemedText style={styles.creatorName}>{creator.name}</ThemedText>
            <ThemedText style={styles.subtitle}>
              Connect your {providerName} and Inkverse accounts:
            </ThemedText>
            <View style={styles.benefitsList}>
              <View style={styles.benefitItem}>
                <ThemedText style={[styles.checkmark, { color: Colors[colorScheme].action }]}>✓</ThemedText>
                <ThemedText style={styles.benefitText}>
                  Combine your creator page and profile into one verified profile
                </ThemedText>
              </View>
              <View style={styles.benefitItem}>
                <ThemedText style={[styles.checkmark, { color: Colors[colorScheme].action }]}>✓</ThemedText>
                <ThemedText style={styles.benefitText}>
                  Get notifications when someone likes or comments on your comic
                </ThemedText>
              </View>
              <View style={styles.benefitItem}>
                <ThemedText style={[styles.checkmark, { color: Colors[colorScheme].action }]}>✓</ThemedText>
                <ThemedText style={styles.benefitText}>
                  Get a verified badge when you reply or comment on your comic
                </ThemedText>
              </View>
            </View>
          </View>
        )}

        {/* Approved status */}
        {effectiveStatus === 'approved' && (
          <View style={styles.centerContainer}>
            <View style={[styles.statusBox, styles.successBox]}>
              <ThemedText style={styles.successText}>
                Successfully connected! Your Inkverse account is now linked to this creator profile.
              </ThemedText>
            </View>
            {user?.username && (
              <ThemedButton
                buttonText="View your new profile"
                onPress={() => navigation.navigate(PROFILE_SCREEN, {})}
                style={styles.actionButton}
              />
            )}
          </View>
        )}

        {/* Rejected status */}
        {effectiveStatus === 'rejected' && (
          <View style={styles.centerContainer}>
            <View style={[styles.statusBox, styles.errorBox]}>
              <ThemedText style={styles.errorStatusText}>
                The request was rejected. Contact danny@inkverse.co if you need help.
              </ThemedText>
            </View>
          </View>
        )}

        {/* Pending status */}
        {effectiveStatus === 'pending' && (
          <View style={styles.centerContainer}>
            <View style={[styles.statusBox, styles.pendingBox]}>
              <ThemedText style={styles.pendingText}>
                Verification in progress. Please complete the verification on {providerName}'s dashboard.
              </ThemedText>
            </View>
          </View>
        )}

        {/* Error display */}
        {error && (
          <View style={[styles.statusBox, styles.errorBox, styles.errorMargin]}>
            <ThemedText style={styles.errorStatusText}>{error}</ThemedText>
          </View>
        )}

        {/* Connect button for initial and pending states */}
        {(!effectiveStatus || effectiveStatus === 'pending') && (
          <View style={styles.buttonContainer}>
            <ThemedButton
              buttonText={isLoading ? 'Connecting...' : 'Connect your account'}
              onPress={handleClaim}
              disabled={isLoading}
              style={[styles.actionButton, isLoading && styles.disabledButton]}
            />
          </View>
        )}
      </View>
    </Screen>
  );
}

interface CreatorData {
  creator: any;
  hostingProviderName: string | null;
  isCreatorLoading: boolean;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  centerContainer: {
    alignItems: 'center',
    paddingTop: 24,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 16,
  },
  creatorName: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 17,
    textAlign: 'center',
    marginTop: 24,
  },
  benefitsList: {
    marginTop: 24,
    alignSelf: 'stretch',
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  checkmark: {
    fontSize: 16,
    marginTop: 2,
  },
  benefitText: {
    fontSize: 15,
    flex: 1,
  },
  statusBox: {
    padding: 16,
    borderRadius: 12,
    width: '100%',
  },
  successBox: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  pendingBox: {
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
  },
  successText: {
    color: '#22c55e',
    fontWeight: '600',
    textAlign: 'center',
  },
  errorStatusText: {
    color: '#ef4444',
    fontWeight: '600',
    textAlign: 'center',
  },
  pendingText: {
    color: '#ca8a04',
    fontWeight: '600',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  errorMargin: {
    marginTop: 16,
  },
  buttonContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  actionButton: {
    marginTop: 16,
    paddingHorizontal: 24,
  },
  disabledButton: {
    opacity: 0.5,
  },
});
