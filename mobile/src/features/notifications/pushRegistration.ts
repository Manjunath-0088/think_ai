import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking, Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { apiData, apiRequest } from '@/api/http';

type NotificationsModule = typeof import('expo-notifications');

const PUSH_TOKEN_KEY = 'thinkz_push_token';

let notificationsModule: NotificationsModule | null = null;
let notificationHandlerInstalled = false;

/** Expo Go on a physical Android device cannot register for remote push. */
export function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo' || Constants.expoGoConfig != null;
}

/**
 * Remote push notifications require a development or standalone build.
 * Keep every `expo-notifications` import behind this check: merely importing
 * the module in Expo Go or on web prints noisy "not supported" warnings.
 */
export function canUseRemotePush(): boolean {
  return Platform.OS !== 'web' && !isExpoGo();
}

function loadNotifications(): NotificationsModule | null {
  if (!canUseRemotePush()) return null;

  if (!notificationsModule) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    notificationsModule = require('expo-notifications') as NotificationsModule;
  }
  const Notifications = notificationsModule;

  if (!notificationHandlerInstalled) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    notificationHandlerInstalled = true;
  }

  return Notifications;
}

/** Requests permission and stores the physical-device token on the LMS API. */
export async function registerPushNotifications(): Promise<string | null> {
  try {
    if (!canUseRemotePush() || !Device.isDevice) return null;

    const Notifications = loadNotifications();
    if (!Notifications) return null;

    const current = await Notifications.getPermissionsAsync();
    const final = current.status === 'granted' ? current : await Notifications.requestPermissionsAsync();
    if (final.status !== 'granted') return null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const token = await getDevicePushToken(Notifications);

    await apiData('/notifications/device-token', {
      method: 'PUT',
      body: { expoPushToken: token, platform: Platform.OS },
    });
    await AsyncStorage.setItem(PUSH_TOKEN_KEY, token).catch(() => undefined);
    return token;
  } catch {
    return null;
  }
}

async function getDevicePushToken(
  Notifications: NotificationsModule,
): Promise<string> {
  const projectId =
    Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId;
  return projectId
    ? (await Notifications.getExpoPushTokenAsync({ projectId })).data
    : (await Notifications.getExpoPushTokenAsync()).data;
}

/**
 * Revokes this device's push registration before the local session is cleared.
 *
 * The token is remembered locally so sign-out does not need to request push
 * permission again. If the network call fails the token is kept so a later
 * sign-out (or the next launch) can retry; the local session still clears.
 */
export async function unregisterPushNotifications(): Promise<boolean> {
  if (!canUseRemotePush()) return false;

  let token = await AsyncStorage.getItem(PUSH_TOKEN_KEY).catch(() => null);
  if (!token) {
    try {
      const Notifications = loadNotifications();
      if (!Notifications) return false;
      const permissions = await Notifications.getPermissionsAsync();
      if (permissions.status !== 'granted') return false;
      token = await getDevicePushToken(Notifications);
    } catch {
      return false;
    }
  }

  try {
    await apiRequest('/notifications/device-token', {
      method: 'DELETE',
      body: { expoPushToken: token },
    });
    await AsyncStorage.removeItem(PUSH_TOKEN_KEY).catch(() => undefined);
    return true;
  } catch {
    // Keep the token so a later sign-out retry can revoke it.
    return false;
  }
}

/** Route notification taps through the existing app deep-link listener. */
export function subscribeToNotificationDeepLinks(): () => void {
  if (!canUseRemotePush()) return () => undefined;

  let cancelled = false;
  let subscription: { remove(): void } | null = null;

  try {
    const Notifications = loadNotifications();
    if (Notifications && !cancelled) {
      subscription = Notifications.addNotificationResponseReceivedListener((response) => {
        const url = response.notification.request.content.data?.url;
        if (typeof url === 'string' && url.startsWith('thinkzai://')) void Linking.openURL(url);
      });
    }
  } catch {
    // Notifications are optional; unavailable/native errors must not crash App.
  }

  return () => {
    cancelled = true;
    subscription?.remove();
  };
}
