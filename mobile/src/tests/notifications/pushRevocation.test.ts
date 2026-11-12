import AsyncStorage from '@react-native-async-storage/async-storage';

const mockGetExpoPushTokenAsync = jest.fn(async () => ({ data: 'ExpoPushToken[device-1]' }));
const mockGetPermissionsAsync = jest.fn(async () => ({ status: 'granted' }));
const mockApiData = jest.fn(async (_path?: unknown, _options?: unknown) => ({ id: 1 }));
const mockApiRequest = jest.fn(async (_path?: unknown, _options?: unknown) => ({
  success: true,
  data: { removed: 1 },
}));

jest.mock('expo-constants', () => ({
  appOwnership: 'standalone',
  expoConfig: { extra: {} },
  easConfig: { projectId: 'project-1' },
}));
jest.mock('expo-device', () => ({ isDevice: true }));
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: () => mockGetPermissionsAsync(),
  requestPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  setNotificationChannelAsync: jest.fn(),
  getExpoPushTokenAsync: () => mockGetExpoPushTokenAsync(),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  AndroidImportance: { DEFAULT: 3 },
}));
jest.mock('@/api/http', () => ({
  apiData: (path?: unknown, options?: unknown) => mockApiData(path, options),
  apiRequest: (path?: unknown, options?: unknown) => mockApiRequest(path, options),
}));

import {
  registerPushNotifications,
  unregisterPushNotifications,
} from '@/features/notifications/pushRegistration';

beforeEach(() => {
  jest.clearAllMocks();
});

test('unregisterPushNotifications deletes the remembered device token', async () => {
  await registerPushNotifications();
  expect(await AsyncStorage.getItem('thinkz_push_token')).toBe('ExpoPushToken[device-1]');

  await expect(unregisterPushNotifications()).resolves.toBe(true);

  expect(mockApiRequest).toHaveBeenCalledWith('/notifications/device-token', {
    method: 'DELETE',
    body: { expoPushToken: 'ExpoPushToken[device-1]' },
  });
  expect(await AsyncStorage.getItem('thinkz_push_token')).toBeNull();
});

test('a failed revocation keeps the token for a later retry', async () => {
  await registerPushNotifications();
  mockApiRequest.mockRejectedValueOnce(new Error('offline'));

  await expect(unregisterPushNotifications()).resolves.toBe(false);

  expect(await AsyncStorage.getItem('thinkz_push_token')).toBe('ExpoPushToken[device-1]');
});
