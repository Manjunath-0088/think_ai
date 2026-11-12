import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError } from '@/api/http';
import { listLiveSessions, type StudioSession } from '@/api/liveStudioApi';
import { getInstructorControls, saveInstructorControls, type InstructorControls } from '@/api/staffApi';
import type { ScreenProps } from '@/navigation/types';
import { radii, spacing, typography } from '@/theme/tokens';
import type { Palette } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { useThemedStyles } from '@/theme/useThemedStyles';

import { checklistItems } from './staffStorage';

const initialControls: InstructorControls = {
  muted: false,
  chatDisabled: false,
  spotlight: false,
  recording: false,
};

export function InstructorControlsScreen({ route }: ScreenProps<'InstructorControls'>) {
  const { palette } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [sessions, setSessions] = useState<StudioSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(route.params?.sessionId ?? null);
  const [done, setDone] = useState<string[]>([]);
  const [controls, setControls] = useState<InstructorControls>(initialControls);
  const [notice, setNotice] = useState('Loading server-saved session preparation…');
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    setSessionError(null);
    try {
      setSessions(await listLiveSessions());
    } catch (error) {
      setSessionError(error instanceof ApiError ? error.message : 'Could not load live classes.');
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!sessionId) void loadSessions();
  }, [sessionId, loadSessions]);

  useEffect(() => {
    const next = route.params?.sessionId;
    if (next) setSessionId(next);
  }, [route.params?.sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    setReady(false);
    void (async () => {
      try {
        const value = await getInstructorControls(sessionId);
        if (cancelled) return;
        setDone(value.checklist);
        setControls(value.controls);
        setNotice(value.updatedAt ? 'Loaded the shared server copy.' : 'Start the shared preparation checklist.');
      } catch (error) {
        if (cancelled) return;
        setNotice(error instanceof ApiError ? error.message : 'Could not load controls.');
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const persist = async (nextDone: string[], nextControls: InstructorControls, label: string) => {
    if (!sessionId) return;
    setDone(nextDone);
    setControls(nextControls);
    setSaving(true);
    try {
      await saveInstructorControls(sessionId, nextDone, nextControls);
      setNotice(`${label} saved for everyone on this session.`);
    } catch (error) {
      setNotice(error instanceof ApiError ? error.message : 'Save failed. Tap the change again to retry.');
    } finally {
      setSaving(false);
    }
  };

  const toggleCheck = (item: string) => {
    const next = done.includes(item) ? done.filter((value) => value !== item) : [...done, item];
    void persist(next, controls, 'Checklist');
  };

  const toggle = (key: keyof InstructorControls, label: string) => {
    const next = { ...controls, [key]: !controls[key] };
    void persist(done, next, label);
  };

  if (!sessionId) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Instructor controls</Text>
          <Text style={styles.note}>
            Choose the live class you want to prepare and manage. Controls are saved on the server for
            everyone in that session.
          </Text>
          {sessionError ? <Text style={styles.errorText}>{sessionError}</Text> : null}
          {sessionsLoading ? (
            <View style={styles.loading}>
              <ActivityIndicator color={palette.brand} />
              <Text style={styles.note}>Loading live classes…</Text>
            </View>
          ) : sessions.length === 0 ? (
            <Text style={styles.note}>
              No live classes exist yet. Create one from Live Studio, then return here to prepare it.
            </Text>
          ) : (
            sessions.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => setSessionId(item.id)}
                style={styles.item}
                accessibilityRole="button"
              >
                <Text style={styles.itemText}>{item.title}</Text>
                <Text style={styles.progress}>
                  {item.status.toUpperCase()} · {item.scheduledAt ? new Date(item.scheduledAt).toLocaleString() : 'No start time'}
                </Text>
              </Pressable>
            ))
          )}
          <Pressable onPress={() => void loadSessions()} style={styles.control}>
            <Text style={styles.controlText}>Refresh live classes</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!ready) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator color={palette.brand} />
        <Text style={styles.note}>Loading session preparation…</Text>
      </SafeAreaView>
    );
  }

  const selected = sessions.find((item) => item.id === sessionId);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Instructor controls</Text>
        <Text style={styles.note}>{saving ? 'Saving…' : notice}</Text>
        <View style={styles.sessionRow}>
          <Text style={styles.progress}>{selected ? selected.title : sessionId}</Text>
          <Pressable onPress={() => setSessionId(null)} style={styles.secondary} accessibilityRole="button">
            <Text style={styles.secondaryText}>Change class</Text>
          </Pressable>
        </View>
        <Text style={styles.section}>Session preparation</Text>
        {checklistItems.map((item) => (
          <Pressable
            disabled={saving}
            key={item}
            onPress={() => toggleCheck(item)}
            style={styles.item}
          >
            <Text style={done.includes(item) ? styles.done : styles.itemText}>
              {done.includes(item) ? '✓ ' : '○ '}
              {item}
            </Text>
          </Pressable>
        ))}
        <Text style={styles.progress}>
          {done.length} of {checklistItems.length} checks complete
        </Text>
        <Text style={styles.section}>Live controls</Text>
        <View style={styles.grid}>
          <Control
            label={controls.muted ? 'Unmute all' : 'Mute all'}
            onPress={() => toggle('muted', 'Mute all')}
          />
          <Control
            label={controls.chatDisabled ? 'Enable chat' : 'Disable chat'}
            onPress={() => toggle('chatDisabled', 'Chat')}
          />
          <Control
            label={controls.spotlight ? 'Remove spotlight' : 'Spotlight speaker'}
            onPress={() => toggle('spotlight', 'Spotlight')}
          />
          <Control
            label={controls.recording ? 'Stop recording' : 'Start recording'}
            onPress={() => toggle('recording', 'Recording')}
          />
        </View>
        <Text style={styles.section}>Post-session summary</Text>
        <View style={styles.summary}>
          <Text style={styles.summaryText}>Attendance: available in the attendance register</Text>
          <Text style={styles.summaryText}>Grading: available in the grading queue</Text>
          <Text style={styles.summaryText}>
            Recording: {controls.recording ? 'recording in progress' : 'not started'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Control({ label, onPress }: { label: string; onPress: () => void }) {
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable onPress={onPress} style={styles.control}>
      <Text style={styles.controlText}>{label}</Text>
    </Pressable>
  );
}

