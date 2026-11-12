import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import type { Palette } from '@/theme/tokens';
import { radii, spacing, typography } from '@/theme/tokens';
import { useThemedStyles } from '@/theme/useThemedStyles';

const OPTIONS = [
  { mode: 'light' as const, label: 'Light', icon: '☀' },
  { mode: 'dark' as const, label: 'Dark', icon: '◐' },
];

export function AppearanceToggle({ testID = 'appearance-toggle', compact = false }: { testID?: string; compact?: boolean }) {
  const { mode, setMode } = useTheme();
  const styles = useThemedStyles(createStyles);

  if (compact) {
    const iconColor = mode === 'light' ? '#6D28D9' : '#FFFFFF';
    const nextMode = mode === 'light' ? 'dark' : 'light';
    const androidIconSize = Platform.OS === 'android';

    return (
      <Pressable
        accessibilityLabel={`Switch to ${nextMode} mode`}
        accessibilityRole="switch"
        accessibilityState={{ checked: mode === 'light' }}
        hitSlop={10}
        onPress={() => setMode(nextMode)}
        style={[
          styles.referenceButton,
          androidIconSize && styles.referenceButtonAndroid,
        ]}
        testID={testID}>
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[
            styles.referenceFrame,
            androidIconSize && styles.referenceFrameAndroid,
            { borderColor: iconColor },
          ]}>
          <View
            style={[
              styles.crescentClip,
              androidIconSize && styles.crescentClipAndroid,
            ]}>
            <View
              style={[
                styles.crescentBase,
                androidIconSize && styles.crescentBaseAndroid,
                { backgroundColor: iconColor },
              ]}
            />
            <View
              style={[
                styles.crescentCutout,
                androidIconSize && styles.crescentCutoutAndroid,
              ]}
            />
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <View accessibilityRole="radiogroup" accessibilityLabel="Theme mode" style={styles.control} testID={testID}>
      {OPTIONS.map((option) => {
        const selected = mode === option.mode;
        return (
          <Pressable
            accessibilityLabel={`${option.label} mode`}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            key={option.mode}
            onPress={() => setMode(option.mode)}
            style={[styles.option, selected && styles.optionSelected]}
            testID={`${testID}-${option.mode}`}>
            <Text style={[styles.icon, selected && styles.iconSelected]}>{option.icon}</Text>
            <Text style={[styles.label, selected && styles.labelSelected]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyles = (palette: Palette) => StyleSheet.create({
  control: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    padding: 3,
    gap: 3,
    borderRadius: radii.pill,
    backgroundColor: palette.surfaceMuted,
    borderWidth: 1,
    borderColor: palette.border,
  },
  option: {
    minWidth: 68,
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
  },
  referenceButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
  },
  referenceButtonAndroid: {
    backgroundColor: 'transparent',
  },
  referenceFrame: {
    transform: [{ scale: 0.55 }],
    flexShrink: 0,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderRadius: 14,
  },
  referenceFrameAndroid: {
    width: 36,
    height: 36,
    borderWidth: 3,
    borderRadius: 12,
  },
  crescentClip: {
    width: 25,
    height: 25,
    overflow: 'hidden',
  },
  crescentClipAndroid: {
    width: 20,
    height: 20,
  },
  crescentBase: {
    position: 'absolute',
    top: 1,
    left: 1,
    width: 23,
    height: 23,
    borderRadius: 12,
  },
  crescentBaseAndroid: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  crescentCutout: {
    position: 'absolute',
    top: -4,
    left: 9,
    width: 23,
    height: 23,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  crescentCutoutAndroid: {
    top: -3,
    left: 7,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: palette.surface,
  },
  optionSelected: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  icon: { ...typography.caption, color: palette.textMuted },
  iconCompact: { fontSize: 11, lineHeight: 14 },
  iconSelected: { color: palette.brand },
  label: { ...typography.caption, color: palette.textSecondary },
  labelCompact: { fontSize: 11, lineHeight: 15 },
  labelSelected: { color: palette.textPrimary, fontWeight: '700' },
});

export default AppearanceToggle;
