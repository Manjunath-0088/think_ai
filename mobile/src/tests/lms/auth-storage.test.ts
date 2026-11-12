import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { __resetSessionForTests, signIn, signOut, restoreSession } from '@/api/session';
import { SESSION_STORAGE_KEY } from '@/lms/deployment';
beforeEach(() => { jest.clearAllMocks(); __resetSessionForTests(); });
test('native token is stored securely and never written to AsyncStorage', async () => {
  await signIn('7', 'private-access-token');
  expect(SecureStore.setItemAsync).toHaveBeenCalledWith(SESSION_STORAGE_KEY, 'private-access-token');
  expect(AsyncStorage.setItem).not.toHaveBeenCalledWith(expect.anything(), 'private-access-token');
  __resetSessionForTests();
  expect(await restoreSession()).toMatchObject({ token: 'private-access-token', isSignedIn: true });
});
test('sign-out removes the persisted token', async () => {
  await signIn('7', 'private-access-token');
  await signOut(); __resetSessionForTests();
  expect(await restoreSession()).toMatchObject({ token: null, isSignedIn: false });
});
test('legacy plaintext or another API deployment token is never restored', async () => {
  await AsyncStorage.setItem('thinkz_auth_token', 'old-plaintext-token');
  await AsyncStorage.setItem('thinkz_forum_user_id', '7');
  expect(await restoreSession()).toMatchObject({ token: null });
});
test('secure storage failure does not publish an authenticated session', async () => {
  (SecureStore.setItemAsync as jest.Mock).mockRejectedValueOnce(new Error('Keystore unavailable'));
  await expect(signIn('7', 'private-access-token')).rejects.toThrow('Keystore unavailable');
  expect(await restoreSession()).toMatchObject({ token: null, isSignedIn: false });
});
