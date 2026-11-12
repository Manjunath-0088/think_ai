import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  activateWishlist,
  getWishlistIds,
  isWishlistHydrated,
  removeFromWishlist,
  subscribeToWishlist,
  toggleWishlist,
} from '@/features/wishlist/wishlistStore';
import { useSession } from '@/hooks/useSession';

/**
 * Reactive wishlist state shared by every course surface.
 *
 * Restores the persisted ids on mount and re-renders whenever another screen
 * saves or removes a course.
 */
export function useWishlist() {
  const session = useSession();
  const wishlistUserId = session.token ? session.userId : null;
  const [snapshot, setSnapshot] = useState(() => ({
    userId: wishlistUserId,
    ids: getWishlistIds(wishlistUserId),
  }));

  useEffect(() => {
    let active = true;
    const unsubscribe = subscribeToWishlist(() => {
      if (active) {
        setSnapshot({ userId: wishlistUserId, ids: getWishlistIds(wishlistUserId) });
      }
    });
    void activateWishlist(wishlistUserId).then((next) => {
      if (active) {
        setSnapshot({ userId: wishlistUserId, ids: next });
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [wishlistUserId]);

  // Never render the previous account's saved IDs during an account switch.
  const ids = useMemo(
    () => (snapshot.userId === wishlistUserId ? snapshot.ids : []),
    [snapshot.ids, snapshot.userId, wishlistUserId],
  );

  const savedCourseIds = useMemo(() => new Set(ids), [ids]);

  const toggle = useCallback((courseId: string) => {
    toggleWishlist(courseId, wishlistUserId);
  }, [wishlistUserId]);

  const remove = useCallback((courseId: string) => {
    removeFromWishlist(courseId, wishlistUserId);
  }, [wishlistUserId]);

  const isSaved = useCallback(
    (courseId: string) => savedCourseIds.has(courseId),
    [savedCourseIds]
  );

  return {
    ids,
    savedCourseIds,
    count: ids.length,
    isSaved,
    toggle,
    remove,
    isReady: snapshot.userId === wishlistUserId && isWishlistHydrated(wishlistUserId),
  };
}

export default useWishlist;
