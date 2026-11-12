import { useThemedStyles } from "@/theme/useThemedStyles";
import type { Palette } from "@/theme/tokens";
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { hitSlop, radii, spacing, typography } from '@/theme/tokens';
export interface TagFilterProps {
  tags: string[];
  selectedTags: string[];
  onChange: (nextSelected: string[]) => void;
  testID?: string;
}

const CHIP_HEIGHT = 44;
const RAIL_HEIGHT = CHIP_HEIGHT + spacing.xs * 2;
export function TagFilter({
  tags,
  selectedTags,
  onChange,
  testID = 'tag-filter'
}: TagFilterProps) {
  const styles = useThemedStyles(createStyles);
  if (tags.length === 0) {
    return null;
  }
  const toggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter(entry => entry !== tag));
      return;
    }
    // Multi-select: tapping an unselected tag adds it to the set.
    onChange([...selectedTags, tag]);
  };
  return <ScrollView style={styles.scroll} contentContainerStyle={styles.content} horizontal showsHorizontalScrollIndicator={false} bounces={false} testID={testID}>
      {tags.map(tag => {
      const isSelected = selectedTags.includes(tag);
      return <Pressable accessibilityLabel={tag} accessibilityRole="checkbox" accessibilityState={{
        checked: isSelected
      }} hitSlop={hitSlop} key={tag} onPress={() => toggle(tag)} style={[styles.chip, isSelected && styles.chipSelected]} testID={`${testID}-${tag}`}>
            <Text numberOfLines={1} style={[styles.label, isSelected && styles.labelSelected]}>
              {isSelected ? `✓ ${tag}` : tag}
            </Text>
          </Pressable>;
    })}
    </ScrollView>;
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
    backgroundColor: palette.surfaceMuted,
    borderColor: palette.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    flexGrow: 0,
    flexShrink: 0,
    height: CHIP_HEIGHT,
    justifyContent: 'center',
    maxHeight: CHIP_HEIGHT,
    minHeight: CHIP_HEIGHT,
    paddingHorizontal: spacing.sm
  },
  chipSelected: {
    backgroundColor: palette.brandAlt,
    borderColor: palette.brandAlt
  },
  label: {
    ...typography.caption,
    color: palette.textSecondary
  },
  labelSelected: {
    color: '#FFFFFF',
    fontWeight: '700'
  }
});
export default TagFilter;
