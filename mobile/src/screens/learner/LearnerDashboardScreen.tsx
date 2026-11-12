import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Platform,
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
} from '@/components/common';
import { ThinkzHomeHero } from '@/components/learner/ThinkzHomeHero';
import { CategoryChips } from '@/components/learner/CategoryChips';
import { CourseCard } from '@/components/learner/CourseCard';
import { CourseRail } from '@/components/learner/CourseRail';
import { SearchBar } from '@/components/learner/SearchBar';
import { SectionHeader } from '@/components/learner/SectionHeader';
import { AppearanceToggle, LearnerTabBar } from '@/components/learner';
import type { LearnerTabKey } from '@/components/learner';
import { LEARNER_TAB_ROUTES } from '@/components/learner/LearnerTabBar';
import { useCourseSearch } from '@/hooks/useCourseSearch';
import { useEnrollments } from '@/hooks/useEnrollments';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { useWishlist } from '@/hooks/useWishlist';
import type { ScreenProps } from '@/navigation/types';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing, typography } from '@/theme/tokens';
import type { Palette } from '@/theme/tokens';
import { useThemedStyles } from '@/theme/useThemedStyles';
import type { Course, CourseCategoryId, Enrollment } from '@/types';
import {
  COURSE_CATEGORIES,
  getCourseCategoryId,
  sortCourses,
} from '@/utils/course';
import NotificationDropdown from '@/features/notifications/components/NotificationDropdown';

