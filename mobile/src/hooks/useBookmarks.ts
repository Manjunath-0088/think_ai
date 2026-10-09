import { useCallback, useEffect, useRef, useState } from 'react';

import { subscribeToSession } from '@/api/session';
import { toErrorMessage } from './useAsyncResource';
import { useApiClient } from './useApiClient';
import { useSession } from './useSession';
import type { BookmarkRecord } from '@/types/community';

/**
 * Page 8 — Bookmarks data source.
 *
 * Loads the signed-in user's bookmark list plus the `syncedAt` stamp the
 * backend returns for the sync indicator, keeps the list in step with
 * sign-in / sign-out events, and removes bookmarks optimistically with a
 * rollback when `DELETE /bookmarks/:userId/:discussionId` fails.
 */
export function useBookmarks() {
  const client = useApiClient();
  const session = useSession();

  const [bookmarks, setBookmarks] = useState<BookmarkRecord[]>([]);
  const [syncedAt, setSyncedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRemovingId, setIsRemovingId] = useState<string | null>(null);

  const loadedForUser = useRef<string | null>(null);

  const load = useCallback(
    async (mode: 'initial' | 'refresh') => {
      if (mode === 'refresh') {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
        setError(null);
      }
      try {
        const page = await client.fetchBookmarks();
        setBookmarks(page.bookmarks);
        setSyncedAt(page.syncedAt);
        setError(null);
      } catch (cause) {
        setError(toErrorMessage(cause));
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [client]
  );

  // Initial load, then re-sync whenever the signed-in user changes.
  useEffect(() => {
    if (loadedForUser.current === session.userId) {
      return;
    }
    const isFirstLoad = loadedForUser.current === null;
    loadedForUser.current = session.userId;
    void load(isFirstLoad ? 'initial' : 'refresh');
  }, [load, session.userId]);

  // Belt-and-braces: explicit session events (sign-in/out mid-lifetime).
  useEffect(() => {
    return subscribeToSession((next) => {
      if (loadedForUser.current !== next.userId) {
        loadedForUser.current = next.userId;
        void load('refresh');
      }
    });
  }, [load]);

  /** Optimistic removal — restores the row if the DELETE call fails. */
  const removeBookmark = useCallback(
    async (discussionId: string): Promise<boolean> => {
      const snapshot = bookmarks;
      setBookmarks((prev) =>
        prev.filter((record) => record.discussionId !== discussionId)
      );
      setIsRemovingId(discussionId);
      setError(null);
      try {
        await client.removeBookmark(session.userId, discussionId);
        return true;
      } catch (cause) {
        setBookmarks(snapshot);
        setError(toErrorMessage(cause));
        return false;
      } finally {
        setIsRemovingId(null);
      }
    },
    [bookmarks, client, session.userId]
  );

  const refresh = useCallback(() => {
    void load('refresh');
  }, [load]);

  return {
    bookmarks,
    syncedAt,
    isLoading,
    isRefreshing,
    hasError: error !== null,
    error,
    isRemovingId,
    isEmpty: !isLoading && error === null && bookmarks.length === 0,
    load,
    refresh,
    removeBookmark,
  };
}

export default useBookmarks;
