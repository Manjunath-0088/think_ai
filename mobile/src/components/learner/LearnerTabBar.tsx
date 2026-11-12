import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Palette } from '@/theme/tokens';
import { minTouchTarget, radii, spacing, typography } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { useThemedStyles } from '@/theme/useThemedStyles';

import type { RootStackParamList } from '@/navigation/types';

export type LearnerTabKey =
  | 'home'
  | 'learning'
  | 'explore'
  | 'wishlist'
  | 'profile';

export type LearnerTabRoute = Extract<
  keyof RootStackParamList,
  'LearnerDashboard' | 'MyLearning' | 'MyCourses' | 'Wishlist' | 'Profile'
>;

export interface LearnerTab {
  key: LearnerTabKey;
  label: string;
  route: LearnerTabRoute;
}

/** Single source of truth for the learner's five primary destinations. */
export const LEARNER_TABS: readonly LearnerTab[] = [
  { key: 'home', label: 'Home', route: 'LearnerDashboard' },
  { key: 'explore', label: 'Search', route: 'MyCourses' },
  { key: 'learning', label: 'My Learning', route: 'MyLearning' },
  { key: 'wishlist', label: 'Wishlist', route: 'Wishlist' },
  { key: 'profile', label: 'Profile', route: 'Profile' },
] as const;

export const LEARNER_TAB_ROUTES: Record<LearnerTabKey, LearnerTabRoute> = {
  home: 'LearnerDashboard',
  learning: 'MyLearning',
  explore: 'MyCourses',
  wishlist: 'Wishlist',
  profile: 'Profile',
};

export interface LearnerTabBarProps {
  active: LearnerTabKey;
  onSelect: (key: LearnerTabKey) => void;
  /** Saved-course count shown on the Wishlist tab. */
  wishlistCount?: number;
  testID?: string;
}

/**
 * Custom bottom tab bar.
 *
 * The app deliberately does not use `@react-navigation/bottom-tabs`: the five
 * learner destinations already exist as stack routes (and are covered by deep
 * link tests), so rendering the bar inside each screen keeps those routes and
 * links intact while giving the learner a persistent, accessible tab strip.
 */