export function LearnerDashboardScreen({
  navigation,
}: ScreenProps<'LearnerDashboard'>) {
  const styles = useThemedStyles(createStyles);
  const { palette, mode } = useTheme();
  const notificationColor = mode === 'dark' ? '#FFFFFF' : '#6D28D9';
  const { count: wishlistCount } = useWishlist();

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
      headerRight: () => (
        <AppearanceToggle compact testID="dashboard-appearance-toggle" />
      ),
    });
  }, [mode, navigation]);
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

  // The dashboard is discovery-led, so it also reads the catalogue. Failures
  // here never block the learner's own enrollments.
  const { courses: catalogCourses } = useCourseSearch({
    query: '',
    status: 'all',
  });

  const [query, setQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationAnchorRef = useRef<View>(null);

  const handleNotificationPress = useCallback(() => {
    setShowNotifications((prev) => !prev);
  }, []);

  const handleNotificationClose = useCallback(() => {
    setShowNotifications(false);
  }, []);

  const handleTabSelect = useCallback(
    (key: LearnerTabKey) => navigation.navigate(LEARNER_TAB_ROUTES[key] as never),
    [navigation]
  );

  const openCourse = useCallback(
    (enrollment: Enrollment) => {
      navigation.navigate('CourseDetail', { courseId: enrollment.courseId });
    },
    [navigation]
  );

  const openCatalogCourse = useCallback(
    (course: Course) => {
      navigation.navigate('CourseDetail', { courseId: course.id });
    },
    [navigation]
  );

  const openCategory = useCallback(
    (category: CourseCategoryId | 'all') => {
      navigation.navigate(
        'MyCourses',
        category === 'all' ? undefined : { category }
      );
    },
    [navigation]
  );

  const completedCount = enrollments.filter(
    (e) => e.status === 'completed'
  ).length;

  /** Every course the learner can see, de-duplicated by id. */
  const allCourses = useMemo(() => {
    const byId = new Map<string, Course>();
    for (const course of catalogCourses) {
      byId.set(course.id, course);
    }
    for (const enrollment of enrollments) {
      byId.set(enrollment.courseId, enrollment.course);
    }
    return [...byId.values()];
  }, [catalogCourses, enrollments]);

  const discovery = useMemo(
    () => allCourses.filter((course) => !course.isEnrolled),
    [allCourses]
  );

  const featured = useMemo(
    () => sortCourses(discovery, 'highest-rated').slice(0, 6),
    [discovery]
  );

  const recommended = useMemo(() => {
    const pool = discovery.length > 0 ? discovery : allCourses;
    return sortCourses(pool, 'recommended').slice(0, 6);
  }, [allCourses, discovery]);

  const categoryCounts = useMemo(() => {
    const counts: Partial<Record<CourseCategoryId | 'all', number>> = {
      all: allCourses.length,
    };
    for (const category of COURSE_CATEGORIES) {
      counts[category.id] = allCourses.filter(
        (course) => getCourseCategoryId(course) === category.id
      ).length;
    }
    return counts;
  }, [allCourses]);

  const showSkeleton = isLoading && enrollments.length === 0;
  const hasEnrollments = enrollments.length > 0;

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={styles.safeArea}
      testID="learner-dashboard">
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            onRefresh={refresh}
            refreshing={isRefreshing}
            tintColor={palette.brand}
            testID="dashboard-refresh-control"
          />
        }
        testID="dashboard-scroll-view">
        <View style={styles.brandRow}>
          <View style={styles.logoMark}><Text style={styles.logoLetters}>tz</Text></View><Text style={styles.brandTitle}>Thinkz <Text style={{ color: '#A435F0' }}>.ai</Text></Text>
          <View style={styles.headerRight}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Notifications"
              onPress={handleNotificationPress}
              hitSlop={10}
              ref={notificationAnchorRef}
              testID="notification-settings"
              style={({ pressed }) => [styles.notificationButton, { opacity: pressed ? 0.65 : 1 }]}>
              <View style={[styles.notificationFrame, { borderColor: notificationColor }]}>
                <View style={[styles.bell, { borderColor: notificationColor }]}>
                  <View style={[styles.bellClapper, { backgroundColor: notificationColor }]} />
                </View>
                <View style={styles.notificationBadge} testID="notification-badge" />
              </View>
            </Pressable>
            <NotificationDropdown
              visible={showNotifications}
              onClose={handleNotificationClose}
              anchorRef={notificationAnchorRef}
            />
            <AppearanceToggle compact testID="dashboard-appearance-toggle" />
          </View>
        </View>
        <SearchBar
          onChangeText={setQuery}
          onClear={() => setQuery('')}
          onSubmit={() => navigation.navigate('GlobalSearch')}
          placeholder="Search courses, lessons and forum…"
          testID="dashboard-search"
          value={query}
        />

        <ThinkzHomeHero onBrowse={() => navigation.navigate('MyCourses')} onLearning={() => navigation.navigate('MyLearning')} />
        {showSkeleton ? (
          <View style={styles.section}>
            <LoadingState rows={3} testID="dashboard-loading" />
          </View>
        ) : null}

        {hasError ? (
          <View style={styles.section}>
            <ErrorState
              message={error ?? 'Unable to load your enrollments.'}
              onRetry={refresh}
            />
          </View>
        ) : null}

        {!showSkeleton && !hasError && isEmpty ? (
          <View style={styles.emptyWrap}>
            <EmptyState
              actionLabel="Browse Course Catalog"
              icon="🚀"
              message="Explore available programs and bootcamps to begin tracking your lessons and certifications."
              onAction={() => navigation.navigate('MyCourses')}
              testID="dashboard-empty-state"
              title="You're not enrolled in any courses yet."
            />
          </View>
        ) : null}

        {!showSkeleton && !hasError ? (
          <View testID="dashboard-categories">
            <SectionHeader
              actionLabel="See All →"
              onAction={() => navigation.navigate('MyCourses')}
              title="Popular Categories"
            />
            <CategoryChips
              includeAll={false}
              tiles
              counts={categoryCounts}
              onChange={openCategory}
              testID="dashboard-category-chips"
              value="all"
            />
          </View>
        ) : null}

        {!showSkeleton && !hasError && hasEnrollments ? (
          <View testID="dashboard-continue">
            <SectionHeader
              actionLabel="My Learning"
              onAction={() => navigation.navigate('MyLearning')}
              testID="dashboard-continue-header"
              title="Continue learning"
            />
            <View style={styles.section} testID="dashboard-course-list">
              {enrollments.map((enrollment) => (
                <CourseCard
                  compact
                  actionLabel={
                    enrollment.status === 'completed'
                      ? 'Review course'
                      : 'Continue learning'
                  }
                  enrollment={enrollment}
                  key={enrollment.id}
                  onPress={openCourse}
                />
              ))}
            </View>
          </View>
        ) : null}

        {!showSkeleton && !hasError && recommended.length > 0 ? (
          <View testID="dashboard-recommended">
            <SectionHeader
              actionLabel="See all"
              onAction={() => navigation.navigate('MyCourses')}
              title="Recommended for you"
            />
            <CourseRail
              courses={recommended}
              onSelect={openCatalogCourse}
              testID="dashboard-recommended-rail"
            />
          </View>
        ) : null}

        {!showSkeleton && !hasError && featured.length > 0 ? (
          <View testID="dashboard-featured">
            <SectionHeader
              actionLabel="See all"
              onAction={() => navigation.navigate('MyCourses')}
              subtitle="Hand-picked by the Thinkz AI team"
              title="Featured courses"
            />
            <CourseRail
              courses={featured}
              onSelect={openCatalogCourse}
              testID="dashboard-featured-rail"
            />
          </View>
        ) : null}

        <Text style={styles.footer} testID="dashboard-enrollment-count">Enrolled {enrollments.length} · {completedCount} completed</Text>
        <Text style={styles.footer}>
          Keep going — a little practice every day compounds.
        </Text>
      </ScrollView>
      <LearnerTabBar active="home" onSelect={handleTabSelect} wishlistCount={wishlistCount} />
    </SafeAreaView>
  );
}

