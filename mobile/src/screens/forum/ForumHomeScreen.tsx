import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OfflineBanner, ScreenHeader } from '@/components/common';
import { CategoryChips } from '@/components/forum/CategoryChips';
import { CreatePostModal } from '@/components/forum/CreatePostModal';
import { FloatingActionButton } from '@/components/forum/FloatingActionButton';
import { SortDropdown } from '@/components/forum/SortDropdown';
import { TagFilter } from '@/components/forum/TagFilter';
import { ThreadList } from '@/components/forum/ThreadList';
import { useForumThreads } from '@/hooks/useForumThreads';
import { useForumRealtime } from '@/hooks/useForumRealtime';
import { useSession } from '@/hooks/useSession';
import type { ScreenProps } from '@/navigation/types';
import { radii, spacing, typography } from '@/theme/tokens';
import type { Palette } from '@/theme/tokens';
import { useThemedStyles } from '@/theme/useThemedStyles';
import type { CreateThreadInput } from '@/types';

/**
 * Pages 5–10 — Community Forum home (Android).
 *
 * Native layout: app bar with a "New" action, a compact grid of section panels
 * (each one opens its own screen), a filter card with two fixed-height chip
 * rails, then the paginated discussion list and a floating compose button.
 */

type ForumPanelRoute =
  | 'ForumCategories'
  | 'Bookmarks'
  | 'ForumNotifications'
  | 'NotificationPreferences'
  | 'LiveStudio'
  | 'Moderation';

interface ForumPanel {
  label: string;
  icon: string;
  route: ForumPanelRoute;
  moderatorOnly?: boolean;
}

const FORUM_PANELS: readonly ForumPanel[] = [
  { label: 'Categories', icon: '🗂️', route: 'ForumCategories' },
  { label: 'Saved', icon: '🔖', route: 'Bookmarks' },
  { label: 'Notifications', icon: '🔔', route: 'ForumNotifications' },
  { label: 'Preferences', icon: '⚙️', route: 'NotificationPreferences' },
  { label: 'Live Studio', icon: '🎥', route: 'LiveStudio' },
  { label: 'Moderation', icon: '🛡️', route: 'Moderation', moderatorOnly: true },
];