const createStyles = (palette: Palette) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: palette.background },
    content: { padding: spacing.md, gap: spacing.sm },
    title: { ...typography.title, color: palette.textPrimary },
    note: { ...typography.body, color: palette.textSecondary },
    errorText: { ...typography.body, color: palette.danger },
    loading: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.md,
      backgroundColor: palette.background,
    },
    sessionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
    section: { ...typography.subtitle, color: palette.textPrimary, marginTop: spacing.md },
    item: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderWidth: 1,
      borderRadius: radii.sm,
      padding: spacing.md,
    },
    itemText: { ...typography.body, color: palette.textPrimary },
    done: { ...typography.body, color: palette.success, textDecorationLine: 'line-through' },
    progress: { ...typography.caption, color: palette.brand },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    control: {
      width: '48%',
      minHeight: 64,
      justifyContent: 'center',
      padding: spacing.sm,
      borderRadius: radii.md,
      backgroundColor: palette.surfaceMuted,
    },
    controlText: { ...typography.label, color: palette.brand },
    secondary: {
      borderWidth: 1,
      borderColor: palette.brand,
      borderRadius: radii.md,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    secondaryText: { ...typography.label, color: palette.brand },
    summary: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderWidth: 1,
      borderRadius: radii.md,
      padding: spacing.md,
      gap: spacing.xs,
    },
    summaryText: { ...typography.body, color: palette.textSecondary },
  });
