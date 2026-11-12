import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import type { Palette } from '@/theme/tokens';
import { hitSlop, radii, spacing, typography } from '@/theme/tokens';
import { useThemedStyles } from '@/theme/useThemedStyles';
import type { CourseStatusFilter } from '@/types';

export const COURSE_STATUS_FILTERS: readonly {
  key: CourseStatusFilter;
  label: string;
}[] = [
  { key: 'all', label: 'All' },
  { key: 'in-progress', label: 'In-progress' },
  { key: 'completed', label: 'Completed' },
];

export interface FilterTabsProps {
  onSaved?: () => void;
  value: CourseStatusFilter;
  onChange: (next: CourseStatusFilter) => void;
  /** Optional per-tab result counts rendered in parentheses. */
  counts?: Partial<Record<CourseStatusFilter, number>>;
  testID?: string;
}

export function FilterTabs({
  value,
  onSaved,
  onChange,
  counts,
  testID = 'filter-tabs',
}: FilterTabsProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <ScrollView
      contentContainerStyle={styles.content}
      horizontal
      showsHorizontalScrollIndicator={false}
      testID={testID}>
      {(onSaved ? COURSE_STATUS_FILTERS.filter(filter => filter.key !== 'all') : COURSE_STATUS_FILTERS).map((filter) => {
        const isSelected = value === filter.key;
        const count = counts?.[filter.key];
        const label = count === undefined ? filter.label : `${filter.label} (${count})`;

        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={filter.label}
            hitSlop={hitSlop}
            key={filter.key}
            onPress={() => onChange(filter.key)}
            style={[styles.tab, isSelected && styles.tabSelected]}
            testID={`${testID}-${filter.key}`}>
            <Text style={[styles.label, isSelected && styles.labelSelected]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
      {onSaved ? <Pressable accessibilityRole="button" accessibilityLabel="Saved courses" onPress={onSaved} style={styles.tab}><Text style={styles.label}>Saved</Text></Pressable> : null}
    </ScrollView>
  );
}

const createStyles = (palette: Palette) =>
  StyleSheet.create({
  content: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    marginRight: spacing.xs,
  },
  tabSelected: {
    backgroundColor: '#A435F0',
    borderColor: '#A435F0',
  },
  label: {
    ...typography.label,
    color: palette.textSecondary,
  },
  labelSelected: {
    color: '#FFFFFF',
  },
});

export default FilterTabs;
