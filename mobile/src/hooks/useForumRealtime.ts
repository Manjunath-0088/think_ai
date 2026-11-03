import { useEffect } from 'react';
import { io } from 'socket.io-client';

import { API_BASE_URL } from '@/api/http';
import { useSession } from './useSession';

export interface ForumRealtimeHandlers {
  onDiscussionNew?: (payload: unknown) => void;
  onNotification?: (payload: unknown) => void;
  onModerationUpdate?: (payload: unknown) => void;
  onBookmarkChanged?: (payload: unknown) => void;
}

/** Connects an authenticated learner to the existing `/forum` Socket.IO namespace. */
export function useForumRealtime(handlers: ForumRealtimeHandlers = {}) {
  const session = useSession();
  const { onDiscussionNew, onNotification, onModerationUpdate, onBookmarkChanged } = handlers;

  useEffect(() => {
    if (!session.isSignedIn || !session.token) return undefined;
    const origin = API_BASE_URL.replace(/\/api\/?$/, '');
    const socket = io(`${origin}/forum`, {
      auth: { token: session.token },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 10000,
      transports: ['websocket', 'polling'],
    });

    if (onDiscussionNew) socket.on('discussion:new', onDiscussionNew);
    if (onNotification) socket.on('notification:new', onNotification);
    if (onModerationUpdate) socket.on('moderation:update', onModerationUpdate);
    if (onBookmarkChanged) socket.on('bookmark:changed', onBookmarkChanged);

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [onBookmarkChanged, onDiscussionNew, onModerationUpdate, onNotification, session.isSignedIn, session.token]);
}

export default useForumRealtime;
