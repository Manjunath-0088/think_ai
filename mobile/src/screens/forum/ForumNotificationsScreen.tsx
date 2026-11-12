import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { EmptyState, ScreenHeader } from '@/components/common';
import { useApiClient } from '@/hooks/useApiClient';
import { useForumRealtime } from '@/hooks/useForumRealtime';
import type { ScreenProps } from '@/navigation/types';
import { spacing, typography } from '@/theme/tokens';
import type { Palette } from '@/theme/tokens';
import { useThemedStyles } from '@/theme/useThemedStyles';
import type { CommunityNotification } from '@/types/community';

const NOTIFICATION_ICONS: Record<string, string> = {
  mention: '💬',
  reply: '💬',
  solved: '✓',
  moderation: '⚑',
  system: '•',
  bookmark: '♡',
  purchase: '₹',
};

function relativeTime(value: string): string {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return '';
  const minutes = Math.max(0, Math.round((Date.now() - timestamp) / 60_000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function discussionIdFromLink(link?: string | null): string | null {
  if (!link) return null;
  const match = link.match(/(?:^|\/)forum\/(.*?)(?:[?#]|$)/i);
  if (!match?.[1]) return null;
  const parts = match[1].split('/').filter(Boolean);
  if (parts[0] === 'threads' || parts[0] === 'thread') return parts[1] ?? null;
  if (['categories', 'bookmarks', 'notifications', 'new', 'studio', 'moderation', 'moderate', 'preferences'].includes(parts[0] ?? '')) return null;
  return parts[0] ?? null;
}

export function ForumNotificationsScreen({ navigation }: ScreenProps<'ForumNotifications'>) {
  const styles = useThemedStyles(createStyles);
  const client = useApiClient();
  const [notifications, setNotifications] = useState<CommunityNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      setNotifications(await client.fetchCommunityNotifications());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load notifications.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [client]);

  useFocusEffect(useCallback(() => {
    void load();
  }, [load]));

  const onNotification = useCallback((payload: unknown) => {
    if (!payload || typeof payload !== 'object' || !('id' in payload)) return;
    const notification = payload as CommunityNotification;
    setNotifications((current) => [
      notification,
      ...current.filter((item) => item.id !== notification.id),
    ]);
  }, []);
  useForumRealtime({ onNotification });

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  const markRead = async (notification: CommunityNotification) => {
    if (notification.read) return;
    try {
      const updated = await client.markCommunityNotificationRead(notification.id);
      setNotifications((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not mark notification as read.');
    }
  };

  const markAllRead = async () => {
    if (unreadCount === 0) return;
    setMarkingAll(true);
    setError(null);
    try {
      await client.markAllCommunityNotificationsRead();
      setNotifications((current) => current.map((item) => ({ ...item, read: true })));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not mark notifications as read.');
    } finally {
      setMarkingAll(false);
    }
  };

  const openNotification = (notification: CommunityNotification) => {
    const threadId = discussionIdFromLink(notification.link);
    if (threadId) navigation.navigate('ForumThread', { threadId });
    else navigation.navigate('ForumHome');
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea} testID="forum-notifications">
      <ScreenHeader
        right={unreadCount > 0 ? (
          <Pressable
            accessibilityLabel="Mark all notifications read"
            accessibilityRole="button"
            disabled={markingAll}
            onPress={() => void markAllRead()}
            style={styles.headerAction}>
            <Text style={styles.headerActionLabel}>{markingAll ? 'Saving…' : 'Mark all read'}</Text>
          </Pressable>
        ) : undefined}
        subtitle={unreadCount ? `${unreadCount} unread` : 'Community activity and updates'}
        title="Notifications"
      />
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator accessibilityLabel="Loading notifications" />
          <Text style={styles.muted}>Loading notifications…</Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={notifications}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl onRefresh={() => void load(true)} refreshing={refreshing} />}
          ListEmptyComponent={error ? undefined : (
            <EmptyState
              icon="🔔"
              message="Mentions, replies, and community updates will appear here."
              title="No notifications yet"
            />
          )}
          renderItem={({ item }) => (
            <View style={[styles.row, !item.read && styles.unreadRow]}>
              <Pressable
                accessibilityLabel={item.read ? item.message : `Unread notification: ${item.message}`}
                accessibilityRole="button"
                onPress={() => void markRead(item)}
                style={styles.notificationBody}>
                <View style={styles.iconWrap}>
                  <Text style={styles.icon}>{NOTIFICATION_ICONS[item.type] ?? '•'}</Text>
                </View>
                <View style={styles.copy}>
                  <Text style={styles.message}>{item.message}</Text>
                  <Text style={styles.time}>{relativeTime(item.createdAt)}</Text>
                </View>
                {!item.read ? <View accessibilityLabel="Unread" style={styles.unreadDot} /> : null}
              </Pressable>
              {item.link ? (
                <Pressable accessibilityRole="button" onPress={() => openNotification(item)} style={styles.openButton}>
                  <Text style={styles.openLabel}>Open</Text>
                </Pressable>
              ) : null}
            </View>
          )}
          testID="notification-list"
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (palette: Palette) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.background },
  headerAction: { justifyContent: 'center', minHeight: 44, paddingHorizontal: spacing.xs },
  headerActionLabel: { ...typography.caption, color: palette.brand, fontWeight: '700' },
  list: { flexGrow: 1, gap: spacing.sm, padding: spacing.md, paddingBottom: spacing.xxl },
  row: { backgroundColor: palette.surface, borderColor: palette.border, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  unreadRow: { borderColor: palette.brand },
  notificationBody: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, minHeight: 76, padding: spacing.md },
  iconWrap: { alignItems: 'center', backgroundColor: palette.surfaceMuted, borderRadius: 22, height: 44, justifyContent: 'center', width: 44 },
  icon: { color: palette.brand, fontSize: 20, fontWeight: '700' },
  copy: { flex: 1, gap: spacing.xxs },
  message: { ...typography.label, color: palette.textPrimary },
  time: { ...typography.caption, color: palette.textMuted },
  unreadDot: { backgroundColor: palette.brand, borderRadius: 5, height: 9, width: 9 },
  openButton: { alignItems: 'center', borderTopColor: palette.border, borderTopWidth: StyleSheet.hairlineWidth, justifyContent: 'center', minHeight: 44 },
  openLabel: { ...typography.label, color: palette.accent },
  loading: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, padding: spacing.md },
  muted: { ...typography.body, color: palette.textMuted },
  error: { ...typography.caption, color: palette.danger, marginHorizontal: spacing.md, marginBottom: spacing.xs },
});

export default ForumNotificationsScreen;