export function ForumHomeScreen({ navigation, route }: ScreenProps<'ForumHome'>) {
  const styles = useThemedStyles(createStyles);
  const session = useSession();
  const submittingRef = useRef(false);
  const [composerVersion, setComposerVersion] = useState(0);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [composerError, setComposerError] = useState<string | null>(null);

  const {
    threads,
    categories,
    availableTags,
    filters,
    hasMore,
    isLoading,
    isRefreshing,
    hasError,
    error,
    isEmpty,
    isOffline,
    isFromCache,
    threshold,
    total,
    setCategoryId,
    setTags,
    setSort,
    onScrollProgress,
    refresh,
    createThread,
  } = useForumThreads({ initialCategoryId: route.params?.categoryId });

  useEffect(() => {
    const threadId = route.params?.threadId;
    if (threadId) navigation.navigate('ForumThread', { threadId });
  }, [navigation, route.params?.threadId]);

  useForumRealtime({ onDiscussionNew: refresh });

  const isModerator = ['admin', 'administrator', 'moderator', 'moderator:superuser']
    .includes((session.profile?.role ?? '').toLowerCase());

  const hasActiveFilters =
    filters.categoryId !== null || filters.tags.length > 0 || filters.sort !== 'newest';

  const openComposer = useCallback(() => {
    if (submittingRef.current) return;
    setComposerError(null);
    // Remount the sheet so it always opens with a clean draft and adopts the
    // category the user is currently browsing.
    setComposerVersion((value) => value + 1);
    setIsComposerOpen(true);
  }, []);

  const closeComposer = useCallback(() => {
    if (!submittingRef.current) setIsComposerOpen(false);
  }, []);

  const clearFilters = useCallback(() => {
    setCategoryId(null);
    setTags([]);
    setSort('newest');
  }, [setCategoryId, setSort, setTags]);

  const handleCreateThread = useCallback(
    async (input: CreateThreadInput) => {
      if (submittingRef.current) return;
      submittingRef.current = true;
      setIsSubmitting(true);
      setComposerError(null);
      try {
        await createThread(input);
        setIsComposerOpen(false);
        setComposerVersion(value => value + 1);
      } catch (cause) {
        setComposerError(
          cause instanceof Error ? cause.message : 'Could not post the thread.'
        );
      } finally {
        submittingRef.current = false;
        setIsSubmitting(false);
      }
    },
    [createThread]
  );

  const panels = FORUM_PANELS.filter((panel) => !panel.moderatorOnly || isModerator);

  const feedHeader = <View style={{ marginHorizontal: -16 }}>
      <ScreenHeader
        right={
          <Pressable
            accessibilityLabel="New discussion"
            accessibilityRole="button"
            hitSlop={8}
            onPress={openComposer}
            style={({ pressed }) => [styles.newButton, pressed && styles.pressed]}
            testID="forum-new-thread">
            <Text style={styles.newButtonLabel}>＋ New</Text>
          </Pressable>
        }
        subtitle={`${total} thread${total === 1 ? '' : 's'} in the community`}
        title="Forum"
      />

      <OfflineBanner
        message="You are offline — showing saved threads."
        visible={isOffline || isFromCache}
      />

      <View style={styles.panels} testID="forum-panels">
        {panels.map((panel) => (
          <Pressable
            accessibilityLabel={`Open community ${panel.label.toLowerCase()}`}
            accessibilityRole="button"
            key={panel.route}
            onPress={() => navigation.navigate(panel.route)}
            style={({ pressed }) => [styles.panel, pressed && styles.pressed]}
            testID={`forum-panel-${panel.route}`}>
            <Text style={styles.panelIcon}>{panel.icon}</Text>
            <Text style={styles.panelLabel}>{panel.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.filterCard} testID="forum-filters">
        <View style={styles.filterHeader}>
          <Text style={styles.filterTitle}>Filters</Text>
          <View style={styles.filterHeaderActions}>
            {hasActiveFilters ? (
              <Pressable
                accessibilityLabel="Clear filters"
                accessibilityRole="button"
                hitSlop={8}
                onPress={clearFilters}
                style={({ pressed }) => [styles.clearButton, pressed && styles.pressed]}
                testID="forum-clear-filters">
                <Text style={styles.clearLabel}>Clear</Text>
              </Pressable>
            ) : null}
            <SortDropdown onChange={setSort} value={filters.sort} />
          </View>
        </View>

        <CategoryChips
          categories={categories}
          onSelect={setCategoryId}
          selectedCategoryId={filters.categoryId}
        />

        {availableTags.length > 0 ? (
          <>
            <Text style={styles.railLabel}>Tags</Text>
            <TagFilter
              onChange={setTags}
              selectedTags={filters.tags}
              tags={availableTags}
            />
          </>
        ) : null}
      </View>

  </View>;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea} testID="forum-home">
      <View style={styles.listWrap}>
        <ThreadList
          header={feedHeader}
          categories={categories}
          emptyMessage="Try another category, clear your tags, or start the first thread."
          emptyTitle={isEmpty ? 'Nothing here yet' : undefined}
          errorMessage={error}
          hasError={hasError}
          hasMore={hasMore}
          isLoading={isLoading}
          isRefreshing={isRefreshing}
          onEndReached={() => onScrollProgress(threshold)}
          onEndReachedThreshold={threshold}
          onRefresh={refresh}
          onSelectThread={(thread) => navigation.navigate('ForumThread', { threadId: thread.id })}
          threads={threads}
        />
      </View>

      <FloatingActionButton onPress={openComposer} />

      <CreatePostModal
        key={composerVersion}
        availableTags={availableTags}
        categories={categories}
        errorMessage={composerError}
        initialCategoryId={filters.categoryId ?? undefined}
        isSubmitting={isSubmitting}
        onClose={closeComposer}
        onSubmit={handleCreateThread}
        visible={isComposerOpen}
      />
    </SafeAreaView>
  );
}

const createStyles = (palette: Palette) => StyleSheet.create({
  safeArea: {
    backgroundColor: palette.background,
    flex: 1,
  },
  newButton: {
    alignItems: 'center',
    backgroundColor: palette.brand,
    borderRadius: radii.pill,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: spacing.md,
  },
  newButtonLabel: {
    ...typography.label,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  panels: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
  },
  panel: {
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexBasis: '31%',
    flexGrow: 1,
    gap: 2,
    justifyContent: 'center',
    minHeight: 62,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  panelIcon: {
    fontSize: 18,
  },
  panelLabel: {
    color: palette.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  filterCard: {
    backgroundColor: palette.surface,
    borderBottomColor: palette.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingBottom: spacing.xxs,
    paddingTop: spacing.xs,
  },
  filterHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  filterTitle: {
    ...typography.label,
    color: palette.textPrimary,
  },
  filterHeaderActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  clearButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: spacing.xs,
  },
  clearLabel: {
    ...typography.caption,
    color: palette.danger,
    fontWeight: '700',
  },
  railLabel: {
    ...typography.caption,
    color: palette.textMuted,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xxs,
  },
  pressed: {
    opacity: 0.7,
  },
  listWrap: {
    flex: 1,
    marginTop: spacing.xxs,
  },
});

export default ForumHomeScreen;