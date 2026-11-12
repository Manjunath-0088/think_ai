import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

import {
  __resetSessionForTests,
  getSession,
  registerSignOutCleanup,
  restoreSession,
  signIn,
  signOut,
} from '@/api/session';
import { CredentialStorageError } from '@/api/credentials';

const USER_ID_KEY = 'thinkz_forum_user_id';
const AUTH_TOKEN_KEY = 'thinkz_auth_token';
const PROFILE_KEY = 'thinkz_learner_profile';

beforeEach(() => {
  __resetSessionForTests();
  jest.clearAllMocks();
});

test('sign-in stores the token and profile in SecureStore, not AsyncStorage', async () => {
  await signIn('42', 'bearer-token', {
    name: 'Learner',
    email: 'learner@example.test',
    role: 'Learner',
  });

  expect(SecureStore.setItemAsync).toHaveBeenCalledWith(AUTH_TOKEN_KEY, 'bearer-token');
  expect(SecureStore.setItemAsync).toHaveBeenCalledWith(USER_ID_KEY, '42');
  expect(await AsyncStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
  expect(getSession()).toMatchObject({
    userId: '42',
    token: 'bearer-token',
    isSignedIn: true,
    persistenceError: null,
  });
});

test('restoreSession reads credentials back from SecureStore', async () => {
  await signIn('7', 'restored-token', {
    name: 'Restored',
    email: 'restored@example.test',
    role: 'Learner',
  });
  __resetSessionForTests();

  const restored = await restoreSession();

  expect(restored).toMatchObject({
    userId: '7',
    token: 'restored-token',
    isSignedIn: true,
    profile: { email: 'restored@example.test', role: 'Learner' },
  });
});

test('restoreSession migrates a legacy AsyncStorage token into SecureStore', async () => {
  await AsyncStorage.setItem(USER_ID_KEY, 'legacy-user');
  await AsyncStorage.setItem(AUTH_TOKEN_KEY, 'legacy-token');
  await AsyncStorage.setItem(
    PROFILE_KEY,
    JSON.stringify({ name: 'Legacy', email: 'legacy@example.test', role: 'Learner' }),
  );

  const restored = await restoreSession();

  expect(restored).toMatchObject({ userId: 'legacy-user', token: 'legacy-token' });
  expect(await SecureStore.getItemAsync(AUTH_TOKEN_KEY)).toBe('legacy-token');
  expect(await AsyncStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
});

test('a secure write failure keeps the app signed out and surfaces the error', async () => {
  (SecureStore.setItemAsync as jest.Mock).mockRejectedValueOnce(
    new Error('Keystore unavailable'),
  );

  await expect(signIn('9', 'token')).rejects.toBeInstanceOf(CredentialStorageError);
  expect(getSession()).toMatchObject({
    isSignedIn: false,
    token: null,
    persistenceError: expect.stringContaining('securely'),
  });
});

test('sign-out runs registered device cleanup before clearing credentials', async () => {
  const harness: string[] = [];
  registerSignOutCleanup(async () => {
    harness.push(`token:${getSession().token}`);
  });
  await signIn('5', 'logout-token');

  await signOut();

  expect(harness).toEqual(['token:logout-token']);
  expect(getSession()).toMatchObject({ isSignedIn: false, token: null });
  expect(await SecureStore.getItemAsync(AUTH_TOKEN_KEY)).toBeNull();
});

test('sign-out still clears the session when device cleanup fails', async () => {
  registerSignOutCleanup(async () => {
    throw new Error('offline');
  });
  await signIn('5', 'logout-token');

  await signOut();

  expect(getSession()).toMatchObject({ isSignedIn: false, token: null });
});