const createStyles = (palette: Palette) => StyleSheet.create({
  logoMark: { flexShrink: 0, width: 30, height: 30, backgroundColor: '#A435F0', borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  logoLetters: { color: '#1C1D1F', fontSize: 14, fontWeight: '700' },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, minHeight: 64, backgroundColor: palette.background === '#0B1020' ? '#28292B' : '#FFFFFF' },
  brandTitle: { flex: 1, minWidth: 0, flexShrink: 1, fontSize: 22, fontWeight: '700', color: palette.textPrimary },
  notificationButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
    backgroundColor: 'transparent',
  },
  notificationFrame: {
    // Match the adjacent theme frame's rendered size (its scale is 0.55).
    width: Platform.OS === 'android' ? 19.8 : 24.2,
    height: Platform.OS === 'android' ? 19.8 : 24.2,
    borderWidth: Platform.OS === 'android' ? 1.65 : 2.2,
    borderRadius: Platform.OS === 'android' ? 6.6 : 7.7,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  bell: {
    width: 10,
    height: 11,
    marginTop: -2,
    borderWidth: 1.3,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
  },
  bellClapper: {
    position: 'absolute',
    bottom: -4,
    left: 2,
    width: 3,
    height: 2,
    borderRadius: 2,
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: palette.background === '#0B1020' ? '#28292B' : '#FFFFFF',
    backgroundColor: '#F87171',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  safeArea: {
    flex: 1,
    backgroundColor: palette.background === '#0B1020' ? '#1C1D1F' : '#FFFFFF',
  },
  content: {
    paddingBottom: spacing.xxl,
    width: '100%',
    maxWidth: 1100,
    alignSelf: 'center',
  },
  section: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
  },
  emptyWrap: {
    marginTop: spacing.sm,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  browseButton: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    backgroundColor: palette.surfaceMuted,
  },
  browseLabel: {
    ...typography.label,
    color: palette.accent,
  },
  stat: {
    minWidth: 76,
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  statLabel: {
    ...typography.caption,
    color: palette.textMuted,
  },
  statValue: {
    ...typography.title,
    color: palette.textPrimary,
  },
  footer: {
    ...typography.caption,
    color: palette.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
});

export default LearnerDashboardScreen;