export function LearnerTabBar({
  active,
  onSelect,
  wishlistCount = 0,
  testID = 'learner-tab-bar',
}: LearnerTabBarProps) {
  const insets = useSafeAreaInsets();
  const { palette, isDark } = useTheme();
  const activeColor = isDark ? '#C578FF' : '#8710D8';
  const styles = useThemedStyles(createStyles);

  return (
    <View
      accessibilityRole="tablist"
      style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.xs), paddingLeft: insets.left, paddingRight: insets.right }]}
      testID={testID}>
      {LEARNER_TABS.map((tab) => {
        const isActive = tab.key === active;
        const showBadge = tab.key === 'wishlist' && wishlistCount > 0;
        const iconColor = isActive ? activeColor : palette.textSecondary;
        return (
          <Pressable
            accessibilityLabel={
              showBadge
                ? `${tab.label}, ${wishlistCount} saved course${
                    wishlistCount === 1 ? '' : 's'
                  }`
                : tab.label
            }
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            key={tab.key}
            onPress={() => onSelect(tab.key)}
            style={styles.item}
            testID={`tab-${tab.key}`}>
            <View style={styles.iconWrap}>
              <View
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={styles.vectorIcon}
                testID={`tab-icon-${tab.key}`}>
                {tab.key === 'home' ? (
                  <View style={styles.homeIcon}>
                    <View style={[styles.homeRoof, { borderColor: iconColor }]} />
                    <View style={[styles.homeBody, { borderColor: iconColor }]}>
                      <View style={[styles.homeDoor, { borderColor: iconColor }]} />
                    </View>
                  </View>
                ) : tab.key === 'learning' ? (
                  <View style={[styles.videoIcon, { borderColor: iconColor }]} testID="tab-icon-learning-video">
                    <View style={[styles.playTriangle, { borderLeftColor: iconColor }]} />
                  </View>
                ) : tab.key === 'explore' ? (
                  <View style={[styles.searchIcon, { borderColor: iconColor }]}>
                    <View style={[styles.searchHandle, { backgroundColor: iconColor }]} />
                  </View>
                ) : tab.key === 'wishlist' ? (
                  <Text style={[styles.heartIcon, { color: iconColor }]}>♡</Text>
                ) : (
                  <View style={styles.profileIcon}>
                    <View style={[styles.profileHead, { borderColor: iconColor }]} />
                    <View style={[styles.profileShoulders, { borderColor: iconColor }]} />
                  </View>
                )}
              </View>
              {showBadge ? (
                <View style={styles.badge} testID="tab-wishlist-badge">
                  <Text style={styles.badgeLabel}>
                    {wishlistCount > 9 ? '9+' : wishlistCount}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.82}
              style={[styles.label, isActive && [styles.labelActive, { color: activeColor }]]}>
              {tab.label}
            </Text>
            <View
              style={[styles.indicator, isActive && { backgroundColor: activeColor }]}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyles = (palette: Palette) =>
  StyleSheet.create({
    bar: {
      flexDirection: 'row',
      alignItems: 'stretch',
      paddingTop: spacing.xs,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: palette.border,
      backgroundColor: palette.background === '#0B1020' ? '#171822' : '#FCFCFF',
    },
    item: {
      flexGrow: 1,
      flexShrink: 1,
      flexBasis: 0,
      minWidth: 0,
      minHeight: Math.max(minTouchTarget, 64),
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingHorizontal: 2,
      paddingVertical: spacing.xs,
    },
    // Every destination uses the same 24 px icon viewport and button width so
    // the five-tab strip stays balanced on small Android screens.
    iconWrap: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
    vectorIcon: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
    homeIcon: { width: 20, height: 20, alignItems: 'center' },
    homeRoof: { position: 'absolute', top: 3, width: 11, height: 11, borderLeftWidth: 1.7, borderTopWidth: 1.7, transform: [{ rotate: '45deg' }] },
    homeBody: { position: 'absolute', top: 9, width: 15, height: 11, borderWidth: 1.7, borderTopWidth: 0, alignItems: 'center', justifyContent: 'flex-end' },
    homeDoor: { width: 4, height: 6, borderWidth: 1.5, borderBottomWidth: 0 },
    videoIcon: { width: 22, height: 17, borderWidth: 1.7, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
    playTriangle: { width: 0, height: 0, marginLeft: 2, borderTopWidth: 4, borderBottomWidth: 4, borderLeftWidth: 6, borderTopColor: 'transparent', borderBottomColor: 'transparent' },
    searchIcon: { width: 15, height: 15, borderRadius: radii.pill, borderWidth: 1.7, marginLeft: -3, marginTop: -3 },
    searchHandle: { position: 'absolute', width: 8, height: 1.7, top: 12, left: 10, transform: [{ rotate: '45deg' }] },
    heartIcon: { width: 24, height: 24, fontSize: 22, lineHeight: 24, textAlign: 'center' },
    profileIcon: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center', gap: 2 },
    profileHead: { width: 8, height: 8, borderWidth: 1.7, borderRadius: radii.pill },
    profileShoulders: { width: 17, height: 9, borderWidth: 1.7, borderTopLeftRadius: 9, borderTopRightRadius: 9, borderBottomWidth: 0 },
    label: {
      ...typography.caption,
      fontSize: 12,
      lineHeight: 18,
      fontWeight: '500',
      width: '100%',
      color: palette.textSecondary,
      textAlign: 'center',
    },
    labelActive: {
      color: palette.brand,
      fontWeight: '700',
    },
    indicator: {
      width: 18,
      height: 3,
      marginTop: 2,
      borderRadius: radii.pill,
      backgroundColor: 'transparent',
    },
    badge: {
      position: 'absolute',
      top: -2,
      right: -8,
      minWidth: 16,
      height: 16,
      paddingHorizontal: 4,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
      backgroundColor: palette.danger,
    },
    badgeLabel: {
      fontSize: 10,
      lineHeight: 12,
      fontWeight: '700',
      color: '#FFFFFF',
    },
  });

export default LearnerTabBar;
