/**
 * Push Notifications Hook
 * =========================
 * Hook for handling push notifications in components
 */

import {
  registerForPushNotificationsAsync,
  type Notification,
  type NotificationResponse,
} from '@/utils/notifications';
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useState } from 'react';

interface UseNotificationsReturn {
  expoPushToken: string | null;
  notification: Notification | null;
  isLoading: boolean;
  error: Error | null;
  requestPermission: () => Promise<string | null>;
}

/**
 * Hook to handle push notifications
 *
 * Usage:
 * const { expoPushToken, notification } = useNotifications({
 *   onNotificationReceived: (notification) => console.log(notification),
 *   onNotificationResponse: (response) => navigateToScreen(response.notification.request.content.data),
 * });
 */
export function useNotifications(options?: {
  onNotificationReceived?: (notification: Notification) => void;
  onNotificationResponse?: (response: NotificationResponse) => void;
}): UseNotificationsReturn {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const requestPermission = useCallback(async (): Promise<string | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await registerForPushNotificationsAsync();
      setExpoPushToken(token);
      return token;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to register for notifications'));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Register for push notifications
    requestPermission();

    // Listen for incoming notifications (app in foreground)
    const notificationSub = Notifications.addNotificationReceivedListener((notif) => {
      setNotification(notif);
      options?.onNotificationReceived?.(notif);
    });

    // Listen for notification responses (user tapped notification)
    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      options?.onNotificationResponse?.(response);
    });

    return () => {
      notificationSub.remove();
      responseSub.remove();
    };
  }, [requestPermission]);

  return {
    expoPushToken,
    notification,
    isLoading,
    error,
    requestPermission,
  };
}
