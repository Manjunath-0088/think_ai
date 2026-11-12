import { useTheme } from "@/theme/ThemeProvider";
import { useThemedStyles } from "@/theme/useThemedStyles";
import type { Palette } from "@/theme/tokens";
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { hitSlop, radii, spacing, typography } from '@/theme/tokens';
import type { ForumCategory } from '@/types';
export interface CategoryChipsProps {
  categories: ForumCategory[];
  selectedCategoryId: string | null;
  /** `null` selects the "All" chip. */
  onSelect: (categoryId: string | null) => void;
  testID?: string;
}
export const ALL_CATEGORY_LABEL = 'All';

/**
 * Native chip rail sizing. The rail and every chip take an explicit height so
 * Android (and react-native-web) can never stretch them to the height of the
 * surrounding flex container, which is what produced the tall "pill" grid.
 */
const CHIP_HEIGHT = 44;
const RAIL_HEIGHT = CHIP_HEIGHT + spacing.xs * 2;
export function CategoryChips({
  categories,
  selectedCategoryId,
  onSelect,
  testID = 'category-chips'
}: CategoryChipsProps) {
  const {
    palette
  } = useTheme();
  const styles = useThemedStyles(createStyles);
  return <ScrollView style={styles.scroll} contentContainerStyle={styles.content} horizontal showsHorizontalScrollIndicator={false} bounces={false} testID={testID}>
      <CategoryChip color={palette.brand} isSelected={selectedCategoryId === null} label={ALL_CATEGORY_LABEL} onPress={() => onSelect(null)} testID={`${testID}-all`} />
      {categories.map(category => <CategoryChip color={category.color || palette.brand} count={category.discussionCount} isSelected={selectedCategoryId === category.id} key={category.id} label={category.name} onPress={() => onSelect(category.id)} testID={`${testID}-${category.id}`} />)}
    </ScrollView>;
}
interface CategoryChipProps {
  label: string;
  color: string;
  count?: number;
  isSelected: boolean;
  onPress: () => void;
  testID: string;
}
function CategoryChip({
  label,
  color,
  count,
  isSelected,
  onPress,
  testID
}: CategoryChipProps) {
  const styles = useThemedStyles(createStyles);
  return <Pressable accessibilityLabel={count === undefined ? label : `${label}, ${count} discussions`} accessibilityRole="button" accessibilityState={{
    selected: isSelected
  }} hitSlop={hitSlop} onPress={onPress} style={[styles.chip, isSelected ? {
    backgroundColor: color,
    borderColor: color
  } : styles.chipIdle]} testID={testID}>
      <Text numberOfLines={1} style={[styles.label, isSelected && styles.labelSelected]}>
        {label}
      </Text>
    </Pressable>;
}
const createStyles = (palette: Palette) => StyleSheet.create({
  scroll: {
    flexGrow: 0,
    flexShrink: 0,
    height: RAIL_HEIGHT
  },
  content: {
    alignItems: 'center',
    flexGrow: 0,
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs
  },
  chip: {
    alignSelf: 'center',
    borderRadius: radii.pill,
    borderWidth: 1,
    flexGrow: 0,
    flexShrink: 0,
    height: CHIP_HEIGHT,
    justifyContent: 'center',
    maxHeight: CHIP_HEIGHT,
    minHeight: CHIP_HEIGHT,
    paddingHorizontal: spacing.md
  },
  chipIdle: {
    backgroundColor: palette.surfaceMuted,
    borderColor: palette.border
  },
  label: {
    ...typography.label,
    color: palette.textSecondary
  },
  labelSelected: {
    color: '#FFFFFF',
    fontWeight: '700'
  }
});
export default CategoryChips;
