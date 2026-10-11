import { Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';
import type * as NotificationsModule from 'expo-notifications';

// expo-notifications throws on import in Expo Go on Android (remote push was removed in SDK 53),
// so only require it when it can load. Null means notifications are unavailable.
export const Notifications: typeof NotificationsModule | null =
  Platform.OS === 'android' && isRunningInExpoGo() ? null : require('expo-notifications');
