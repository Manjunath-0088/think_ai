import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError } from '@/api/http';
import {
  type BreakoutRoom,
  type StudioMessage,
  type StudioSession,
  createBreakoutRoom,
  createLivePoll,
  createLiveSession,
  getBreakoutRooms,
  getLiveMessages,
  joinBreakoutRoom,
  joinLiveSession,
  leaveBreakoutRoom,
  listLiveSessions,
  sendLiveMessage,
  updateLiveSessionStatus,
  voteLivePoll,
} from '@/api/liveStudioApi';
import { JitsiRoom } from '@/components/live/JitsiRoom';
import { allowsAudience } from '@/lms/access';
import { useLms } from '@/lms/LmsProvider';
import type { ScreenProps } from '@/navigation/types';
import { flushLiveChat, queueLiveChat } from '@/offline/liveChatQueue';
import { radii, spacing, typography } from '@/theme/tokens';
import type { Palette } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { useThemedStyles } from '@/theme/useThemedStyles';

const POLL_INTERVAL_MS = 8000;

const messageTime = (value: string) =>
  new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const formatSchedule = (value: string | null) => {
  if (!value) return 'No start time set';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const statusLabel = (status: string) => (status || 'scheduled').trim().toUpperCase();
const describeError = (caught: unknown, fallback: string) =>
  caught instanceof ApiError ? caught.message : fallback;

export function LiveStudioScreen({ route }: ScreenProps<'LiveStudio'>) {
  const { palette } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { account } = useLms();
  const canManage = allowsAudience('instructor', account?.role);

  const [sessions, setSessions] = useState<StudioSession[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(route.params?.sessionId ?? null);
  const [session, setSession] = useState<StudioSession | null>(null);
  const [messages, setMessages] = useState<StudioMessage[]>([]);
  const [rooms, setRooms] = useState<BreakoutRoom[]>([]);
  const [message, setMessage] = useState('');
  const [roomName, setRoomName] = useState('');
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState('Yes,No');
  const [title, setTitle] = useState('');
  const [schedule, setSchedule] = useState('');
  const [creating, setCreating] = useState(false);
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const activeSession = useRef<string | null>(selectedId);
  activeSession.current = selectedId;
  const inFlight = useRef<Set<string>>(new Set());

  const loadSessions = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    try {
      setSessions(await listLiveSessions());
    } catch (caught) {
      setListError(describeError(caught, 'Could not load live classes.'));
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    const next = route.params?.sessionId;
    if (next) setSelectedId((current) => current ?? next);
  }, [route.params?.sessionId]);

  const selectSession = useCallback((id: string) => {
    setVideoOpen(false);
    setSelectedId(id);
    setSession(null);
    setMessages([]);
    setRooms([]);
    setError(null);
    setNotice(null);
  }, []);

  const backToList = useCallback(() => {
    setVideoOpen(false);
    setSelectedId(null);
    setSession(null);
    setMessages([]);
    setRooms([]);
    setError(null);
    setNotice(null);
    void loadSessions();
  }, [loadSessions]);

  const refreshSession = useCallback(async () => {
    const target = selectedId;
    if (!target || inFlight.current.has(target)) return;
    inFlight.current.add(target);
    try {
      const [joined, nextMessages, nextRooms] = await Promise.all([
        joinLiveSession(target),
        getLiveMessages(target),
        getBreakoutRooms(target),
      ]);
      const flushed = await flushLiveChat(target);
      if (activeSession.current !== target) return;
      setSession(joined);
      setMessages(nextMessages);
      setRooms(nextRooms);
      setError(null);
      setNotice(flushed ? `${flushed} queued chat message${flushed === 1 ? '' : 's'} sent.` : null);
    } catch (caught) {
      if (activeSession.current !== target) return;
      if (caught instanceof ApiError && caught.status === 404) {
        setListError('That live class is no longer available.');
        setSelectedId(null);
        void loadSessions();
      } else {
        setError(describeError(caught, 'Could not reconnect to Live Studio.'));
      }
    } finally {
      inFlight.current.delete(target);
    }
  }, [selectedId, loadSessions]);

  useEffect(() => {
    if (!selectedId) return;
    void refreshSession();
    const timer = setInterval(() => void refreshSession(), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [selectedId, refreshSession]);

  const send = async () => {
    const text = message.trim();
    if (!text || !selectedId) return;
    setSending(true);
    try {
      const created = await sendLiveMessage(selectedId, text);
      if (activeSession.current !== selectedId) return;
      setMessages((current) => [...current.filter((item) => item.id !== created.id), created]);
      setMessage('');
      setError(null);
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 0) {
        await queueLiveChat(selectedId, text);
        setMessage('');
        setNotice('You are offline. Message queued and will send on reconnect.');
      } else {
        setError(describeError(caught, 'Message was not sent.'));
      }
    } finally {
      setSending(false);
    }
  };

  const makeRoom = async () => {
    if (!roomName.trim() || !selectedId) return;
    try {
      await createBreakoutRoom(selectedId, roomName.trim());
      setRoomName('');
      await refreshSession();
    } catch (caught) {
      setError(describeError(caught, 'Could not create room.'));
    }
  };

  const makePoll = async () => {
    const options = pollOptions.split(',').map((item) => item.trim()).filter(Boolean);
    if (!pollQuestion.trim() || options.length < 2 || !selectedId) {
      setError('Enter a question and two comma-separated options.');
      return;
    }
    try {
      await createLivePoll(selectedId, pollQuestion, options);
      setPollQuestion('');
      await refreshSession();
    } catch (caught) {
      setError(describeError(caught, 'Could not create poll.'));
    }
  };

  const vote = async (pollId: number, optionId: number) => {
    try {
      await voteLivePoll(pollId, optionId);
      await refreshSession();
    } catch (caught) {
      setError(describeError(caught, 'Vote was not saved.'));
    }
  };

  const roomAction = async (room: BreakoutRoom) => {
    try {
      if (room.members.length) await leaveBreakoutRoom(room.id);
      else await joinBreakoutRoom(room.id);
      await refreshSession();
    } catch (caught) {
      setError(describeError(caught, 'Could not update breakout room.'));
    }
  };

  const createSession = async () => {
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setListError('Enter a title for the live class.');
      return;
    }
    setCreating(true);
    setListError(null);
    try {
      const created = await createLiveSession({
        title: cleanTitle,
        scheduledAt: schedule.trim() || undefined,
      });
      setSessions((current) => [created, ...current.filter((item) => item.id !== created.id)]);
      setTitle('');
      setSchedule('');
      selectSession(created.id);
    } catch (caught) {
      setListError(describeError(caught, 'Could not create the live class.'));
    } finally {
      setCreating(false);
    }
  };

  const changeStatus = async (status: 'live' | 'ended') => {
    if (!selectedId) return;
    setUpdatingStatus(true);
    try {
      const updated = await updateLiveSessionStatus(selectedId, status);
      if (activeSession.current === selectedId) {
        setSession(updated);
        setNotice(status === 'live' ? 'The class is now live.' : 'The class has ended.');
      }
      void loadSessions();
    } catch (caught) {
      setError(describeError(caught, 'Could not update the class status.'));
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (selectedId && !session) {
    return (
      <SafeAreaView style={styles.center}>
        {error ? (
          <>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={() => void refreshSession()} style={styles.secondary}>
              <Text style={styles.secondaryText}>Try again</Text>
            </Pressable>
          </>
        ) : (
          <>
            <ActivityIndicator color={palette.brand} />
            <Text style={styles.muted}>Joining the live class…</Text>
          </>
        )}
        <Pressable onPress={backToList} style={styles.secondary}>
          <Text style={styles.secondaryText}>Back to all classes</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (!selectedId || !session) {
    return (
      <SafeAreaView edges={['left', 'right']} style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <Text style={styles.kicker}>LIVE CLASSES</Text>
            <Text style={styles.title}>Live Studio</Text>
            <Text style={styles.muted}>
              Join a scheduled class or, as an instructor or admin, create a new one. Video rooms use a
              short-lived Jitsi token issued by the server.
            </Text>
          </View>

          {listError ? (
            <Pressable style={styles.error} onPress={() => void loadSessions()}>
              <Text style={styles.errorText}>{listError} Tap to retry.</Text>
            </Pressable>
          ) : null}

          {canManage ? (
            <Section title="Schedule a live class">
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Class title"
                placeholderTextColor={palette.textMuted}
                style={styles.input}
              />
              <TextInput
                value={schedule}
                onChangeText={setSchedule}
                placeholder="Start: 2026-11-11T10:00"
                placeholderTextColor={palette.textMuted}
                autoCapitalize="none"
                style={styles.input}
              />
              <Text style={styles.muted}>Use an ISO date and time in the form YYYY-MM-DDTHH:mm.</Text>
              <Pressable
                onPress={() => void createSession()}
                disabled={creating}
                style={[styles.button, creating ? styles.disabled : null]}
              >
                <Text style={styles.buttonText}>{creating ? 'Creating…' : 'Create live class'}</Text>
              </Pressable>
            </Section>
          ) : null}

          <Section title="Upcoming and active sessions">
            {listLoading ? (
              <View style={styles.inlineLoading}>
                <ActivityIndicator color={palette.brand} />
                <Text style={styles.muted}>Loading live classes…</Text>
              </View>
            ) : sessions.length === 0 ? (
              <Text style={styles.muted}>No live classes have been scheduled yet.</Text>
            ) : (
              sessions.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => selectSession(item.id)}
                  style={styles.sessionCard}
                  accessibilityRole="button"
                >
                  <View style={styles.sessionHeader}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={[styles.badge, item.status === 'live' ? styles.badgeLive : null]}>
                      {statusLabel(item.status)}
                    </Text>
                  </View>
                  <Text style={styles.muted}>
                    {formatSchedule(item.scheduledAt)} · {item.attendees.filter((person) => person.online).length} online
                  </Text>
                  <Text style={styles.linkText}>Open class ›</Text>
                </Pressable>
              ))
            )}
          </Section>

          <Pressable onPress={() => void loadSessions()} style={styles.secondary}>
            <Text style={styles.secondaryText}>Refresh sessions</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const onlineCount = session.attendees.filter((person) => person.online).length;

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <Pressable onPress={backToList} accessibilityRole="button">
            <Text style={styles.linkText}>‹ All live classes</Text>
          </Pressable>
          <Text style={styles.kicker}>
            {statusLabel(session.status)} • {onlineCount} ONLINE
          </Text>
          <Text style={styles.title}>{session.title}</Text>
          <Text style={styles.muted}>
            {formatSchedule(session.scheduledAt)} · {session.attendees.length} participants · refreshes
            automatically
          </Text>
        </View>

        {error ? (
          <Pressable style={styles.error} onPress={() => void refreshSession()}>
            <Text style={styles.errorText}>{error} Tap to retry.</Text>
          </Pressable>
        ) : null}
        {notice ? (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>{notice}</Text>
          </View>
        ) : null}

        <View style={styles.video}>
          <View style={styles.rowBetween}>
            <Text style={styles.videoTitle}>Video room</Text>
            <Pressable
              onPress={() => setVideoOpen((current) => !current)}
              style={styles.secondary}
              accessibilityRole="button"
            >
              <Text style={styles.secondaryText}>{videoOpen ? 'Close video' : 'Join video'}</Text>
            </Pressable>
          </View>
          {videoOpen ? (
            <JitsiRoom key={session.id} sessionId={session.id} title={session.title} />
          ) : (
            <Text style={styles.muted}>
              Open the secure Jitsi room with your camera and microphone. Access is granted with a
              short-lived server token.
            </Text>
          )}
        </View>

        {canManage ? (
          <Section title="Class controls">
            <View style={styles.row}>
              <Pressable
                disabled={updatingStatus || session.status === 'live'}
                onPress={() => void changeStatus('live')}
                style={[styles.button, updatingStatus || session.status === 'live' ? styles.disabled : null]}
              >
                <Text style={styles.buttonText}>Start class</Text>
              </Pressable>
              <Pressable
                disabled={updatingStatus || session.status === 'ended'}
                onPress={() => void changeStatus('ended')}
                style={[styles.secondary, updatingStatus || session.status === 'ended' ? styles.disabled : null]}
              >
                <Text style={styles.secondaryText}>End class</Text>
              </Pressable>
            </View>
          </Section>
        ) : null}

        <Section title="Attendees">
          <View style={styles.chips}>
            {session.attendees.length ? (
              session.attendees.map((person) => (
                <Text key={person.userId} style={styles.chip}>
                  {person.online ? '●' : '○'} {person.name}
                </Text>
              ))
            ) : (
              <Text style={styles.muted}>No one has joined yet.</Text>
            )}
          </View>
        </Section>

        <Section title="Chat">
          <View style={styles.chat}>
            {messages.slice(-8).map((item) => (
              <View key={item.id} style={styles.message}>
                <Text style={styles.messageName}>
                  {item.userName} <Text style={styles.time}>{messageTime(item.timestamp)}</Text>
                </Text>
                <Text style={styles.messageText}>{item.deleted ? 'Message removed' : item.text}</Text>
              </View>
            ))}
            {messages.length === 0 ? <Text style={styles.muted}>No messages yet.</Text> : null}
          </View>
          <View style={styles.row}>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Send message"
              placeholderTextColor={palette.textMuted}
              style={styles.input}
            />
            <Pressable onPress={() => void send()} disabled={sending} style={styles.button}>
              <Text style={styles.buttonText}>{sending ? '…' : 'Send'}</Text>
            </Pressable>
          </View>
        </Section>

        <Section title="Polls">
          {session.polls.length ? (
            session.polls.map((poll) => (
              <View key={poll.id} style={styles.subcard}>
                <Text style={styles.cardTitle}>{poll.question}</Text>
                {poll.options.map((option) => (
                  <Pressable
                    key={option.id}
                    onPress={() => void vote(poll.id, option.id)}
                    style={styles.option}
                  >
                    <Text style={styles.optionText}>{option.text}</Text>
                    <Text style={styles.muted}>{option.percent}%</Text>
                  </Pressable>
                ))}
              </View>
            ))
          ) : (
            <Text style={styles.muted}>No active polls.</Text>
          )}
          {canManage ? (
            <>
              <TextInput
                value={pollQuestion}
                onChangeText={setPollQuestion}
                placeholder="New poll question"
                placeholderTextColor={palette.textMuted}
                style={styles.input}
              />
              <TextInput
                value={pollOptions}
                onChangeText={setPollOptions}
                placeholder="Option 1, Option 2"
                placeholderTextColor={palette.textMuted}
                style={styles.input}
              />
              <Pressable onPress={() => void makePoll()} style={styles.secondary}>
                <Text style={styles.secondaryText}>Create poll</Text>
              </Pressable>
            </>
          ) : null}
        </Section>

        <Section title="Breakout rooms">
          {rooms.map((room) => (
            <View key={room.id} style={styles.option}>
              <View>
                <Text style={styles.cardTitle}>{room.name}</Text>
                <Text style={styles.muted}>{room.members.length} members</Text>
              </View>
              <Pressable onPress={() => void roomAction(room)} style={styles.secondary}>
                <Text style={styles.secondaryText}>{room.members.length ? 'Leave' : 'Join'}</Text>
              </Pressable>
            </View>
          ))}
          {rooms.length === 0 ? <Text style={styles.muted}>No breakout rooms yet.</Text> : null}
          {canManage ? (
            <View style={styles.row}>
              <TextInput
                value={roomName}
                onChangeText={setRoomName}
                placeholder="New room name"
                placeholderTextColor={palette.textMuted}
                style={styles.input}
              />
              <Pressable onPress={() => void makeRoom()} style={styles.button}>
                <Text style={styles.buttonText}>Add</Text>
              </Pressable>
            </View>
          ) : null}
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const createStyles = (palette: Palette) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: palette.background },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.md,
      backgroundColor: palette.background,
    },
    content: { padding: spacing.md, gap: spacing.md },
    hero: { gap: spacing.xs },
    kicker: { ...typography.caption, color: palette.success, letterSpacing: 1 },
    title: { ...typography.title, color: palette.textPrimary },
    muted: { ...typography.body, color: palette.textSecondary },
    video: {
      backgroundColor: '#050814',
      borderRadius: radii.lg,
      padding: spacing.md,
      minHeight: 108,
      justifyContent: 'center',
      gap: spacing.sm,
      borderColor: palette.border,
      borderWidth: 1,
    },
    videoTitle: { ...typography.subtitle, color: palette.textPrimary },
    section: {
      backgroundColor: palette.surface,
      padding: spacing.md,
      borderRadius: radii.lg,
      gap: spacing.sm,
      borderColor: palette.border,
      borderWidth: 1,
    },
    sectionTitle: { ...typography.subtitle, color: palette.textPrimary },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
    chip: {
      ...typography.caption,
      backgroundColor: palette.surfaceMuted,
      color: palette.textPrimary,
      borderRadius: radii.pill,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    chat: { gap: spacing.sm },
    message: { borderLeftColor: palette.brand, borderLeftWidth: 2, paddingLeft: spacing.sm },
    messageName: { ...typography.label, color: palette.textPrimary },
    time: { color: palette.textMuted, fontWeight: '400' },
    messageText: { ...typography.body, color: palette.textSecondary },
    row: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center' },
    rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
    input: {
      flex: 1,
      minHeight: 44,
      borderWidth: 1,
      borderColor: palette.border,
      borderRadius: radii.md,
      color: palette.textPrimary,
      paddingHorizontal: spacing.sm,
      ...typography.body,
    },
    button: {
      minHeight: 44,
      borderRadius: radii.md,
      paddingHorizontal: spacing.md,
      justifyContent: 'center',
      backgroundColor: palette.brand,
    },
    buttonText: { ...typography.label, color: palette.textPrimary },
    subcard: { gap: spacing.xs, borderTopWidth: 1, borderColor: palette.border, paddingTop: spacing.sm },
    cardTitle: { ...typography.label, color: palette.textPrimary },
    option: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.xs,
    },
    optionText: { ...typography.body, color: palette.textPrimary, flex: 1 },
    secondary: {
      borderWidth: 1,
      borderColor: palette.brand,
      borderRadius: radii.md,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      justifyContent: 'center',
      minHeight: 36,
    },
    secondaryText: { ...typography.label, color: palette.brand },
    error: { backgroundColor: palette.overlay, borderRadius: radii.md, padding: spacing.sm },
    errorText: { ...typography.body, color: palette.danger },
    notice: {
      backgroundColor: palette.surfaceMuted,
      borderRadius: radii.md,
      padding: spacing.sm,
    },
    noticeText: { ...typography.caption, color: palette.textSecondary },
    sessionCard: {
      gap: spacing.xs,
      borderTopWidth: 1,
      borderColor: palette.border,
      paddingTop: spacing.sm,
    },
    sessionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
    badge: {
      ...typography.caption,
      color: palette.textSecondary,
      borderWidth: 1,
      borderColor: palette.border,
      borderRadius: radii.pill,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
    },
    badgeLive: { color: palette.success, borderColor: palette.success },
    linkText: { ...typography.label, color: palette.brand },
    disabled: { opacity: 0.5 },
    inlineLoading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  });
