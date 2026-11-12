import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  EmptyState,
  ErrorState,
  LoadingState,
  ScreenHeader,
} from '@/components/common';
import { CategoryChips } from '@/components/learner/CategoryChips';
import { CourseCard } from '@/components/learner/CourseCard';
import { FilterTabs } from '@/components/learner/FilterTabs';
import { SearchBar } from '@/components/learner/SearchBar';
import { LearnerTabBar } from '@/components/learner';
import type { LearnerTabKey } from '@/components/learner';
import { LEARNER_TAB_ROUTES } from '@/components/learner/LearnerTabBar';
import { useEnrollments } from '@/hooks/useEnrollments';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { useWishlist } from '@/hooks/useWishlist';
import type { ScreenProps } from '@/navigation/types';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing, typography } from '@/theme/tokens';
import type { Palette } from '@/theme/tokens';
import { useThemedStyles } from '@/theme/useThemedStyles';
import type {
  CourseCategoryId,
  CourseStatusFilter,
  Enrollment,
} from '@/types';
import {
  getCourseCategoryId,
  getResumeLesson,
  isCategoryMatch,
} from '@/utils/course';

export function MyLearningScreen({
  navigation,
}: ScreenProps<'MyLearning'>) {
  useEffect(() => { navigation.setOptions({ headerShown: false }); }, [navigation]);
  const styles = useThemedStyles(createStyles);
  const { palette } = useTheme();
  const { count: wishlistCount } = useWishlist();
  const {
    enrollments,
    isLoading,
    isRefreshing,
    hasError,
    error,
    isEmpty,
    refresh,
  } = useEnrollments();
  useRefreshOnFocus(navigation, refresh);

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<CourseStatusFilter>('all');
  const [category, setCategory] = useState<CourseCategoryId | 'all'>('all');
  const handleTabSelect = useCallback(
    (key: LearnerTabKey) => navigation.navigate(LEARNER_TAB_ROUTES[key] as never),
    [navigation]
  );

  const openCourse = useCallback(
    (enrollment: Enrollment) => {
      const resumeLesson = getResumeLesson(enrollment.course, enrollment);
      const courseId = Number(enrollment.courseId);
      const lessonId = resumeLesson ? Number(resumeLesson.id) : undefined;
      if (Number.isSafeInteger(courseId) && courseId > 0) {
        navigation.navigate('CoursePlayer', {
          courseId,
          ...(Number.isSafeInteger(lessonId) && lessonId! > 0 ? { lessonId } : {}),
        });
      } else {
        navigation.navigate('VideoPlayer', {
          courseId: enrollment.courseId,
          lessonId: resumeLesson?.id,
        });
      }
    },
    [navigation]
  );

  const stats = useMemo(() => {
    const completed = enrollments.filter(
      (enrollment) => enrollment.status === 'completed'
    ).length;
    const lessons = enrollments.reduce(
      (sum, enrollment) => sum + enrollment.completedLessons,
      0
    );
    return {
      completed,
      inProgress: enrollments.length - completed,
      lessons,
    };
  }, [enrollments]);

  const categoryCounts = useMemo(() => {
    const counts: Partial<Record<CourseCategoryId | 'all', number>> = {
      all: enrollments.length,
    };
    for (const enrollment of enrollments) {
      const id = getCourseCategoryId(enrollment.course);
      counts[id] = (counts[id] ?? 0) + 1;
    }
    return counts;
  }, [enrollments]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return enrollments.filter((enrollment) => {
      if (status !== 'all' && enrollment.status !== status) {
        return false;
      }
      if (!isCategoryMatch(enrollment.course, category)) {
        return false;
      }
      if (term === '') {
        return true;
      }
      const haystack = `${enrollment.course.title} ${enrollment.course.subtitle} ${enrollment.course.instructor.name}`;
      return haystack.toLowerCase().includes(term);
    });
  }, [category, enrollments, query, status]);

  const isInitialLoading = isLoading && enrollments.length === 0;

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={styles.safeArea}
      testID="my-learning">
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            onRefresh={refresh}
            refreshing={isRefreshing}
            tintColor={palette.brand}
            testID="my-learning-refresh-control"
          />
        }
        testID="my-learning-scroll-view">
        <ScreenHeader
          right={
            <View style={styles.headerAction}>
              <Text
                accessibilityRole="button"
                onPress={() => navigation.navigate('MyCourses')}
                style={styles.headerActionLabel}
                testID="my-learning-browse">
                Browse
              </Text>
            </View>
          }
          subtitle={`${stats.inProgress} in progress · ${stats.completed} completed`}
          title="My Learning"
          testID="my-learning-header"
        />

        <View style={styles.tabs}>
          <FilterTabs
            onSaved={() => navigation.navigate('Wishlist')}
            onChange={setStatus}
            testID="my-learning-filter-tabs"
            value={status}
          />
        </View>

        {isInitialLoading ? (
          <View style={styles.section}>
            <LoadingState rows={4} testID="my-learning-loading" />
          </View>
        ) : null}

        {hasError ? (
          <View style={styles.section}>
            <ErrorState
              message={error ?? 'Unable to load your learning.'}
              onRetry={refresh}
            />
          </View>
        ) : null}

        {!isInitialLoading && !hasError && isEmpty ? (
          <EmptyState
            actionLabel="Browse courses"
            icon="📚"
            message="Enroll in a course to see your progress, resume lessons and track completion here."
            onAction={() => navigation.navigate('MyCourses')}
            testID="my-learning-empty-state"
            title="Your learning shelf is empty"
          />
        ) : null}

        {!isInitialLoading &&
        !hasError &&
        !isEmpty &&
        filtered.length === 0 ? (
          <EmptyState
            icon="🔍"
            message="Try a different search term, category or status filter."
            testID="my-learning-no-results"
            title="No courses match your filters"
          />
        ) : null}

        {!hasError && filtered.length > 0 ? (
          <View style={styles.section} testID="my-learning-list">
            {filtered.map((enrollment) => (
              <CourseCard
                compact
                actionLabel={
                  enrollment.status === 'completed'
                    ? 'Review course'
                    : 'Resume learning'
                }
                enrollment={enrollment}
                key={enrollment.id}
                onPress={openCourse}
                testID="my-learning-card"
              />
            ))}
          </View>
        ) : null}

        <Pressable accessibilityRole="button" onPress={() => setStatus('all')} style={styles.headerAction} testID="my-learning-filter-tabs-all"><Text style={styles.headerActionLabel}>All my courses ({enrollments.length})</Text></Pressable>
        <View style={styles.statsRow} testID="my-learning-stats">
          <View style={styles.statCard}>
            <Text style={styles.statValue} testID="my-learning-stat-enrolled">
              {enrollments.length}
            </Text>
            <Text style={styles.statLabel}>Enrolled</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue} testID="my-learning-stat-lessons">
              {stats.lessons}
            </Text>
            <Text style={styles.statLabel}>Lessons done</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue} testID="my-learning-stat-completed">
              {stats.completed}
            </Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>

        <Pressable
          accessibilityLabel="Open Community Forum"
          accessibilityRole="button"
          onPress={() => navigation.navigate('ForumHome')}
          style={({ pressed }) => [styles.communityCard, pressed && styles.communityPressed]}
          testID="my-learning-community-forum">
          <View style={styles.communityIcon}>
            <Text style={styles.communityIconText}>C</Text>
          </View>
          <View style={styles.communityCopy}>
            <Text style={styles.communityTitle}>Community Forum</Text>
            <Text style={styles.communitySubtitle}>
              Ask questions, share ideas, and learn together
            </Text>
          </View>
          <Text accessibilityElementsHidden style={styles.communityArrow}>
            ›
          </Text>
        </Pressable>

        <SearchBar
          onChangeText={setQuery}
          onClear={() => setQuery('')}
          placeholder="Search your courses…"
          testID="my-learning-search"
          value={query}
        />

        <View style={styles.categories}>
          <CategoryChips
            counts={categoryCounts}
            onChange={setCategory}
            testID="my-learning-category-chips"
            value={category}
          />
        </View>

        {isRefreshing ? (
          <Text style={styles.refreshing} testID="my-learning-refreshing">
            Refreshing…
          </Text>
        ) : null}
      </ScrollView>
      <LearnerTabBar active="learning" onSelect={handleTabSelect} wishlistCount={wishlistCount} />
    </SafeAreaView>
  );
}

