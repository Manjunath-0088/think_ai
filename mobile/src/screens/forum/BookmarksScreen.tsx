import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/common';
import { BookmarkList } from '@/components/forum/BookmarkList';
import { SyncIndicator } from '@/components/forum/SyncIndicator';
import { useBookmarks } from '@/hooks/useBookmarks';
import type { ScreenProps } from '@/navigation/types';
import { palette, radii, spacing, typography } from '@/theme/tokens';

/**
 * Page 8 — Bookmarks (`/forum/bookmarks`).
 *
 * Saved threads with swipe-to-remove, a server `syncedAt` indicator and a
 * session-aware reload whenever the signed-in user changes.
 */
export function BookmarksScreen({ navigation }: ScreenProps<'Bookmarks'>) {
  const {
    bookmarks,
    syncedAt,
    isLoading,
    isRefreshing,
    hasError,
    error,
    isRemovingId,
    load,
    refresh,
    removeBookmark,
  } = useBookmarks();

  // Row-level failures restore the row and land here as a banner.
  const showRemovalError = hasError && bookmarks.length > 0;

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={styles.safeArea}
      testID="bookmarks-screen">
      <ScreenHeader
        right={
          <View style={styles.headerRight}>
            <SyncIndicator isSyncing={isRefreshing} syncedAt={syncedAt} />
          </View>
        }
        subtitle={`${bookmarks.length} saved thread${bookmarks.length === 1 ? '' : 's'}`}
        testID="bookmarks-header"
        title="Bookmarks"
      />

      {showRemovalError ? (
        <Text
          accessibilityLiveRegion="polite"
          style={styles.banner}
          testID="bookmarks-error-banner">
          {error}
        </Text>
      ) : null}

      <BookmarkList
        errorMessage={error ?? undefined}
        hasError={hasError && bookmarks.length === 0}
        isRefreshing={isRefreshing}
        isRemovingId={isRemovingId}
        isLoading={isLoading}
        onOpen={(record) =>
          navigation.navigate('ForumThread', { threadId: record.discussionId })
        }
        onRefresh={refresh}
        onRemove={(record) => void removeBookmark(record.discussionId)}
        onRetry={() => void load('initial')}
        bookmarks={bookmarks}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.background,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  banner: {
    ...typography.label,
    backgroundColor: 'rgba(248, 113, 113, 0.12)',
    borderColor: palette.danger,
    borderRadius: radii.sm,
    borderWidth: 1,
    color: palette.danger,
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
    padding: spacing.sm,
  },
});

export default BookmarksScreen;
