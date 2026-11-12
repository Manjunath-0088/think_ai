import AsyncStorage from '@react-native-async-storage/async-storage';
import { readAuthToken, writeAuthToken, deleteAuthToken } from '@/lms/authStorage';

import {
  CredentialStorageError,
  deleteCredential,
  readCredential,
  writeCredential,
} from './credentials';

/**
 * Identity for the forum/payments HTTP layer (Pages 6–10).
 *
 * The backend resolves the caller from the `x-user-id` header (falling back to
 * a demo user), so the app only has to remember *who* is signed in. State is
 * mirrored in platform-backed credential storage so the id and bearer token
 * survive a relaunch, and every mutation is published to subscribers —
 * `useBookmarks` re-syncs on sign-in / sign-out.
 *
 * On Android/iOS the bearer token is stored through Expo SecureStore (Android
 * Keystore-backed). Any older AsyncStorage value is migrated once on restore.
 */

export const DEFAULT_USER_ID = 'u1';

const USER_ID_KEY = 'thinkz_forum_user_id';
const AUTH_TOKEN_KEY = 'thinkz_auth_token';
const PROFILE_KEY = 'thinkz_learner_profile';

export interface SessionProfile {
  name: string | null;
  email: string;
  role: string;
  createdAt?: string | null;
}

export interface SessionState {
  userId: string;
  /** Optional bearer token for the LMS-side endpoints. `null` when signed out. */
  token: string | null;
  isSignedIn: boolean;
  profile?: SessionProfile | null;
  /**
   * Set when credentials could not be persisted/removed. The UI can surface
   * this instead of silently pretending the secure write succeeded.
   */
  persistenceError?: string | null;
}

type SessionListener = (session: SessionState) => void;

let session: SessionState = {
  userId: DEFAULT_USER_ID,
  token: null,
  isSignedIn: false,
  profile: null,
  persistenceError: null,
};

const listeners = new Set<SessionListener>();
let restorePromise: Promise<SessionState> | null = null;
let signOutCleanup: (() => Promise<void>) | null = null;

/**
 * Registers a best-effort cleanup that runs before the local session clears.
 * The notification module uses this to revoke the device push token while the
 * bearer token is still available. It is intentionally a registration seam so
 * `session.ts` does not depend on feature modules.
 */
export function registerSignOutCleanup(cleanup: () => Promise<void>): () => void {
  signOutCleanup = cleanup;
  return () => {
    if (signOutCleanup === cleanup) signOutCleanup = null;
  };
}

function publish(next: SessionState): void {
  session = next;
  listeners.forEach((listener) => listener(session));
}

export function getSession(): SessionState {
  return session;
}

