import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { SESSION_STORAGE_KEY } from './deployment';

// Native tokens live in Android Keystore/iOS Keychain-backed storage.
// The web preview uses tab-scoped sessionStorage; passwords are never persisted.
export async function readAuthToken(): Promise<string | null> {
  return Platform.OS === 'web'
    ? globalThis.sessionStorage.getItem(SESSION_STORAGE_KEY)
    : SecureStore.getItemAsync(SESSION_STORAGE_KEY);
}
export async function writeAuthToken(token: string): Promise<void> {
  if (Platform.OS === 'web') globalThis.sessionStorage.setItem(SESSION_STORAGE_KEY, token);
  else await SecureStore.setItemAsync(SESSION_STORAGE_KEY, token);
}
export async function deleteAuthToken(): Promise<void> {
  if (Platform.OS === 'web') globalThis.sessionStorage.removeItem(SESSION_STORAGE_KEY);
  else await SecureStore.deleteItemAsync(SESSION_STORAGE_KEY);
}
