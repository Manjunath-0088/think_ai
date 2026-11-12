import { useEffect, useMemo, useState } from 'react';

import { Channel, NotificationPrefs, SaveNotificationPrefsPayload } from '../types';
import { DEFAULT_PREFS } from '../constants';

export function useNotificationPreferences() {
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [original, setOriginal] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/notifications/preferences');
        const json: NotificationPrefs = await res.json();
        if (!cancelled) {
          setPrefs(json);
          setOriginal(json);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const hasUnsavedChanges = useMemo(
    () => JSON.stringify(prefs) !== JSON.stringify(original),
    [prefs, original]
  );

  const setGroupChannel = (group: keyof NotificationPrefs, channel: Channel, value: boolean) => {
    setPrefs((prev) => ({
      ...prev,
      [group]: { ...prev[group], [channel]: value },
    }));
  };

  const save = async (): Promise<boolean> => {
    setSaving(true);
    setError(null);
    try {
      const payload: SaveNotificationPrefsPayload = prefs;
      const res = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Save failed');
      setOriginal(prefs);
      setSavedAt(new Date());
      return true;
    } catch (e: any) {
      setError(e?.message || 'Failed to save');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setPrefs(original);
  };

  return {
    prefs,
    original,
    loading,
    saving,
    error,
    savedAt,
    hasUnsavedChanges,
    setGroupChannel,
    save,
    reset,
  };
}
