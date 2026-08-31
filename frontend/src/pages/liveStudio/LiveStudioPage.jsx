import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "../../styles/liveStudio.css";

import VideoPlaceholder from "../../components/liveStudio/VideoPlaceholder";
import AttendeeList from "../../components/liveStudio/AttendeeList";
import ChatPanel from "../../components/liveStudio/ChatPanel";
import PollPanel from "../../components/liveStudio/PollPanel";
import StudioToolbar from "../../components/liveStudio/StudioToolbar";
import NotificationToast from "../../components/forum/NotificationToast";

import {
  createStudioPoll,
  fetchStudioSession,
  joinStudioSession,
  voteStudioPoll,
} from "../../services/studioApi";
import { getCurrentUserId } from "../../services/forumHttpClient";
import { useStudioSocket } from "../../hooks/useWebSocket";
import { STUDIO_EVENTS } from "../../services/websocket";

const DEFAULT_SESSION_ID = "s1";
const MODERATOR_ROLES = ["Moderator", "Admin"];

/** Live Class Studio (Phase 6/7). */
export default function LiveStudioPage() {
  const sessionId = DEFAULT_SESSION_ID;
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [polls, setPolls] = useState([]);
  const [error, setError] = useState(null);
  const [toasts, setToasts] = useState([]);

  const [muted, setMuted] = useState(true);
  const [cameraOn, setCameraOn] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);

  const user = useMemo(
    () => ({ id: getCurrentUserId(), name: "You" }),
    []
  );

  const { mode, subscribe, emit } = useStudioSocket({ sessionId, user });

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchStudioSession(sessionId), joinStudioSession(sessionId)])
      .then(([fetched]) => {
        if (cancelled) return;
        setSession(fetched);
        setMessages(fetched.messages || []);
        setPolls(fetched.polls || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load studio session");
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  // Real-time subscriptions (live socket or mock fallback).
  useEffect(() => {
    const unsubState = subscribe(STUDIO_EVENTS.STATE, (state) => {
      setSession(state);
      if (!state.messages?.length) return;
    });

    const unsubChat = subscribe(STUDIO_EVENTS.CHAT_NEW, (message) => {
      setMessages((previous) =>
        previous.some((m) => m.id === message.id) ? previous : [...previous, message]
      );
    });

    const unsubPoll = subscribe(STUDIO_EVENTS.POLL_UPDATE, (poll) => {
      setPolls((previous) => {
        const index = previous.findIndex((p) => p.id === poll.id);
        if (index === -1) return [...previous, poll];
        const next = [...previous];
        next[index] = poll;
        return next;
      });
    });

    const unsubDeleted = subscribe(STUDIO_EVENTS.MESSAGE_DELETED, ({ messageId }) => {
      setMessages((previous) =>
        previous.map((m) => (m.id === messageId ? { ...m, deleted: true } : m))
      );
    });

    return () => {
      unsubState();
      unsubChat();
      unsubPoll();
      unsubDeleted();
    };
  }, [subscribe]);

  const pushToast = useCallback((notification) => {
    setToasts((previous) => [...previous.slice(-2), notification]);
  }, []);

  const patchSelf = useCallback((patch) => {
    emit(STUDIO_EVENTS.PRESENCE, { sessionId, userId: user.id, patch });
    setSession((previous) =>
      previous
        ? {
            ...previous,
            attendees: previous.attendees.map((attendee) =>
              attendee.userId === user.id ? { ...attendee, ...patch } : attendee
            ),
          }
        : previous
    );
  }, [emit, sessionId, user.id]);

  const handleSend = (text) =>
    emit(STUDIO_EVENTS.CHAT_SEND, { sessionId, text, user });

  const handleVotePoll = async (pollId, optionId) => {
    try {
      const updatedPoll = await voteStudioPoll(pollId, optionId);
      setPolls((previous) => previous.map((p) => (p.id === pollId ? updatedPoll : p)));
    } catch (err) {
      pushToast({ id: `poll-err-${Date.now()}`, message: err.message || "Vote failed" });
    }
  };

  const handleCreatePoll = async ({ question, options }) => {
    try {
      const created = await createStudioPoll(sessionId, { question, options });
      setPolls((previous) => [...previous, created]);
      emit(STUDIO_EVENTS.POLL_CREATE, { sessionId, poll: created });
      pushToast({ id: `poll-${Date.now()}`, message: "Poll published to attendees." });
    } catch (err) {
      pushToast({ id: `poll-err-${Date.now()}`, message: err.message || "Could not create poll" });
    }
  };

  const canModerate = MODERATOR_ROLES.includes("Moderator"); // demo identity is moderator-capable host
  const attendees = session?.attendees || [];
  const onlineCount = attendees.filter((a) => a.online).length;

  if (error) {
    return (
      <div className="studio-page">
        <div className="studio-container">
          <div className="error-banner" role="alert">{error}</div>
          <Link to="/forum" className="btn btn--ghost">← Back to forum</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="studio-page">
      <div className="studio-container">
        <header className="studio-header">
          <h1>{session?.title || "Live Class Studio"}</h1>
          <span className="live-pill">● LIVE</span>
          <span className="mode-pill">socket: {mode}</span>
          <span style={{ flex: 1 }} />
          <Link to="/forum" className="btn btn--ghost btn--small">← Forum</Link>
        </header>

        <div className="studio-grid">
          <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
            <VideoPlaceholder
              title={session?.title || "Waiting for session…"}
              isSharing={sharing}
              attendeeCount={onlineCount}
            />
            <ChatPanel
              messages={messages}
              onSend={handleSend}
              onDeleteMessage={(messageId) =>
                emit(STUDIO_EVENTS.DELETE_MESSAGE, { sessionId, messageId })
              }
              canModerate={canModerate}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
            <AttendeeList attendees={attendees} hostId={session?.hostId} currentUserId={user.id} />
            <PollPanel
              polls={polls}
              onVote={handleVotePoll}
              onCreatePoll={handleCreatePoll}
              canCreatePoll={canModerate}
            />
          </div>
        </div>

        <StudioToolbar
          muted={muted}
          cameraOn={cameraOn}
          sharing={sharing}
          handRaised={handRaised}
          onToggleMute={() => {
            setMuted((previous) => !previous);
            patchSelf({ muted: !muted });
          }}
          onToggleCamera={() => {
            setCameraOn((previous) => !previous);
            patchSelf({ cameraOn: !cameraOn });
          }}
          onToggleShare={() => {
            setSharing((previous) => !previous);
            pushToast({
              id: `share-${Date.now()}`,
              type: "moderation",
              message: sharing
                ? "Screen share stopped."
                : "Screen share placeholder enabled — real capture arrives with the media module.",
            });
          }}
          onToggleHand={() => {
            setHandRaised((previous) => !previous);
            patchSelf({ raisedHand: !handRaised });
          }}
        />
      </div>

      <NotificationToast
        notifications={toasts}
        onDismiss={(id) => setToasts((previous) => previous.filter((t) => t.id !== id))}
      />
    </div>
  );
}
