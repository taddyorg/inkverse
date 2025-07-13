import React, { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { navigateToDeepLinkAndResetNavigation } from '@/constants/Navigation';
import { RootStackParamList, HOME_TAB, HOME_SCREEN, COMICISSUE_SCREEN, COMICSERIES_SCREEN } from '@/constants/Navigation';

interface NotificationData {
  type?: string;
  seriesUuid?: string;
  issueUuid?: string;
  [key: string]: any;
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);
  const lastNotificationResponse = Notifications.useLastNotificationResponse();
  const processedNotificationIds = useRef<Set<string>>(new Set());
  const isNavigating = useRef(false);

  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    const notificationId = response.notification.request.identifier;
    
    // Prevent processing the same notification multiple times
    if (processedNotificationIds.current.has(notificationId)) {
      return;
    }
    
    // Prevent navigation if already navigating
    if (isNavigating.current) {
      return;
    }
    
    const data = response.notification.request.content.data as NotificationData;
    
    if (!data) return;

    // Mark this notification as processed
    processedNotificationIds.current.add(notificationId);
    
    // Clean up old notification IDs to prevent memory leak
    if (processedNotificationIds.current.size > 100) {
      const idsArray = Array.from(processedNotificationIds.current);
      processedNotificationIds.current = new Set(idsArray.slice(-50));
    }

    switch (data.type) {
      case 'NEW_EPISODE_RELEASED':
        if (data.issueUuid && data.seriesUuid) {
          isNavigating.current = true;
          
          navigateToDeepLinkAndResetNavigation({
            navigation,
            rootTab: HOME_TAB,
            rootScreen: HOME_SCREEN,
            parentScreenName: COMICSERIES_SCREEN,
            parentScreenParams: {
              uuid: data.seriesUuid,
            },
            screenName: COMICISSUE_SCREEN,
            screenParams: {
              seriesUuid: data.seriesUuid,
              issueUuid: data.issueUuid,
            },
          });
          
          // Reset navigation flag after a delay
          setTimeout(() => {
            isNavigating.current = false;
          }, 500);
        }
        break;
      default:
        console.log('Unknown notification type:', data.type);
    }
  };

  useEffect(() => {
    if (lastNotificationResponse && lastNotificationResponse.notification) {
      const notificationId = lastNotificationResponse.notification.request.identifier;
      
      // Only process if this is a new notification we haven't seen
      if (!processedNotificationIds.current.has(notificationId)) {
        handleNotificationResponse(lastNotificationResponse);
      }
    }
  }, [lastNotificationResponse?.notification?.request?.identifier]);

  useEffect(() => {
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      handleNotificationResponse(response);
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  return <>{children}</>;
};