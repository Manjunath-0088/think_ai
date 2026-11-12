// Adapted from the Desktop task archives to the current authenticated LMS API and data types.
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { getSession, type SessionState } from "@/api/session";
import { lmsApi, LmsApiError } from "@/lms/api";
import { acknowledgeProgress, loadQueue } from "@/lms/storage";
import { isAdministrator } from "@/lms/access";
import { HANDOVER_READ_API } from '@/lms/deployment';
import type { Progress } from "@/lms/types";
export function useProgressSync(session: SessionState, online: boolean, role: string | null, refreshAccess: () => Promise<void>) {
  const [syncStatus, setSyncStatus] = useState("Up to date");
  const [versions, setVersions] = useState<Record<string, Progress | null>>({});
  const accountRole = useRef<string | null>(null);
  accountRole.current = role || null;
  const busy = useRef(false);
  const currentOnline = useRef(online);
  currentOnline.current = online;
  const sync = useCallback(async () => {
    if (
      busy.current ||
      !online ||
      !session.token ||
      !accountRole.current ||
      isAdministrator(accountRole.current)
    )
      return;
    busy.current = true;
    const userId = session.userId;
    const token = session.token;
    try {
      let queue = await loadQueue(userId);
      if (!currentOnline.current || getSession().userId !== userId || getSession().token !== token) return;
      if (HANDOVER_READ_API) {
        setSyncStatus(queue.length ? 'Device updates retained; server watch-progress sync is unavailable.' : 'Server completion records are used; watch-progress sync is unavailable.');
        return;
      }
      if (queue.length) setSyncStatus(`Syncing ${queue.length} update(s)...`);
      let conflicts = 0;
      let batches = 0;
      let stalled = false;
      while (
        queue.length &&
        batches < 10 &&
        getSession().userId === userId &&
        getSession().token === token &&
        accountRole.current !== null &&
        !isAdministrator(accountRole.current)
      ) {
        batches += 1;
        const beforeBatch = JSON.stringify(queue);
        const sent = queue.slice(0, 100);
        batches++;
        const result = await lmsApi.sync(sent, token);
        if (getSession().userId !== userId || getSession().token !== token) break;
        conflicts += result.filter((r) => r.conflict).length;
        setVersions((old) => ({
          ...old,
          ...Object.fromEntries(
            result.map((r) => [`${r.enrollmentId}:${r.lessonId}`, r.progress]),
          ),
        }));
        await acknowledgeProgress(userId, sent, result);
        queue = await loadQueue(userId);
        if (JSON.stringify(queue) === beforeBatch) {
          // The queue did not change even though the batch completed. Stop
          // instead of retrying the same records in a tight loop.
          stalled = true;
          break;
        }
      }
      if (currentOnline.current && getSession().userId === userId && getSession().token === token)
        setSyncStatus(
          stalled
            ? "Some progress could not be confirmed; sync will retry."
            : queue.length
              ? "Progress synced; remaining updates will send shortly."
              : conflicts
                ? "Synced; newer server progress kept."
                : "Up to date",
        );
    } catch (e) {
      if (currentOnline.current && getSession().userId === userId && getSession().token === token)
        setSyncStatus(
          e instanceof LmsApiError && e.status === 401
            ? "Sign in again to sync."
            : "Progress saved on device; sync will retry.",
        );
    } finally {
      busy.current = false;
    }
  }, [online, session, role]);
  useEffect(() => {
    setVersions({});
  }, [session.userId, session.token]);
  useEffect(() => {
    if (!online) setSyncStatus("Offline - progress stays on this device");
    else void sync();
    const timer = setInterval(() => void sync(), 15000);
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void refreshAccess();
        void sync();
      }
    });
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [sync, online, refreshAccess]);
  return { syncStatus, sync, versions };
}
