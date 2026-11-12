import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { ProgressBar } from '@/components/common';
import type { Palette } from '@/theme/tokens';
import { hitSlop, radii, spacing, typography } from '@/theme/tokens';
import { useThemedStyles } from '@/theme/useThemedStyles';
import type { Enrollment } from '@/types';
import { formatRating } from '@/utils/course';

export interface CourseCardProps {
  enrollment: Enrollment;
  compact?: boolean;
  onPress?: (enrollment: Enrollment) => void;
  /** Visible call to action under the progress bar. */
  actionLabel?: string;
  testID?: string;
}

const THUMB_HEIGHT = 140;

function statusLabel(enrollment: Enrollment): string {
  if (enrollment.status === 'completed') {
    return 'Completed';
  }
  if (enrollment.status === 'not-started') {
    return 'Not started';
  }
  return 'In progress';
}

export function CourseCard({
  enrollment,
  compact = false,
  onPress,
  actionLabel,
  testID = 'course-card',
}: CourseCardProps) {
  const styles = useThemedStyles(createStyles);
  const { course } = enrollment;
  const { isDark } = useTheme();
  const progress = enrollment.progressPercent;

  const subtitle =
    enrollment.totalLessons > 0
      ? `${enrollment.completedLessons} of ${enrollment.totalLessons} lessons completed`
      : 'Awaiting first lesson launch';

  if (compact) return (
    <Pressable accessibilityRole="button" accessibilityLabel={course.title + ', ' + Math.round(progress) + '% complete'} onPress={() => onPress?.(enrollment)} testID={testID + '-' + enrollment.id} style={[styles.referenceCard, { backgroundColor: isDark ? '#252633' : '#FFFFFF', borderColor: isDark ? '#2C2D3A' : '#E3E3F3' }]}>
      <Image source={{ uri: course.thumbnailUrl }} style={styles.referenceThumb} testID={testID + '-thumbnail'} />
      <View style={styles.referenceBody}>
        <Text numberOfLines={2} style={styles.referenceTitle} testID={testID + '-title'}>{course.title}</Text>
        <Text numberOfLines={1} style={styles.instructor} testID={testID + '-instructor'}>{course.instructor.name}</Text>
        <View style={styles.referenceProgress}>
          <View style={{ flex: 1 }}><ProgressBar progress={progress} height={7} fillColor={isDark ? '#39DFA8' : '#A435F0'} trackColor={isDark ? '#3C3D4D' : '#E2E2F4'} testID={testID + '-progress'} /></View>
          <Text style={styles.referencePercent} testID={testID + '-percent'}>{Math.round(progress)}%</Text>
        </View>
        <View style={styles.referenceProgress}>
          <Text numberOfLines={1} style={styles.referenceAction} testID={testID + '-action'}>▶ {actionLabel || 'Continue learning'}</Text>
          <Text style={styles.lessonCount}>{enrollment.totalLessons} lessons ›</Text>
        </View>
      </View>
    </Pressable>
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${course.title}, ${Math.round(progress)}% complete`}
      hitSlop={hitSlop}
      onPress={() => onPress?.(enrollment)}
      style={styles.card}
      testID={`${testID}-${enrollment.id}`}>
      <View style={styles.thumbWrap}>
        <Image
          accessibilityIgnoresInvertColors
          source={{ uri: course.thumbnailUrl }}
          style={styles.thumb}
          testID={`${testID}-thumbnail`}
        />
        <View style={styles.statusBadge} testID={`${testID}-status`}>
          <Text style={styles.statusBadgeText}>{statusLabel(enrollment)}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text numberOfLines={2} style={styles.title} testID={`${testID}-title`}>
          {course.title}
        </Text>
        <Text numberOfLines={1} style={styles.subtitle}>
          {course.subtitle}
        </Text>
        <View style={styles.metaRow}>
          <Text numberOfLines={1} style={styles.instructor} testID={`${testID}-instructor`}>
            {course.instructor.name}
          </Text>
          <Text style={styles.rating} testID={`${testID}-rating`}>
            ★ {formatRating(course.rating)}
          </Text>
        </View>

        <View style={styles.progressRow}>
          <Text style={styles.progressPercent} testID={`${testID}-percent`}>
            {Math.round(progress)}%
          </Text>
          <Text style={styles.progressMeta} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>

        <ProgressBar
          accessibilityLabel={`${course.title} progress`}
          progress={progress}
          testID={`${testID}-progress`}
        />
        {actionLabel ? (
          <Text style={styles.actionLabel} testID={`${testID}-action`}>
            {actionLabel}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const createStyles = (palette: Palette) =>
  StyleSheet.create({
  referenceCard: { flexDirection: 'row', alignItems: 'center', padding: 10, gap: 12, borderRadius: 18, borderWidth: 1, marginBottom: 12, minHeight: 146 },
  referenceThumb: { width: '35%', aspectRatio: 1.15, borderRadius: 12, backgroundColor: palette.surfaceMuted },
  referenceBody: { flex: 1, minWidth: 0, gap: 9 },
  referenceTitle: { fontSize: 16, lineHeight: 21, fontWeight: '700', color: palette.textPrimary },
  referenceProgress: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  referencePercent: { fontSize: 12, fontWeight: '600', color: palette.textPrimary },
  referenceAction: { flex: 1, fontSize: 10, fontWeight: '600', color: palette.brand },
  lessonCount: { fontSize: 9, color: palette.textSecondary },
  card: {
    borderRadius: radii.lg,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  thumbWrap: {
    height: THUMB_HEIGHT,
    backgroundColor: palette.surfaceMuted,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  statusBadge: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(11, 16, 32, 0.82)',
  },
  statusBadgeText: {
    ...typography.caption,
    color: '#F1F3F9',
  },
  body: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  title: {
    ...typography.subtitle,
    color: palette.textPrimary,
  },
  subtitle: {
    ...typography.caption,
    color: palette.textMuted,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  instructor: {
    ...typography.caption,
    color: palette.textSecondary,
    flexShrink: 1,
  },
  rating: {
    ...typography.caption,
    color: palette.warning,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  progressPercent: {
    ...typography.mono,
    color: palette.accent,
  },
  progressMeta: {
    ...typography.caption,
    color: palette.textSecondary,
    flexShrink: 1,
  },
  actionLabel: {
    ...typography.caption,
    color: palette.accent,
    fontWeight: '700',
    marginTop: spacing.xxs,
  },
});

export default CourseCard;
