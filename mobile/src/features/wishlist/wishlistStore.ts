import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Saved-course IDs are local because the backend has no wishlist endpoint.
 * Keep each account isolated on shared devices and hydrate the active account
 * whenever the authenticated identity changes.
 */
export const WISHLIST_STORAGE_KEY = 'thinkz_wishlist_v2';
const ANONYMOUS_USER = 'anonymous';

let activeUserId = ANONYMOUS_USER;
let ids: string[] = [];
let hydratePromise: Promise<string[]> | null = null;
let hydrated = false;
let mutationVersion = 0;
const listeners = new Set<() => void>();
const pendingWrites = new Map<string, Promise<void>>();

function normalizeUserId(userId?: string | null): string {
  return userId?.trim() || ANONYMOUS_USER;
}

function storageKey(userId: string): string {
  return `${WISHLIST_STORAGE_KEY}:${encodeURIComponent(userId)}`;
}

function notify(): void {
  listeners.forEach((listener) => listener());
}

function selectUser(userId: string): void {
  if (userId === activeUserId) return;
  activeUserId = userId;
  ids = [];
  hydratePromise = null;
  hydrated = false;
  mutationVersion = 0;
  notify();
}

function parseStored(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (value, index, all): value is string =>
        typeof value === 'string' && value.length > 0 && all.indexOf(value) === index,
    );
  } catch {
    return [];
  }
}

function persist(userId: string, next: string[]): Promise<void> {
  const key = storageKey(userId);
  const previous = pendingWrites.get(key) ?? Promise.resolve();
  const write = previous
    .catch(() => undefined)
    .then(() => AsyncStorage.setItem(key, JSON.stringify(next)))
    .catch(() => {
      // Keep this local preference usable for the current app run if storage is unavailable.
    });
  pendingWrites.set(key, write);
  void write.finally(() => {
    if (pendingWrites.get(key) === write) pendingWrites.delete(key);
  });
  return write;
}

function loadActiveUser(): Promise<string[]> {
  if (hydratePromise) return hydratePromise;
  const userId = activeUserId;
  const loadVersion = mutationVersion;
  const pendingWrite = pendingWrites.get(storageKey(userId)) ?? Promise.resolve();
  hydratePromise = pendingWrite
    .then(() => AsyncStorage.getItem(storageKey(userId)))
    .then((raw) => {
      const stored = parseStored(raw);
      if (activeUserId === userId && mutationVersion === loadVersion) ids = stored;
      return activeUserId === userId ? ids : stored;
    })
    .catch(() => (activeUserId === userId ? ids : []))
    .finally(() => {
      if (activeUserId === userId) {
        hydrated = true;
        notify();
      }
    });
  return hydratePromise;
}

export function getWishlistIds(userId?: string | null): string[] {
  return normalizeUserId(userId) === activeUserId ? ids : [];
}

export function isWishlistHydrated(userId?: string | null): boolean {
  return normalizeUserId(userId) === activeUserId && hydrated;
}

export function getActiveWishlistUserId(): string {
  return activeUserId;
}

export function subscribeToWishlist(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Selects and loads one account's saved IDs. */
export function activateWishlist(userId?: string | null): Promise<string[]> {
  selectUser(normalizeUserId(userId));
  return loadActiveUser();
}

/** Loads the active account once for this app run. */
export function hydrateWishlist(userId?: string | null): Promise<string[]> {
  const target = normalizeUserId(userId);
  if (target !== activeUserId) return activateWishlist(target);
  return loadActiveUser();
}

function updateWishlist(
  userId: string,
  next: string[],
): string[] {
  if (userId !== activeUserId) return ids;
  ids = next;
  mutationVersion += 1;
  notify();
  void persist(userId, next);
  return ids;
}

export function toggleWishlist(
  courseId: string,
  userId: string | null | undefined = activeUserId,
): string[] {
  const target = normalizeUserId(userId);
  const next = ids.includes(courseId)
    ? ids.filter((id) => id !== courseId)
    : [courseId, ...ids];
  return updateWishlist(target, next);
}

export function addToWishlist(
  courseId: string,
  userId: string | null | undefined = activeUserId,
): string[] {
  const target = normalizeUserId(userId);
  if (target !== activeUserId || ids.includes(courseId)) return ids;
  return updateWishlist(target, [courseId, ...ids]);
}

export function removeFromWishlist(
  courseId: string,
  userId: string | null | undefined = activeUserId,
): string[] {
  const target = normalizeUserId(userId);
  if (target !== activeUserId || !ids.includes(courseId)) return ids;
  return updateWishlist(target, ids.filter((id) => id !== courseId));
}

/** Test seam: resets in-memory state and listeners between suites. */
export function __resetWishlistForTests(): void {
  activeUserId = ANONYMOUS_USER;
  ids = [];
  hydratePromise = null;
  hydrated = false;
  mutationVersion = 0;
  pendingWrites.clear();
  listeners.clear();
}
