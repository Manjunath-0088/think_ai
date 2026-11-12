import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { COURSE_CATEGORIES } from '@/utils/course';
import type { Palette } from '@/theme/tokens';
import { minTouchTarget, radii, spacing, typography } from '@/theme/tokens';
import { useThemedStyles } from '@/theme/useThemedStyles';
import type { CourseCategoryId } from '@/types';

export interface CategoryChipsProps {
  tiles?: boolean;
  value: CourseCategoryId | 'all';
  onChange: (next: CourseCategoryId | 'all') => void;
  includeAll?: boolean;
  counts?: Partial<Record<CourseCategoryId | 'all', number>>;
  testID?: string;
}

export function CategoryChips({
  value,
  tiles = false,
  onChange,
  includeAll = true,
  counts,
  testID = 'category-chips',
}: CategoryChipsProps) {
  const styles = useThemedStyles(createStyles);
  const options: { id: CourseCategoryId | 'all'; label: string; icon: string }[] =
    [
      ...(includeAll
        ? [{ id: 'all' as const, label: 'All courses', icon: '✨' }]
        : []),
      ...COURSE_CATEGORIES.map((category) => ({
        id: category.id,
        label: category.label,
        icon: category.icon,
      })),
    ];

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      horizontal
      showsHorizontalScrollIndicator={false}
      testID={testID}>
      {options.map((option, index) => {
        const selected = option.id === value;
        const count = counts?.[option.id];
        return (
          <Pressable
            accessibilityLabel={
              count === undefined ? option.label : `${option.label}, ${count} courses`
            }
            accessibilityRole="button"
            accessibilityState={{ selected }}
            key={option.id}
            onPress={() => onChange(option.id)}
            style={[styles.chip, selected && styles.chipSelected, tiles && styles.tile]}
            testID={`category-chip-${option.id}`}>
            <Text
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={[styles.icon, tiles && [styles.tileIcon, { backgroundColor: ['#A435F0', '#08B9CD', '#9657FF', '#53C93A', '#FF9D4B'][index % 5] }]]}>
              {option.icon}
            </Text>
            <Text numberOfLines={2} style={[styles.label, selected && styles.labelSelected, tiles && { fontSize: 10, textAlign: 'center' }]}>
              {option.label}
              {tiles || count === undefined ? '' : ` (${count})`}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const createStyles = (palette: Palette) =>
  StyleSheet.create({
  tile: { flexDirection: 'column', width: 78, paddingHorizontal: 4, paddingVertical: 8, borderRadius: 14, borderWidth: 0, backgroundColor: palette.surfaceMuted },
  tileIcon: { fontSize: 22, padding: 6, backgroundColor: '#A435F0', borderRadius: 10, overflow: 'hidden' },
  content: {
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  chip: {
    minHeight: minTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
  },
  chipSelected: {
    borderColor: palette.brand,
    backgroundColor: 'rgba(124, 58, 237, 0.22)',
  },
  icon: {
    fontSize: 14,
  },
  label: {
    ...typography.label,
    color: palette.textSecondary,
  },
  labelSelected: {
    color: palette.textPrimary,
  },
});

export default CategoryChips;
