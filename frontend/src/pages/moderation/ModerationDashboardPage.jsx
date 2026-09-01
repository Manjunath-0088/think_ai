import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../../styles/moderation.css";

import FlaggedPosts from "../../components/moderation/FlaggedPosts";
import UserModeration from "../../components/moderation/UserModeration";
import ContentModeration from "../../components/moderation/ContentModeration";
import RichTextEditor from "../../components/moderation/RichTextEditor";
import NotificationToast from "../../components/forum/NotificationToast";

import {
  banUser,
  fetchFlaggedQueue,
  fetchModerationUsers,
  resolveContent,
  setContentVisibility,
  unbanUser,
} from "../../services/moderationApi";

/** Moderation dashboard (Phase 8). */
export default function ModerationDashboardPage() {
  const [flagged, setFlagged] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyIds, setBusyIds] = useState(() => new Set());
  const [toasts, setToasts] = useState([]);
  const [editorValue, setEditorValue] = useState(
    "**Notice:** Keep the community friendly.\n- Be kind\n- No spam"
  );

  const pushToast = useCallback((message) => {
    setToasts((previous) => [
      ...previous.slice(-2),
      { id: `mod-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`, type: "moderation", message },
    ]);
  }, []);

  const markBusy = (key, busy) =>
    setBusyIds((previous) => {
      const next = new Set(previous);
      if (busy) next.add(key);
      else next.delete(key);
      return next;
    });

  const load = useCallback(() => {
    Promise.all([fetchFlaggedQueue(), fetchModerationUsers()])
      .then(([queue, userList]) => {
        setFlagged(queue);
        setUsers(userList);
        setError(null);
      })
      .catch((err) => {
        console.error("Failed to load moderation data", err);
        setError("Failed to load moderation data");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggleHidden = async (item) => {
    const key = `${item.type}:${item.id}`;
    markBusy(key, true);
    try {
      const result = await setContentVisibility(item.id, item.type, !item.hidden);
      setFlagged((previous) =>
        previous.map((entry) =>
          entry.id === item.id && entry.type === item.type
            ? { ...entry, hidden: result.hidden }
            : entry
        )
      );
      pushToast(`${item.type === "discussion" ? "Discussion" : "Comment"} is now ${result.hidden ? "hidden" : "visible"}`);
    } catch (err) {
      pushToast(err.message || "Action failed");
    } finally {
      markBusy(key, false);
    }
  };

  const handleResolve = async (item) => {
    const key = `${item.type}:${item.id}`;
    markBusy(key, true);
    try {
      await resolveContent(item.id, item.type);
      setFlagged((previous) =>
        previous.filter((entry) => !(entry.id === item.id && entry.type === item.type))
      );
      pushToast("Item resolved and removed from the queue");
    } catch (err) {
      pushToast(err.message || "Could not resolve item");
    } finally {
      markBusy(key, false);
    }
  };

  const handleToggleVisibilityById = async (type, id) => {
    const key = `${type}:${id}`;
    markBusy(key, true);
    try {
      // Look up current state from the flagged queue when present.
      const known = flagged.find((f) => f.id === id && f.type === type);
      const result = await setContentVisibility(id, type, !(known?.hidden ?? false));
      pushToast(`${type} ${id} is now ${result.hidden ? "hidden" : "visible"}`);
      load();
    } catch (err) {
      pushToast(err.message || `Could not update ${type}`);
    } finally {
      markBusy(key, false);
    }
  };

  const handleToggleBan = async (user) => {
    markBusy(user.id, true);
    try {
      const updated = user.banned ? await unbanUser(user.id) : await banUser(user.id);
      setUsers((previous) => previous.map((u) => (u.id === user.id ? { ...u, ...updated } : u)));
      pushToast(`${updated.name} was ${updated.banned ? "banned" : "unbanned"}`);
    } catch (err) {
      pushToast(err.message || "Ban action failed");
    } finally {
      markBusy(user.id, false);
    }
  };

  return (
    <div className="moderation-page">
      <div className="moderation-container">
        <header className="moderation-header">
          <h1>🛡 Moderation Dashboard</h1>
          <Link to="/forum" className="btn btn--ghost btn--small">← Forum</Link>
          <button type="button" className="btn btn--small" onClick={load}>
            Refresh
          </button>
        </header>

        {error && (
          <div className="error-banner" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <p className="loading-note">Loading moderation data…</p>
        ) : (
          <div className="moderation-sections">
            <section aria-label="Flagged content">
              <h2 className="section-heading">🚩 Flagged content ({flagged.length})</h2>
              <FlaggedPosts
                items={flagged}
                onToggleHidden={handleToggleHidden}
                onResolve={handleResolve}
                busyIds={busyIds}
              />
              <div style={{ marginTop: 16 }}>
                <ContentModeration
                  onHideToggle={handleToggleVisibilityById}
                  busy={busyIds.size > 0}
                />
              </div>
            </section>

            <aside className="moderation-column" aria-label="Members and tools">
              <UserModeration users={users} onToggleBan={handleToggleBan} busyIds={busyIds} />
              <div className="studio-panel moderation-panel">
                <h2>Rich text editor</h2>
                <RichTextEditor value={editorValue} onChange={setEditorValue} placeholder="Write an announcement…" />
                <button
                  type="button"
                  className="btn btn--primary btn--small"
                  style={{ marginTop: 10 }}
                  onClick={() => pushToast("Announcement saved (mock)")}
                >
                  Save announcement
                </button>
              </div>
            </aside>
          </div>
        )}
      </div>

      <NotificationToast
        notifications={toasts}
        autoCloseMs={4000}
        onDismiss={(id) => setToasts((previous) => previous.filter((t) => t.id !== id))}
      />
    </div>
  );
}