/** Subscribes to sign-in / sign-out / user-switch events. Returns unsubscribe. */
export function subscribeToSession(listener: SessionListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Reads a credential from the secure store, migrating an AsyncStorage value
 * written by older app versions. Migration failures are non-fatal: the value
 * is still returned so the user stays signed in, and the next sign-in writes
 * it securely.
 */
async function readPersisted(key: string): Promise<string | null> {
  let secureValue: string | null = null;
  let secureError: unknown = null;
  try {
    secureValue = await readCredential(key);
  } catch (error) {
    secureError = error;
  }
  if (secureValue !== null) return secureValue;

  const legacyValue = await AsyncStorage.getItem(key);
  if (legacyValue !== null) {
    try {
      await writeCredential(key, legacyValue);
      await AsyncStorage.removeItem(key);
    } catch {
      // Keep the legacy value readable; sign-in remains functional for this run.
    }
    return legacyValue;
  }

  if (secureError) throw secureError;
  return null;
}

/**
 * Loads the persisted identity exactly once. Every request awaits this so the
 * first `x-user-id` header already reflects the stored user.
 */
export function restoreSession(): Promise<SessionState> {
  if (restorePromise === null) {
    restorePromise = Promise.all([
      readPersisted(USER_ID_KEY),
      readPersisted(AUTH_TOKEN_KEY),
      readPersisted(PROFILE_KEY),
    ])
      .then(([userId, token, rawProfile]) => {
        let profile: SessionProfile | null = null;
        if (rawProfile) {
          try {
            const parsed = JSON.parse(rawProfile) as Partial<SessionProfile>;
            if (typeof parsed.email === 'string' && typeof parsed.role === 'string') {
              profile = {
                name: typeof parsed.name === 'string' ? parsed.name : null,
                email: parsed.email,
                role: parsed.role,
                createdAt: typeof parsed.createdAt === 'string' ? parsed.createdAt : null,
              };
            }
          } catch {
            profile = null;
          }
        }
        const next: SessionState = {
          userId: userId ?? DEFAULT_USER_ID,
          token: token,
          isSignedIn: userId !== null && token !== null,
          profile,
          persistenceError: null,
        };
        session = next;
        return next;
      })
      .catch(() => {
        const next: SessionState = {
          ...session,
          isSignedIn: false,
          token: null,
          persistenceError:
            'Saved credentials could not be read securely. Please sign in again.',
        };
        session = next;
        return next;
      });
  }
  return restorePromise;
}

async function clearPersistedCredentials(): Promise<void> {
  const errors: unknown[] = [];
  for (const key of [USER_ID_KEY, AUTH_TOKEN_KEY, PROFILE_KEY]) {
    try {
      await deleteCredential(key);
    } catch (error) {
      errors.push(error);
    }
    // Remove any pre-migration copy as well. This must never resurrect a
    // signed-out token on a later launch.
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      errors.push(error);
    }
  }
  if (errors.length > 0) {
    throw new CredentialStorageError('Could not remove saved sign-in credentials.', errors[0]);
  }
}

export async function signIn(
  userId: string,
  token?: string | null,
  profile?: SessionProfile | null
): Promise<SessionState> {
  const trimmed = userId.trim() || DEFAULT_USER_ID;
  // Fail sign-in if the authenticated session cannot be securely persisted.
  if (token) await writeAuthToken(token);
  else await deleteAuthToken();
  try {
    await writeCredential(USER_ID_KEY, trimmed);
    if (token) {
      await writeCredential(AUTH_TOKEN_KEY, token);
    } else {
      await deleteCredential(AUTH_TOKEN_KEY);
    }
    if (profile) {
      await writeCredential(PROFILE_KEY, JSON.stringify(profile));
    } else {
      await deleteCredential(PROFILE_KEY);
    }
  } catch (error) {
    // Roll back any partially written credentials and keep the app signed out.
    // An in-memory-only session would silently vanish on the next launch, so
    // surface the failure to the sign-in screen instead.
    await clearPersistedCredentials().catch(() => undefined);
    const next: SessionState = {
      userId: DEFAULT_USER_ID,
      token: null,
      isSignedIn: false,
      profile: null,
      persistenceError:
        error instanceof Error && error.message
          ? error.message
          : 'Could not securely save your sign-in on this device.',
    };
    publish(next);
    throw new CredentialStorageError(
      'Your sign-in could not be saved securely. Check device storage and try again.',
      error
    );
  }
  const next: SessionState = {
    userId: trimmed,
    token: token ?? null,
    isSignedIn: true,
    profile: profile ?? null,
    persistenceError: null,
  };
  publish(next);
  return next;
}

export async function signOut(): Promise<SessionState> {
  if (signOutCleanup) {
    try {
      await signOutCleanup();
    } catch {
      // Device cleanup must not prevent the local session from clearing.
    }
  }
  let persistenceError: string | null = null;
  try {
    await clearPersistedCredentials();
  } catch {
    persistenceError =
      'Saved credentials could not be fully removed from this device. Sign in again and retry sign-out.';
  }
  const next: SessionState = {
    userId: DEFAULT_USER_ID,
    token: null,
    isSignedIn: false,
    profile: null,
    persistenceError,
  };
  publish(next);
  return next;
}

/** Test seam: resets module state between suites. */
export function __resetSessionForTests(): void {
  session = {
    userId: DEFAULT_USER_ID,
    token: null,
    isSignedIn: false,
    profile: null,
    persistenceError: null,
  };
  restorePromise = null;
  listeners.clear();
}
