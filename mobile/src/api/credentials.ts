import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Platform-backed credential storage.
 *
 * Android/iOS use Expo SecureStore (Android Keystore-backed) for the bearer
 * token, user id and profile. Web and test targets fall back to AsyncStorage,
 * which is the only key-value store available there.
 *
 * SecureStore keys may only contain letters, numbers, `.`, `-` and `_`; the
 * keys used below satisfy that contract.
 */

export class CredentialStorageError extends Error {
  readonly reason?: unknown;

  constructor(message: string, reason?: unknown) {
    super(message);
    this.name = 'CredentialStorageError';
    this.reason = reason;
  }
}

export function usesSecureCredentialStorage(): boolean {
  return Platform.OS === 'android' || Platform.OS === 'ios';
}

export async function readCredential(key: string): Promise<string | null> {
  if (!usesSecureCredentialStorage()) {
    return AsyncStorage.getItem(key);
  }
  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    throw new CredentialStorageError('Could not read saved sign-in credentials.', error);
  }
}

export async function writeCredential(key: string, value: string): Promise<void> {
  if (!usesSecureCredentialStorage()) {
    await AsyncStorage.setItem(key, value);
    return;
  }
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    throw new CredentialStorageError('Could not securely save sign-in credentials.', error);
  }
}

export async function deleteCredential(key: string): Promise<void> {
  if (!usesSecureCredentialStorage()) {
    await AsyncStorage.removeItem(key);
    return;
  }
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    throw new CredentialStorageError('Could not remove saved sign-in credentials.', error);
  }
}

/** Test seam: clears both stores regardless of Platform.OS. */
export async function __clearCredentialStoresForTests(): Promise<void> {
  await AsyncStorage.clear();
  if (usesSecureCredentialStorage()) {
    await SecureStore.deleteItemAsync('__thinkz_test_probe__').catch(() => undefined);
  }
}