const createStyles = (palette: Palette) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.background === '#0B1020' ? '#171822' : '#FCFCFF',
  },
  content: {
    paddingBottom: spacing.xxl,
  },
  headerAction: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  headerActionLabel: {
    ...typography.label,
    color: palette.accent,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: 16,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  statValue: {
    ...typography.title,
    color: palette.textPrimary,
  },
  statLabel: {
    ...typography.caption,
    color: palette.textMuted,
  },
  communityCard: {
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    minHeight: 76,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  communityPressed: {
    opacity: 0.78,
  },
  communityIcon: {
    alignItems: 'center',
    backgroundColor: palette.brandAlt,
    borderRadius: 14,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  communityIconText: {
    ...typography.title,
    color: palette.textInverse,
    fontWeight: '700',
  },
  communityCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  communityTitle: {
    ...typography.label,
    color: palette.textPrimary,
  },
  communitySubtitle: {
    ...typography.caption,
    color: palette.textSecondary,
  },
  communityArrow: {
    ...typography.title,
    color: palette.brand,
  },
  categories: {
    marginTop: spacing.sm,
  },
  tabs: {
    marginTop: spacing.xs,
  },
  section: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
  },
  refreshing: {
    ...typography.caption,
    color: palette.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});

export default MyLearningScreen;
